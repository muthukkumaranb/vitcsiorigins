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

## `GET /api/events/{event_id}/response/`

Returns the server-generated response recommendation and its current analyst workflow state. The response includes `response_id`, `event_id`, `user_id`, `risk_score`, `severity`, `risk_explanation` (the existing signals, sequence, and context explanation), `recommended_action`, `recommended_actions`, `recommendation_reason`, `recommendation_priority`, `state`, `actor`, decision/execution timestamps, and simulated execution status.

Recommendations are derived from the risk endpoint and use the existing severity classification: `LOW` recommends `MONITOR`, `MODERATE` recommends increased monitoring and analyst review, `HIGH` recommends session termination and temporary access restriction, and `CRITICAL` recommends account/session containment. These are recommendations only.

## `POST /api/events/{event_id}/response/`

Submit one controlled analyst decision. The request body must contain one of:

```json
{"decision":"APPROVE"}
```

or:

```json
{"decision":"REJECT"}
```

After approval, the controlled execution request `{"decision":"EXECUTE"}` runs the safe simulated executor. No real account, session, or access control is changed. The MVP actor is recorded as `mvp-analyst` because this service has no authentication layer.

Valid transitions are `RECOMMENDED -> APPROVED`, `RECOMMENDED -> REJECTED`, and `APPROVED -> EXECUTED` or `FAILED`. Repeated decisions, execution of rejected responses, and execution of terminal states return HTTP `409` with `error: "invalid_transition"`. Malformed requests or unsupported decisions return HTTP `400` with `error: "invalid_request"`; unknown events return the standard HTTP `404` `event_not_found` response.

Each recommendation, decision, and execution emits an audit integration event named `RESPONSE_RECOMMENDED`, `RESPONSE_APPROVED`, `RESPONSE_REJECTED`, `RESPONSE_EXECUTED`, or `RESPONSE_FAILED`. The current MVP uses an injectable audit sink so persistent audit storage can be connected without coupling the workflow to a storage implementation.
