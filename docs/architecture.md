# Architecture

SENTINEL is a modular, production-oriented cybersecurity application combining deterministic behavioural baselining, machine learning inference, and multi-stage incident correlation.

```text
Telemetry CSV Data (events, users, context)
                     │
            Backend Data Loader
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
Behaviour Engine            ML Feature Pipeline
Sequence Engine (60-min)    RandomForest Classifier
Context Engine (0.8x)       Attack Probability
       │                           │
       └─────────────┬─────────────┘
                     ▼
           Hybrid Risk Fusion
                     │
     Incident Correlation Engine
     (Multi-stage attack timelines)
                     │
         REST API (Flask Backend)
                     │
         React/TypeScript SOC Console
```

`backend/data_loader.py` loads users, events, and contexts. `backend/processor.py` owns behavior signals, sequence matching, context suppression, ML evaluation, and hybrid risk aggregation. `backend/incident_correlation.py` clusters correlated multi-stage attacks. `backend/app.py` exposes REST HTTP routes.

The runtime path does not load `ground_truth.csv`. Offline scripts under `backend/ml/` and `scripts/` use ground truth for training and evaluation only.

## Subsystems

### 1. Deterministic Behaviour & Sequence Baseline
- **Behaviour Deviations**: Real-time evaluation against individual user baselines (login hour spread, avg transaction, peer group).
- **Sequence Correlation**: Lookback window (60 minutes) tracking multi-stage progression: `Login -> Sensitive Access -> Privilege Change -> Beneficiary Change -> Large Transaction -> Data Export`.
- **Context Suppression**: Matches approved business/maintenance windows applying a `0.8x` multiplier.

### 2. Machine Learning Detection Layer (M3–M6)
- **Feature Pipeline (`backend/ml/features.py`)**: Normalized 10-dimensional numerical vector.
- **Model Classifier (`backend/ml/model.py`)**: `RandomForestClassifier` with balanced class weights.
- **Hybrid Risk Fusion (`backend/ml/fusion.py`)**: Fuses deterministic risk and ML attack probability into an explainable assessment with automatic fallback if ML is offline.

### 3. Incident Correlation Engine (M7)
- **Timeline Aggregation (`backend/incident_correlation.py`)**: Groups correlated high-risk activity into formal security incidents (`INC-001`, `INC-002`) across 4 MITRE-aligned stages (Ingress, Privilege Escalation, Discovery/Access, Exfiltration).

### 4. Audit Log & Investigation Console (M8)
- **Chronological History**: Analyst-visible risk audit log via `GET /api/audit`.
- **Investigation Workspace**: Deep-dive event inspection, ML probability decomposition, and evidence explainability factors.
