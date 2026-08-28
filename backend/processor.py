"""Deterministic SENTINEL behaviour, sequence, context, and risk engine."""
from datetime import datetime, timedelta

try:
    from .data_loader import store
    from .ml.predictor import predict_event
    from .ml.fusion import calculate_hybrid_risk, generate_explainability_summary
    from .llm import generate_narrative
except ImportError:
    from data_loader import store
    try:
        from ml.predictor import predict_event
        from ml.fusion import calculate_hybrid_risk, generate_explainability_summary
    except ImportError:
        predict_event = None
        calculate_hybrid_risk = None
        generate_explainability_summary = None
    try:
        from llm import generate_narrative
    except ImportError:
        generate_narrative = None

LOOKBACK_MINUTES = 60

SEQUENCE_STEPS = (
    ("UNUSUAL_LOGIN", lambda e, u: e.get("event_type") == "login" and (_flag(e, "new_device_flag") or _login_deviation(e, u) > _number(u, "login_hour_spread"))),
    ("SENSITIVE_ACCESS", lambda e, u: _flag(e, "sensitive_resource_flag")),
    ("PRIVILEGE_CHANGE", lambda e, u: _flag(e, "permission_change_flag")),
    ("BENEFICIARY_CHANGE", lambda e, u: _flag(e, "new_beneficiary_flag") or e.get("event_type") == "beneficiary_change"),
    ("LARGE_TRANSACTION", lambda e, u: _number(e, "transaction_amount") > 0 and (_flag(e, "exceeds_limit_flag") or _number(e, "transaction_amount") > max(_number(u, "avg_txn_amount") * 2, _number(u, "avg_txn_amount") + _number(u, "txn_amount_spread") * 2))),
    ("DATA_EXPORT", lambda e, u: e.get("event_type") == "data_export"),
)


def _number(row, key):
    try:
        return float((row or {}).get(key) or 0)
    except (TypeError, ValueError):
        return 0.0


def _flag(row, key):
    return _number(row, key) == 1


def _signal(name, contribution, description):
    return {"signal": name, "contribution": round(contribution, 2), "description": description}


def _login_deviation(event, user):
    actual = event.get("_parsed_timestamp")
    if actual is None or user is None:
        return 0.0
    difference = abs(actual.hour + actual.minute / 60 - _number(user, "typical_login_hour"))
    return min(difference, 24 - difference)


def _scaled(deviation, spread):
    return min(100.0, max(0.0, deviation / max(spread, 0.01) * 30))


def get_event(event_id):
    return store.events_by_id.get(event_id)


def get_user_profile(user_id):
    return store.users_by_id.get(user_id) if user_id is not None else None


def get_context(event):
    user_id = event.get("user_id")
    timestamp = event.get("_parsed_timestamp")
    if not user_id or timestamp is None:
        return None
    matches = [context for context in store.contexts
               if context.get("related_user_id") == user_id
               and context.get("_parsed_start") is not None
               and context.get("_parsed_end") is not None
               and context["_parsed_start"] <= timestamp <= context["_parsed_end"]]
    if not matches:
        return None
    if len(matches) > 1:
        result = dict(matches[0])
        result["_ambiguous_multiple_matches"] = True
        result["_matching_context_ids"] = [item.get("context_id") for item in matches]
        return result
    return matches[0]


def _public(row):
    return {key: value for key, value in (row or {}).items() if not key.startswith("_")}


