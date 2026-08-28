# CSI ORIGIN PS9 — Backend / Integration Skeleton

Milestone: `event_id -> backend -> standardized risk JSON (placeholder scores)`

## 1. Dataset analysis

Three frozen CSV datasets were inspected before writing any code.

**`data/events.csv`** — 736 rows, columns:
`event_id, user_id, timestamp, event_type, resource_id, sensitive_resource_flag, records_accessed, device_id, new_device_flag, permission_change_flag, new_permission_level, beneficiary_id, new_beneficiary_flag, transaction_amount`
- No duplicate `event_id`s. Every `user_id` referenced exists in `users.csv` (no orphan events in the sample data — see Test 3 note below).
- `event_type` distribution: `file_access` (387), `login` (195), `transaction` (150), `permission_change` (2), `beneficiary_change` (2).
- `resource_id`, `new_permission_level`, and `beneficiary_id` are blank for most rows — this is **expected**, not missing data: each is only populated for the relevant `event_type` (e.g. `new_permission_level` only appears on `permission_change` events).
- Timestamps are ISO-8601, no timezone (`2026-03-02T01:05:00`), range `2026-03-02` to `2026-03-11`. All 736 parse cleanly with `datetime.fromisoformat`.

**`data/users.csv`** (user_profiles) — 20 rows, columns:
`user_id, role, actor_type, peer_group_id, typical_login_hour, login_hour_spread, avg_session_minutes, session_spread, avg_txn_amount, txn_amount_spread, avg_txn_per_day, home_device`
- One row per `user_id`, all referenced by events. These look like precomputed behavioural baseline stats (mean/spread), which matches the PS's description of "behavioural baselines" that M2 will consume.

**`data/context.csv`** (contexts) — **1 row**:
`context_id, related_user_id, type, start_time, end_time, manager_approval_flag`
- Only one context window exists in the provided sample (`CTX_SCEN_SUPPRESSED_01`, user `U002`, `active_incident`, 2026-03-11T01:43–04:13, manager-approved).
- This is very sparse by design (or by current sample size) — most events will have **no** matching context, and the backend treats that as a normal, expected outcome rather than an error.

**Relationships (how the datasets join):**
- event → user: `events.user_id == users.user_id` (1:1 lookup).
- event → context: `events.user_id == context.related_user_id AND context.start_time <= event.timestamp <= context.end_time`. This is an *inferred* rule — the schema doesn't explicitly document it, but it's the only sensible interpretation given the columns available (a context is a **time-bounded window** tied to a user). This is flagged here explicitly as an assumption, per the brief's instruction not to silently invent relationships.
- **Ambiguity handled explicitly:** if a user ever has two overlapping context windows, `get_context()` does not silently pick one — it returns the first match but flags `_ambiguous_multiple_matches: True` and lists all matching context IDs, so this is visible rather than hidden.

**A note on `ground_truth.csv`:** this file was provided in the upload but is **not** one of the three datasets named in the brief (`user_profiles`, `events`, `contexts`). It looks like an evaluation/labels file (`event_id, is_attack, scenario_id`) intended for scoring M2/M3's eventual detection output, not for the M1 backend to consume. It has therefore **not** been wired into the backend — flagging this rather than silently ignoring it or silently using it to fabricate scores.

## 2. Architecture

**Flask**, not Django — chosen after inspecting the data because the entire "database" is three small, static CSV files loaded once into memory (no writes, no migrations, no multi-user auth needed for this milestone). Django's ORM/ migrations/ admin machinery would be unused weight; Flask gives one route file and no unnecessary infrastructure, consistent with "use the simplest architecture that satisfies the requirements."

```
backend/
├── app.py              # Flask app, single API route
├── data_loader.py       # loads events.csv / users.csv / context.csv into memory, indexed
├── processor.py         # get_event / get_user_profile / get_context / process_event + M2/M3 plug points
├── requirements.txt
├── data/
│   ├── events.csv        (unmodified copy of provided data)
│   ├── users.csv          (unmodified copy of provided data)
│   └── context.csv        (unmodified copy of provided data)
└── tests/
    └── test_processor.py
```

## 3. Implementation

See `data_loader.py`, `processor.py`, `app.py` in this directory (already created).

## 4. How to run

From a fresh environment:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Server starts at `http://127.0.0.1:5000`.

## 5. API usage

Request:
```
GET http://127.0.0.1:5000/api/events/E000664/risk/
```

Response (200):
```json
{
  "event_id": "E000664",
  "user_id": "U002",
  "user_status": "found",
  "context_status": "found",
  "behaviour_score": 0.0,
  "sequence_score": 0.0,
  "context_multiplier": 1.0,
  "risk_score": 0.0,
  "severity": "LOW",
  "signals": [],
  "_debug": { "...": "raw event/user/context + placeholder detection fields, for M2/M3 wiring" }
}
```

Nonexistent event:
```
GET /api/events/E999999/risk/   -> HTTP 404
{"error": "event_not_found", "message": "Event 'E999999' does not exist.", "event_id": "E999999"}
```

## 6. Testing

```bash
python -m pytest tests/ -v
```

6 tests, all passing:
- **Test 1** (`E000001`, user `U006`) — valid event, no matching context → correct standardized JSON.
- **Test 1b** (`E000664`, user `U002`) — valid event **inside** the one real context window → context correctly matched.
- **Test 1c** (`E000684`, user `U002`, same day but outside the window) — confirms context matching is time-bounded, not just user-based.
- **Test 2** (`E999999`) — nonexistent event → `EventNotFoundError` raised / API returns 404.
- **Test 3** — event referencing a nonexistent user. The provided dataset has no such row for real (verified during inspection), so this is demonstrated by injecting a synthetic event into the in-memory store at test time, then cleaning it up. `process_event` returns `user_status: "not_found"` and `user_profile: null` instead of crashing.
- Direct unit tests of `get_event` / `get_user_profile` / `get_context`.

## 7. M2/M3 integration instructions

`process_event()` in `processor.py` accepts injectable functions:

```python
process_event(event_id,
               behaviour_fn=calculate_behaviour,
               sequence_fn=calculate_sequence,
               context_fn=evaluate_context)
```

To integrate:

- **M2** replaces `calculate_behaviour(event, user)` in `processor.py`. Must return:
  ```python
  {"behaviour_score": float, "signals": [...]}
  ```
- **M3** replaces `calculate_sequence(event, user)`, must return:
  ```python
  {"sequence_score": float, "chain_detected": bool, "matched_steps": [...]}
  ```
  and `evaluate_context(event, context)`, must return:
  ```python
  {"context_multiplier": float, "context_info": {...}}
  ```

No other file needs to change — `app.py` and `data_loader.py` are untouched by this swap. `combine_risk_score()` and `classify_severity()` are also isolated single-purpose functions if the scoring formula/thresholds need tuning later.

## 8. What was deliberately NOT done

- No ML / anomaly detection / real scoring logic — all scores are inert placeholders (0.0 / 1.0 / LOW), per the brief.
- No Kafka/Redis/Celery/microservices/extra databases.
- No frontend.
- The three datasets in `data/` are byte-for-byte copies of the provided files — no fields renamed, added, removed, or reinterpreted.
