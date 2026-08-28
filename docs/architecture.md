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

`backend/data_loader.py` loads users, events, and contexts. `backend/processor.py` owns the behavior signals, ordered sequence matching, context suppression, risk formula, and severity classification. `backend/app.py` exposes the HTTP routes. The frontend API service maps public response objects to the investigation and dashboard views.

The runtime path does not load `ground_truth.csv`. Offline scripts under `scripts/` may use ground truth for evaluation only.