def calculate_behaviour(event, user, history=None):
    history = history or []
    if user is None:
        return {"behaviour_score": 0.0, "signals": [], "risk_breakdown": {}}
    signals = []
    if event.get("event_type") == "login":
        deviation = _login_deviation(event, user)
        score = _scaled(deviation, _number(user, "login_hour_spread"))
        if score > 0:
            signals.append(_signal("UNUSUAL_LOGIN", min(15, score * 0.15), "Login time deviates from the user's historical login window."))
        if deviation > max(_number(user, "login_hour_spread") * 2, 1):
            signals.append(_signal("AFTER_HOURS", 15, "Activity occurred outside the user's normal login window."))
    if _flag(event, "new_device_flag"):
        signals.append(_signal("NEW_DEVICE", 15, "The event used a device marked new for this user."))
    if _flag(event, "sensitive_resource_flag"):
        signals.append(_signal("SENSITIVE_ACCESS", 15, "The event accessed a resource marked sensitive."))
        if _number(event, "records_accessed") > 100:
            signals.append(_signal("LARGE_DATA_ACCESS", 10, "The sensitive access covered an unusually large record count."))
    if _flag(event, "permission_change_flag"):
        signals.append(_signal("PRIVILEGE_CHANGE", 15, "The event changed the user's permission level."))
    if _flag(event, "new_beneficiary_flag"):
        signals.append(_signal("NEW_BENEFICIARY", 12, "The event introduced a new beneficiary."))
    amount = _number(event, "transaction_amount")
    if amount > 0:
        deviation = _scaled(abs(amount - _number(user, "avg_txn_amount")), _number(user, "txn_amount_spread"))
        if _flag(event, "exceeds_limit_flag"):
            deviation = 100
        if deviation > 0:
            signals.append(_signal("LARGE_TRANSACTION", min(24, deviation * 0.24), "Transaction amount is significantly above the user's historical baseline."))
        timestamp = event.get("_parsed_timestamp")
        prior_today = sum(1 for item in history if item.get("event_type") == "transaction" and item.get("_parsed_timestamp") and timestamp and item["_parsed_timestamp"].date() == timestamp.date())
        if prior_today + 1 > max(_number(user, "avg_txn_per_day"), 1) * 2:
            signals.append(_signal("HIGH_TRANSACTION_FREQUENCY", 10, "Transaction frequency exceeds the user's daily baseline."))
    score = min(100.0, round(sum(item["contribution"] for item in signals), 2))
    return {"behaviour_score": score, "signals": signals, "risk_breakdown": {item["signal"]: item["contribution"] for item in signals}}


def calculate_sequence(event, user, history=None):
    timestamp = event.get("_parsed_timestamp")
    if timestamp is None:
        return {"sequence_score": 0.0, "chain_detected": False, "matched_steps": []}
    history = sorted((history or []) + [event], key=lambda item: item.get("_parsed_timestamp") or timestamp)
    matched = []
    step_index = 0
    for item in history:
        if item.get("_parsed_timestamp") is None or item.get("_parsed_timestamp") > timestamp:
            continue
        if step_index < len(SEQUENCE_STEPS) and SEQUENCE_STEPS[step_index][1](item, user):
            matched.append({"step": SEQUENCE_STEPS[step_index][0], "event_id": item.get("event_id"), "timestamp": item.get("timestamp"), "matched": True})
            step_index += 1
    return {"sequence_score": round(len(matched) / len(SEQUENCE_STEPS) * 100, 2), "chain_detected": len(matched) >= 3, "matched_steps": matched}


def evaluate_context(event, context):
    if context is None:
        return {"context_multiplier": 1.0, "context_info": None, "context_status": "no_context_found"}
    if context.get("_ambiguous_multiple_matches"):
        return {"context_multiplier": 1.0, "context_info": _public(context), "context_status": "ambiguous"}
    approved = context.get("manager_approval_flag") in ("1", 1, True)
    return {"context_multiplier": 0.8 if approved else 1.0, "context_info": _public(context), "context_status": "found"}


def combine_risk_score(behaviour_score, sequence_score, context_multiplier):
    return round(min(100.0, max(0.0, (behaviour_score * 0.6 + sequence_score * 0.4) * context_multiplier)), 2)


def classify_severity(risk_score):
    if risk_score >= 75:
        return "CRITICAL"
    if risk_score >= 50:
        return "HIGH"
    if risk_score >= 25:
        return "MODERATE"
    return "LOW"


class EventNotFoundError(Exception):
    def __init__(self, event_id):
        self.event_id = event_id
        super().__init__(f"Event '{event_id}' not found")


