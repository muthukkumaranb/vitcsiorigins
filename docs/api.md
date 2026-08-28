# API Reference

The Flask API is the public integration boundary. It runs at `http://127.0.0.1:5000` and permits local origins `127.0.0.1:3000` and `localhost:3000`.

## `GET /api/health`

Returns service counts: `status`, `events`, `users`, and `contexts`.

## `GET /api/alerts`

Evaluates runtime events and returns high-risk alerts sorted by descending risk. Each alert contains `alert_id`, `event_id`, `user_id`, `timestamp`, `risk_score`, `severity`, `signals`, and `chain_detected`.

## `GET /api/identities`

Returns identity records derived from `output/users.csv`.

## `GET /api/events/{event_id}/risk/`

Returns the public event, user ID, behavior score/signals, sequence score/matched steps, context status/info/multiplier, bounded risk score, and severity.

Missing events return HTTP 404:

```json
{"error":"event_not_found","message":"Event 'E999999' does not exist.","event_id":"E999999"}
```

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

### Response Schema

```json
{
  "items": [
    {
      "event_id": "E0408",
      "timestamp": "2026-03-02T14:20:00",
      "user_id": "U016",
      "event_type": "data_export",
      "risk_score": 55.0,
      "severity": "HIGH",
      "behaviour_score": 25.0,
      "sequence_score": 100.0,
      "context": {
        "status": "no_context_found",
        "multiplier": 1.0,
        "info": null
      },
      "sequence": {
        "chain_detected": true,
        "matched_steps": [ ... ]
      },
      "signals": [ ... ],
      "event": { ... }
    }
  ],
  "total": 412
}
```

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

Scores are finite and bounded to 0-100. Severity values are `LOW`, `MODERATE`, `HIGH`, and `CRITICAL`. Runtime inference never reads ground truth.
