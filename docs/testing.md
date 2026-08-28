# Testing & Verification Guide

SENTINEL maintains comprehensive test coverage across deterministic behavioural scoring, machine learning inference, hybrid risk fusion, incident correlation, and UI presentation.

## 1. Backend Test Suite

Run all unit and integration tests:

```powershell
python -m pytest backend/tests -v
```

Test modules:
- `backend/tests/test_processor.py`: Deterministic signals, sequence lookback, context suppression, bounded scores, benchmarks (`E0412`, `E0408`, `E0402`), and 404 error handling.
- `backend/tests/test_ml.py`: 10-D feature extraction, model prediction, probability calibration, hybrid fusion formula, explainability generation, and offline fallback.
- `backend/tests/test_incidents.py`: Incident correlation, timeline grouping, attack stage classification, and query by ID.
- `backend/tests/test_audit.py`: Audit log filtering, sorting, pagination, and data contracts.
- `backend/tests/test_security_analysis.py`: Aggregated security analysis, trust score bounds, and telemetry stream contracts.

### Python Compilation Check

```powershell
Get-ChildItem -Recurse backend -Filter *.py | ForEach-Object { python -m py_compile $_.FullName }
```

## 2. ML Training & Evaluation Validation

```powershell
# Train Random Forest classifier on stratified scenario split
python -m backend.ml.training

# Evaluate model metrics across Train, Validation, and Test splits
python -m backend.ml.evaluation
```

## 3. Frontend Validation

```powershell
cd sentinel-frontend
# Linting check
npm run lint

# Production API mode build
npm run build

# Mock mode build
$env:VITE_USE_MOCK_DATA="true"; npm run build; Remove-Item Env:VITE_USE_MOCK_DATA
```

## 4. Benchmark Scenario Regression Tests

| Event ID | Scenario Type | Expected Risk | Expected Severity | Verified |
| :--- | :--- | :--- | :--- | :--- |
| `E0412` | Normal Baseline Activity | `6.67` | `LOW` | Yes |
| `E0408` | 6-Stage Insider Attack Chain | `55.0` | `HIGH` | Yes |
| `E0402` | Activity Under Approved Context | `22.67` | `LOW` | Yes |
| `E999999`| Non-existent Event ID | HTTP 404 | Error JSON | Yes |
