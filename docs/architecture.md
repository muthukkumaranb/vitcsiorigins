# Architecture

SENTINEL is a small in-memory Flask and React application.

```text
CSV runtime output
      |
Data loader
      |
Behaviour engine
      |
Sequence engine (60-minute prior-event window)
      |
Context engine (user + inclusive time window)
      |
Risk aggregator
      |
Alert and investigation API
      |
React SOC console
```

`backend/data_loader.py` loads users, events, and contexts. `backend/processor.py` owns the behavior signals, ordered sequence matching, context suppression, risk formula, and severity classification. `backend/app.py` exposes the HTTP routes. The frontend API service maps public response objects to the investigation, audit, and dashboard views.

The runtime path does not load `ground_truth.csv`. Offline scripts under `scripts/` may use ground truth for evaluation only.

## Audit Log

The Audit Log represents a chronological security-event history with analyst-visible risk assessment evaluations.

- **Data Source**: Runtime event store (`output/events.csv`) evaluated through the deterministic risk processor (`backend/processor.py`).
- **Endpoint**: `GET /api/audit` (and `GET /audit`) supporting query filters (`severity`, `user_id`, `event_type`, `start`, `end`, `limit`, `offset`, `sort_by`, `order`).
- **Frontend View**: Interactive SOC table with summary metrics (Total, Critical, High, Moderate, Low), full-text search, column sorting, pagination, and detailed event inspection modals.
- **Mock Mode**: Fully supported via `VITE_USE_MOCK_DATA=true` using simulated mock event telemetry.

> **Note**: The current implementation provides a runtime security-event history for investigation and demonstration. Persistent immutable audit storage is a future extension.
