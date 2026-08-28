# API Reference

The Flask API is the public integration boundary. It runs at `http://127.0.0.1:5000` and permits local origins `127.0.0.1:3000` and `localhost:3000`.

## `GET /api/health`

Returns service counts: `status`, `events`, `users`, and `contexts`.

## `GET /api/alerts`

Evaluates runtime events and returns high-risk alerts sorted by descending risk. Each alert contains `alert_id`, `event_id`, `user_id`, `timestamp`, `risk_score`, `severity`, `signals`, and `chain_detected`.

## `GET /api/identities`

Returns identity records derived from `output/users.csv`.

## `GET /api/events/{event_id}/risk/`

Returns the comprehensive multi-layered risk assessment for a specific event:
- Deterministic behavior score, signals, and sequence matched steps.
- Authorizing operational context and multiplier.
- `risk_score` and `severity`: 100% deterministic v1 score (regression protected).
- `ml_assessment`: ML classifier status, attack probability, binary prediction, confidence, and contributing feature factors.
- `hybrid_risk`: Mathematical fusion score combining behaviour, sequence, ML probability, and context.
- `explainability_factors`: Human-readable SOC bullet points.

Missing events return HTTP 404:

```json
{"error":"event_not_found","message":"Event 'E999999' does not exist.","event_id":"E999999"}
```

## `GET /api/ml/status`

Returns active ML model metadata, operational status, version, feature definitions, and training metrics:

```json
{
  "available": true,
  "status": "loaded",
  "model_name": "RandomForestClassifier",
  "model_version": "1.0.0",
  "trained_at": "2026-08-28T18:02:15Z",
  "features": [
    "login_deviation_score", "after_hours_flag", "new_device_flag",
    "sensitive_access_flag", "records_accessed_score", "permission_change_flag",
    "new_beneficiary_flag", "transaction_amount_score", "transaction_frequency_score",
    "sequence_matched_ratio"
  ],
  "training_metadata": { "split_method": "stratified_60_20_20" }
}
```

## `GET /api/incidents`

Returns correlated multi-stage security incidents (`INC-001`, `INC-002`, etc.) grouped by actor and temporal sequence lookback:

```json
[
  {
    "incident_id": "INC-001",
    "user_id": "U001",
    "title": "Correlated Multi-Stage Activity (U001)",
    "start_time": "2026-03-02T02:11:04",
    "end_time": "2026-03-02T02:22:15",
    "event_count": 6,
    "max_risk_score": 88.0,
    "severity": "CRITICAL",
    "investigation_priority": "P1 — Immediate",
    "status": "OPEN",
    "stages": [
      { "stage_id": "STAGE_1", "name": "Ingress & Credential Usage", "events": [...] },
      { "stage_id": "STAGE_2", "name": "Privilege Escalation", "events": [...] },
      { "stage_id": "STAGE_3", "name": "Discovery & Sensitive Access", "events": [...] },
      { "stage_id": "STAGE_4", "name": "Exfiltration & Financial Impact", "events": [...] }
    ],
    "events": ["E000408", "E000410", "E000412", "E000418"],
    "primary_indicators": ["UNUSUAL_LOGIN", "PRIVILEGE_CHANGE", "SENSITIVE_ACCESS", "DATA_EXPORT"],
    "top_event_id": "E000418"
  }
]
```

## `GET /api/incidents/{incident_id}`

Returns single incident details by identifier. Returns HTTP 404 if not found.

## `GET /api/audit` (or `GET /audit`)

Returns chronological security event history and analyst-visible runtime risk assessment.

### Query Parameters (Optional)
- `severity`: Filter by severity level (`CRITICAL`, `HIGH`, `MODERATE`/`MEDIUM`, `LOW`).
- `user_id`: Filter by exact user identifier (e.g. `U023`).
- `event_type`: Filter by event type (e.g. `login`, `file_access`, `transaction`).
- `start`: ISO-8601 string to filter events starting from this timestamp.
- `end`: ISO-8601 string to filter events up to this timestamp.
- `limit`: Number of items to return.
- `offset`: Offset index for pagination.
- `sort_by`: Field to sort by (`timestamp`, `risk_score`, `severity`, `event_id`). Default: `timestamp`.
- `order`: Sort direction (`desc`, `asc`). Default: `desc` (newest first).

## `GET /api/security-analysis` (or `GET /api/dashboard`)

Returns aggregated enterprise security posture metrics:
- `behavioural_trust_score`: Calculated enterprise trust baseline (0–100 scale).
- `active_threats`: Count of high and critical threat alerts.
- `privileged_identities`: Total monitored user accounts.
- `events_analyzed`: Total runtime event count.
- `threat_severity_counts`: Distribution across `critical`, `high`, `medium`, and `low`.
- `trust_landscape` / `trust_over_time`: Hourly time buckets with `timestamp`, `trust_score`, and `anomaly_count`.
- `live_stream`: Chronological recent runtime events.
- `top_identities`: Identities ranked by evaluated risk score and high-risk activity.

## `GET /api/analytics` (or `GET /analytics`)

Returns intelligence aggregations including `risk_by_role`, `risk_by_account_type`, `anomalies_trend`, and model engine transparency metrics.

## `GET /api/events` (or `GET /events`)

Returns scored runtime events (optionally filtered with `?user_id=<user_id>`).
