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

Scores are finite and bounded to 0-100. Severity values are `LOW`, `MODERATE`, `HIGH`, and `CRITICAL`. Runtime inference never reads ground truth.
