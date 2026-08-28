# Backend

The backend is the deterministic SENTINEL inference and HTTP layer. It loads runtime CSVs from `../output/`, evaluates behavior and ordered sequence evidence, applies context adjustment, aggregates risk, and exposes the Flask API.

## Modules

- `app.py`: Flask routes, local CORS, and production-safe startup.
- `data_loader.py`: in-memory loading of runtime users, events, and contexts.
- `processor.py`: behavior signals, sequence correlation, context evaluation, risk aggregation, and severity.
- `tests/`: focused behavior, sequence, context, API, data-integrity, and temporal tests.

## Run

From the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python -m backend.app
```

## Test

```powershell
python -m pytest backend/tests -v
```

The public contract is documented in [docs/api.md](../docs/api.md). `ground_truth.csv` is evaluation-only and is not loaded by the runtime inference path.