def process_event(event_id, behaviour_fn=calculate_behaviour, sequence_fn=calculate_sequence, context_fn=evaluate_context, with_narrative=False):
    event = get_event(event_id)
    if event is None:
        raise EventNotFoundError(event_id)
    user = get_user_profile(event.get("user_id"))
    timestamp = event.get("_parsed_timestamp")
    history = [item for item in store.get_all_events() if item.get("user_id") == event.get("user_id") and item.get("_parsed_timestamp") is not None and timestamp is not None and timestamp - timedelta(minutes=LOOKBACK_MINUTES) <= item["_parsed_timestamp"] < timestamp]
    context = get_context(event)
    behaviour = behaviour_fn(event, user, history)
    sequence = sequence_fn(event, user, history)
    context_result = context_fn(event, context)
    context_multiplier = context_result.get("context_multiplier", 1.0)
    risk_score = combine_risk_score(behaviour.get("behaviour_score", 0), sequence.get("sequence_score", 0), context_multiplier)

    # ML Assessment & Hybrid Risk Fusion Layer
    ml_result = predict_event(event, user, history) if predict_event else {
        "status": "unavailable",
        "message": "ML predictor not loaded",
        "attack_probability": None,
        "prediction": None,
        "features": {},
        "contributing_features": [],
    }

    ml_prob = ml_result.get("attack_probability")
    hybrid = calculate_hybrid_risk(behaviour.get("behaviour_score", 0), sequence.get("sequence_score", 0), ml_prob, context_multiplier) if calculate_hybrid_risk else {
        "hybrid_score": risk_score,
        "fusion_mode": "deterministic_fallback",
        "weights": {"behaviour": 0.60, "sequence": 0.40, "ml": 0.0},
        "formula": "clamp((behaviour * 0.60 + sequence * 0.40) * context, 0, 100)",
    }

    seq_data = {"chain_detected": sequence.get("chain_detected", False), "matched_steps": sequence.get("matched_steps", [])}
    factors = generate_explainability_summary(
        behaviour.get("signals", []),
        seq_data,
        {"status": context_result.get("context_status", "no_context_found")},
        ml_result,
    ) if generate_explainability_summary else []

    res = {
        "event_id": event_id,
        "user_id": event.get("user_id"),
        "user_status": "found" if user else "not_found",
        "event": _public(event),
        "behaviour_score": behaviour.get("behaviour_score", 0.0),
        "sequence_score": sequence.get("sequence_score", 0.0),
        "context_multiplier": context_multiplier,
        "risk_score": risk_score,
        "severity": classify_severity(risk_score),
        "signals": behaviour.get("signals", []),
        "risk_breakdown": {**behaviour.get("risk_breakdown", {}), "sequence": sequence.get("sequence_score", 0.0)},
        "sequence": seq_data,
        "context": {"status": context_result.get("context_status", "no_context_found"), "info": context_result.get("context_info")},
        "context_status": context_result.get("context_status", "no_context_found"),
        "ml_assessment": ml_result,
        "hybrid_risk": hybrid,
        "explainability_factors": factors,
    }

    if with_narrative:
        if generate_narrative:
            narrative_res = generate_narrative(res, kind="event")
            res["narrative"] = narrative_res.get("narrative")
            res["narrative_status"] = narrative_res.get("narrative_status", "unavailable")
        else:
            res["narrative"] = None
            res["narrative_status"] = "unavailable"

    return res


def ingest_and_process_event(raw_event):
    """
    Unified Ingestion & Processing Pipeline:
    1. Schema validation.
    2. Dynamic storage in DataStore bounded buffer.
    3. Real-time scoring through feature extraction, behaviour, sequence, ML, and fusion.
    4. Alert evaluation and audit generation.
    """
    if not isinstance(raw_event, dict):
        raise ValueError("Event must be a JSON object")

    event_id = raw_event.get("event_id")
    user_id = raw_event.get("user_id")
    if not event_id or not user_id:
        raise ValueError("Event must contain 'event_id' and 'user_id'")

    if not raw_event.get("timestamp"):
        raw_event["timestamp"] = datetime.utcnow().isoformat()

    # Store event in bounded live buffer
    store.add_event(raw_event)

    # Execute full detection pipeline
    result = process_event(event_id)

    # Determine if alert is triggered
    is_alert = result["severity"] in {"HIGH", "CRITICAL"}
    alert_info = None
    if is_alert:
        alert_info = {
            "alert_id": f"ALT-{event_id}",
            "event_id": event_id,
            "user_id": user_id,
            "risk_score": result["risk_score"],
            "severity": result["severity"],
            "timestamp": result["event"].get("timestamp"),
            "signals": result["signals"],
            "chain_detected": result["sequence"]["chain_detected"],
        }

    return {
        "success": True,
        "event_id": event_id,
        "is_alert": is_alert,
        "alert": alert_info,
        "assessment": result,
    }
