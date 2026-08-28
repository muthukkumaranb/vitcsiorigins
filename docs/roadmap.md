# Roadmap & Subsystem Maturity

This document transparently tracks the implementation status of all SENTINEL capabilities.

## 1. Implemented & Production-Ready

- **Deterministic Behaviour Engine**: User baseline comparison across timing, devices, sensitive access, volumes, and transactions.
- **Ordered Sequence Correlation**: 60-minute strict lookback tracking 6-stage insider attack progression.
- **Authorizing Context Evaluation**: Evaluates approved maintenance tickets with deterministic `0.8x` suppression.
- **Machine Learning Detection Layer (M3–M6)**:
  - 10-dimensional bounded behavioural feature vector extraction (`backend/ml/features.py`).
  - Scikit-Learn `RandomForestClassifier` with balanced class weights (`backend/ml/model.py`).
  - Offline reproducible training & evaluation pipeline with leakage controls (`backend/ml/training.py`, `backend/ml/evaluation.py`).
  - Hybrid Risk Fusion layer combining Behaviour, Sequence, and ML probabilities with graceful offline fallback (`backend/ml/fusion.py`).
- **Incident Correlation Engine (M7)**:
  - Multi-stage attack chain grouping and MITRE-aligned stage classification (`backend/incident_correlation.py`).
  - REST endpoints for incident listings and details (`/api/incidents`, `/api/incidents/<id>`).
- **Audit Log**:
  - Full chronological event log with analyst risk evaluations, multi-parameter filtering, sorting, and pagination (`/api/audit`).
- **Investigation Workspace & SOC Console**:
  - Real-time React/TypeScript console with hybrid risk decomposition, ML attack probability gauge, and SOC explainability factors.
- **Automated Regression Protection**:
  - 40 automated pytest tests passing in CI verifying benchmark scores, ML features, and incident correlation.

## 2. In Development

- **Continuous Online Retraining**: Incremental online learning from analyst investigation feedback.
- **Multi-Tenant Policy Configurations**: Customisable organization-wide severity thresholds and sequence weights.

## 3. Future Planned Extensions

- **Immutable Tamper-Evident Audit Storage**: Cryptographically signed audit log persistence (blockchain / WORM storage).
- **Automated Response Enforcement**: Native SOAR integrations for automated account suspension and session termination.
- **Real-Time Streaming Event Ingestion**: Kafka/PubSub streaming connectors for live enterprise log ingestion.
