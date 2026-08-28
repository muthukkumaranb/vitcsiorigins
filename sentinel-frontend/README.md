# Frontend

The React/Vite console is the presentation layer for SENTINEL. See the repository [README](../README.md), [architecture](../docs/architecture.md), [API reference](../docs/api.md), and [development guide](../docs/development.md).

## Run

```powershell
npm ci
npm run dev
```

Set `VITE_API_BASE_URL=http://127.0.0.1:5000` and `VITE_USE_MOCK_DATA=false` for Flask-backed mode. Set `VITE_USE_MOCK_DATA=true` only for explicit local fixture mode. Production failures do not fall back to mock data.

## Validate

```powershell
npm run build
npm run lint
```
