# Development Guide

## Prerequisites

- Python 3.10+
- Node.js 22+
- npm

## Run

From the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python -m backend.app
```

In another terminal:

```powershell
cd sentinel-frontend
npm ci
npm run dev
```

Use `sentinel-frontend/.env.example`. Mock mode is opt-in with `VITE_USE_MOCK_DATA=true`; otherwise the frontend uses `VITE_API_BASE_URL`.

## Organization

- `backend/`: Flask API and detection engine.
- `sentinel-frontend/`: React/Vite console.
- `data/`: source dataset snapshot and evaluation labels.
- `output/`: generated runtime/demo CSVs.
- `scripts/`: offline generation and batch analysis.
- `docs/`: deeper project documentation.

Keep scoring in the processor, preserve the public API schema, and add tests for new behavior or sequence rules.
