# SENTINEL
### Privileged Access Misuse & Insider Threat Detection

SENTINEL is an enterprise-grade hybrid cybersecurity system that detects insider threats by combining baseline-aware behavioral anomaly detection, ordered sequence correlation, operational context evaluation, and machine learning classification.

## Problem Statement

CSI ORIGIN 2026 Problem Statement 9 focuses on a critical gap in traditional access control: **a valid identity may perform a valid action in an invalid behavioral pattern.** SENTINEL addresses this gap without treating simple statistical anomaly as proof of malicious intent.

## Two-Plane Architecture

SENTINEL operates with two clearly decoupled planes:

### Plane A — Live Detection Plane
```text
Synthetic/Live Telemetry ──► Ingestion (POST /api/events) ──► Schema Validation
                                                                    │
                                                                    ▼
        ┌───────────────────────────────────────────────────────────┤
        ▼                                                           ▼
Behaviour Engine (Deterministic)                           10-D Feature Extractor
Sequence Engine (60-min temporal lookback)                 Random Forest Classifier
Context Engine (0.8x maintenance window)                   Calibrated Attack Prob
        │                                                           │
        └───────────────────────────┬───────────────────────────────┘
                                    ▼
                          Hybrid Risk Fusion Layer
                                    │
                                    ▼
                Alerts ──► Audit Log ──► Investigation Console
```

### Plane B — Controlled Continuous Learning Plane
```text
Analyst Feedback (POST /api/feedback) ──► Verified Feedback Dataset
                                                      │
                                                      ▼
                                          Candidate Model Training
                                                      │
                                                      ▼
                                           Multi-Metric Evaluation
                                                      │
                                                      ▼
                                           Promotion Criteria Gate
                                                      │
                                                      ▼
                                           Model Registry Versioning
                                                      │
                                                      ▼
                                            Explicit SOC Promotion
```

The live detection loop operates autonomously regardless of whether retraining or simulation is active.

## Key Capabilities

- **Deterministic Behaviour Engine**: Baseline-aware signals for timing, device, sensitive access, data volume, privilege, beneficiary, transaction, and frequency.
- **Ordered Sequence Detection**: Strict 60-minute prior-event lookback correlating multi-stage insider attack progression.
- **Authorizing Context Evaluation**: Approved maintenance windows suppress deviation severity (`0.8x` multiplier) without zeroing risk.
- **Machine Learning Detection Layer**: 10-dimensional bounded behavioural feature vector with Random Forest classifier and offline evaluation pipeline (see [docs/ml.md](docs/ml.md)).
- **Hybrid Risk Fusion**: Mathematical fusion combining Behaviour (45%), Sequence (30%), and ML Probability (25%) adjusted by operational context, with seamless fallback to deterministic scoring when ML is offline.
- **Live Telemetry Simulator (Plane A)**: Configurable background synthetic generator supporting legitimate business baseline traffic and 5-stage attack progressions (`SIMULATION_ENABLED=false` by default, see [docs/telemetry.md](docs/telemetry.md)).
- **Controlled Continuous Learning (Plane B)**: Human-in-the-loop analyst feedback loop with promotion gating and instant rollback (see [docs/ml-lifecycle.md](docs/ml-lifecycle.md)).
- **Incident Correlation**: Aggregates correlated event sequences into cohesive Multi-Stage Incidents (`INC-001`, `INC-002`) with MITRE-aligned progression.
- **Audit Log & Investigation Console**: Chronological security-event history with full-text search, multi-factor filtering, and deep forensic inspection modals.

## Risk Model

### Deterministic Baseline Formula
$$\text{Risk Score} = \text{clamp}\Big( (0.60 \times \text{Behaviour} + 0.40 \times \text{Sequence}) \times \text{Context Multiplier},\ 0,\ 100 \Big)$$

### Hybrid Fusion Formula (When ML Active)
$$\text{Hybrid Risk} = \text{clamp}\Big( \big(0.45 \times \text{Behaviour} + 0.30 \times \text{Sequence} + 0.25 \times (\text{ML Probability} \times 100)\big) \times \text{Context Multiplier},\ 0,\ 100 \Big)$$

Severity thresholds: `LOW` 0–24, `MODERATE` 25–49, `HIGH` 50–74, `CRITICAL` 75–100. All scores are finite and bounded.

## Benchmark Demo Scenarios

- `E0412`: Normal authorized activity, risk `6.67`, `LOW`.
- `E0408`: Suspicious six-stage sequence, risk `55.0`, `HIGH`, complete chain detected.
- `E0402`: Suspicious activity under approved context, risk `22.67`, `LOW`, multiplier `0.8`.
- `E999999`: Nonexistent event, HTTP `404`.

