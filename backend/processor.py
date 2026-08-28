"""
processor.py

Core retrieval + orchestration logic for M1.

process_event(event_id) is the single integration point:
    event_id -> lookup event/user/context -> placeholder risk result

M2 and M3 plug in by replacing the functions in the "PLUGGABLE COMPONENTS"
section below (or by passing their own callables into process_event via
the behaviour_fn / sequence_fn / context_fn parameters). Nothing else in
this file needs to change when M2/M3 land.
"""

from data_loader import store


# ---------------------------------------------------------------------------
# RETRIEVAL FUNCTIONS
# ---------------------------------------------------------------------------

def get_event(event_id):
    """Return the raw event dict for event_id, or None if not found."""
    return store.events_by_id.get(event_id)


def get_user_profile(user_id):
    """Return the raw user profile dict for user_id, or None if not found."""
    if user_id is None:
        return None
    return store.users_by_id.get(user_id)


def get_context(event):
    """
    Return the context row relevant to `event`, or None if no context
    applies.

    Matching rule (derived from the schema): a context row applies to an
    event when the context's related_user_id matches the event's user_id
    AND the event's timestamp falls within [start_time, end_time] of the
    context window (inclusive).

    Because context.csv is sparse (frequently just a handful of known
    windows — e.g. active incidents, approved maintenance), most events
    are expected to have NO matching context. That is a normal outcome,
    not an error, and callers must handle a None return explicitly.

    If more than one context window matches (overlapping windows for the
    same user), all matches are returned as a list under 'context_id'
    concatenation is avoided — instead the first match is returned and
    the fact that multiple matched is noted, so this ambiguity is never
    silently hidden.
    """
    user_id = event.get("user_id")
    ts = event.get("_parsed_timestamp")
    if user_id is None or ts is None:
        return None

    matches = []
    for ctx in store.contexts:
        if ctx.get("related_user_id") != user_id:
            continue
        start = ctx.get("_parsed_start")
        end = ctx.get("_parsed_end")
        if start is None or end is None:
            continue
        if start <= ts <= end:
            matches.append(ctx)

    if not matches:
        return None
    if len(matches) > 1:
        # Ambiguous: multiple context windows apply. Surface this rather
        # than silently picking one arbitrarily.
        first = dict(matches[0])
        first["_ambiguous_multiple_matches"] = True
        first["_matching_context_ids"] = [m.get("context_id") for m in matches]
        return first
    return matches[0]


def _public_event(event):
    """Strip internal helper fields before returning to callers/API."""
    if event is None:
        return None
    return {k: v for k, v in event.items() if not k.startswith("_")}


def _public_context(context):
    if context is None:
        return None
    return {k: v for k, v in context.items() if not k.startswith("_")}


# ---------------------------------------------------------------------------
# PLUGGABLE COMPONENTS (placeholders for M2 / M3)
# ---------------------------------------------------------------------------
#
# M2 will eventually replace `calculate_behaviour` with real logic that
# returns: {"behaviour_score": float, "signals": [...]}
#
# M3 will eventually replace `calculate_sequence` and `evaluate_context`
# with real logic that returns:
#   calculate_sequence -> {"sequence_score": float, "chain_detected": bool,
#                           "matched_steps": [...]}
#   evaluate_context    -> {"context_multiplier": float, "context_info": {...}}
#
# Until then, these return safe, inert placeholders. Do NOT invent real
# detection scores here.

def calculate_behaviour(event, user):
    """Placeholder for M2. Returns behaviour_score + signals."""
    return {
        "behaviour_score": 0.0,
        "signals": [],
    }


def calculate_sequence(event, user):
    """Placeholder for M3 (sequence part)."""
    return {
        "sequence_score": 0.0,
        "chain_detected": False,
        "matched_steps": [],
    }


def evaluate_context(event, context):
    """Placeholder for M3 (context part)."""
    return {
        "context_multiplier": 1.0,
        "context_info": _public_context(context),
    }


def combine_risk_score(behaviour_score, sequence_score, context_multiplier):
    """
    Placeholder combination formula. M2/M3 outputs feed in here; the
    exact weighting is intentionally simple and easy to swap out later
    without changing any caller.
    """
    combined = (behaviour_score + sequence_score) / 2.0
    risk_score = combined * context_multiplier
    return round(risk_score, 4)


def classify_severity(risk_score):
    """Map a risk_score in [0, 1] to a severity label."""
    if risk_score >= 0.6:
        return "HIGH"
    if risk_score >= 0.3:
        return "MODERATE"
    return "LOW"


# ---------------------------------------------------------------------------
# ERROR TYPES
# ---------------------------------------------------------------------------

class EventNotFoundError(Exception):
    def __init__(self, event_id):
        self.event_id = event_id
        super().__init__(f"Event '{event_id}' not found")


# ---------------------------------------------------------------------------
# MAIN ORCHESTRATION FUNCTION
# ---------------------------------------------------------------------------

def process_event(event_id, behaviour_fn=calculate_behaviour,
                   sequence_fn=calculate_sequence,
                   context_fn=evaluate_context):
    """
    Central integration function.

    behaviour_fn / sequence_fn / context_fn are injectable so M2 and M3
    can be wired in later (or unit-tested in isolation) without touching
    this function's body.

    Raises EventNotFoundError if event_id does not exist. Callers (e.g.
    the API layer) are responsible for turning that into an HTTP error.
    """
    event = get_event(event_id)
    if event is None:
        raise EventNotFoundError(event_id)

    user_id = event.get("user_id")
    user = get_user_profile(user_id)
    # A user profile may legitimately be missing (data integrity issue
    # upstream, or a not-yet-onboarded actor). We do not crash — we
    # surface it explicitly instead of silently treating it as a valid
    # user with default behaviour.
    user_status = "found" if user is not None else "not_found"

    context = get_context(event)
    context_status = "found" if context is not None else "no_context_found"

    behaviour_result = behaviour_fn(event, user)
    sequence_result = sequence_fn(event, user)
    context_result = context_fn(event, context)

    behaviour_score = behaviour_result.get("behaviour_score", 0.0)
    sequence_score = sequence_result.get("sequence_score", 0.0)
    context_multiplier = context_result.get("context_multiplier", 1.0)

    risk_score = combine_risk_score(behaviour_score, sequence_score,
                                     context_multiplier)
    severity = classify_severity(risk_score)

    signals = behaviour_result.get("signals", [])

    return {
        "event_id": event_id,
        "user_id": user_id,
        "user_status": user_status,
        "context_status": context_status,
        "behaviour_score": behaviour_score,
        "sequence_score": sequence_score,
        "context_multiplier": context_multiplier,
        "risk_score": risk_score,
        "severity": severity,
        "signals": signals,
        # Extra debug/plug-in detail — safe to ignore for now, useful
        # once M2/M3 are wired in.
        "_debug": {
            "event": _public_event(event),
            "user_profile": user,
            "context": _public_context(context),
            "chain_detected": sequence_result.get("chain_detected", False),
            "matched_steps": sequence_result.get("matched_steps", []),
        },
    }
