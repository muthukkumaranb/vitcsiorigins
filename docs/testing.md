# Testing Guide

Backend tests and compilation:

```powershell
python -m pytest backend/tests -v
Get-ChildItem backend -Filter *.py | ForEach-Object { python -m py_compile $_.FullName }
```

Frontend validation:

```powershell
cd sentinel-frontend
npm ci
npm run build
npm run lint
$env:VITE_USE_MOCK_DATA='true'; npm run build
```

Coverage includes behavior signals, ordered and partial sequences, future-event exclusion, context matching/suppression, severity boundaries, score bounds, API errors, collection endpoints, and ground-truth isolation. Live smoke checks should cover health, alerts, identities, `E0408`, `E0402`, `E0412`, and `E999999`.