## API Endpoints

- `POST /api/events`: Single unified ingestion endpoint for live events.
- `GET /api/events/live`: Bounded recent live events stream.
- `GET /api/simulation/status`, `POST /api/simulation/start`, `pause`, `stop`, `reset`, `step`: Telemetry simulator controls.
- `POST /api/feedback`: Ingests verified analyst feedback for candidate retraining.
- `GET /api/ml/registry`: Model version metadata, metrics, and active production version.
- `POST /api/ml/train-candidate`: Trains candidate model on verified augmented dataset.
- `POST /api/ml/promote`, `POST /api/ml/rollback`: Gated model promotion and instant rollback.
- `GET /api/health`: Service health and loaded telemetry counts.
- `GET /api/alerts`: Calculated high-risk alerts sorted by severity.
- `GET /api/identities`: Identities ranked by risk score.
- `GET /api/events/{event_id}/risk/`: Event telemetry, signals, sequence steps, context, deterministic risk, and ML assessment.
- `GET /api/ml/status`: Active ML model metadata, feature vector definitions, and training metrics.
- `GET /api/incidents`: Correlated multi-stage security incidents.
- `GET /api/incidents/{incident_id}`: Incident details with stage timeline breakdown.
- `GET /api/audit`: Chronological security-event audit log with filtering and pagination.
- `GET /api/security-analysis`: Aggregated enterprise security posture metrics.

See [docs/api.md](docs/api.md) for full request and response schemas.

## Repository Structure

```text
backend/
├── analyzer.py               # Enterprise security posture & analytics
├── app.py                    # REST API & endpoints
├── data_loader.py            # Runtime CSV telemetry loader & live bounded buffer
├── incident_correlation.py   # Multi-stage incident grouping
├── processor.py              # Core deterministic scoring & hybrid ingestion
├── telemetry/                # Live Telemetry Simulation Subsystem (Plane A)
│   ├── event_generator.py    # Schema-compliant synthetic event generator
│   ├── scenarios.py          # Baseline & attack progression templates
│   └── simulator.py          # Background worker with start/pause/reset controls
├── ml/                       # Machine Learning Subsystem & Controlled Retraining (Plane B)
│   ├── dataset_builder.py    # Verified analyst feedback store
│   ├── features.py           # 10-D normalized feature extraction
│   ├── model.py              # RandomForestClassifier wrapper & persistence
│   ├── predictor.py          # Real-time inference engine
│   ├── fusion.py             # Hybrid Risk Fusion layer
│   ├── trainer.py            # Candidate model training engine
│   ├── evaluator.py          # Comprehensive evaluation metrics (FPR/FNR/F1/Recall)
│   ├── registry/             # Model version registry & promotion gating
│   └── artifacts/            # Serialized model binaries
└── tests/                    # 47 automated pytest tests
sentinel-frontend/            # React/TypeScript SOC console
data/                         # Source dataset snapshot & ground truth labels
output/                       # Runtime CSV telemetry consumed by backend
docs/                         # Architecture, ML, Telemetry, Lifecycle, API, Testing
```

## Quick Start

### 1. Backend (Terminal 1)
```powershell
python -m pip install -r backend/requirements.txt
python -m backend.ml.training   # Train initial baseline ML model artifact
python -m backend.app           # Start Flask API on port 5000
```

### 2. Frontend (Terminal 2)
```powershell
cd sentinel-frontend
npm ci
npm run dev                     # Starts Vite dev server on http://localhost:3000
```

## Testing & Verification

```powershell
# Run backend test suite (47 tests)
python -m pytest backend/tests -v

# Run ML training & evaluation verification
python -m backend.ml.training
python -m backend.ml.evaluation

# Run frontend build & linting
cd sentinel-frontend
npm run lint
npm run build
```

See [docs/testing.md](docs/testing.md) for detailed test documentation.

## Documentation Index

- [Architecture & Data Flow](docs/architecture.md)
- [Machine Learning Subsystem](docs/ml.md)
- [ML Controlled Learning Lifecycle](docs/ml-lifecycle.md)
- [Telemetry Simulation Subsystem](docs/telemetry.md)
- [REST API Specification](docs/api.md)
- [Testing & Quality Verification](docs/testing.md)
- [Roadmap & Capability Maturity](docs/roadmap.md)
- [Security Posture & Data Handling](docs/security.md)
- [Development Guidelines](docs/development.md)
