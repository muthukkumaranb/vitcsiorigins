# SENTINEL Machine Learning Lifecycle & Controlled Continuous Learning (Plane B)

## Overview

SENTINEL enforces a **strict architectural separation** between the real-time Live Detection Plane (Plane A) and the Controlled Learning Plane (Plane B).

```
                 ┌──────────────────────────────────────┐
                 │       PLANE A: LIVE DETECTION        │
                 └──────────────────┬───────────────────┘
                                    │
                             Telemetry Event
                                    │
                                    ▼
                         Feature Engineering (10-D)
                                    │
                                    ▼
                             Behaviour Engine
                                    │
                                    ▼
                             Sequence Engine
                                    │
                                    ▼
                              ML Inference
                                    │
                                    ▼
                               Risk Fusion
                                    │
                                    ▼
                              Alert & Audit
                                    │
                                    ▼
                              Investigation
                                    │
                                    ▼
                             Analyst Feedback
                                    │
                 ┌──────────────────┴───────────────────┐
                 │     PLANE B: CONTROLLED LEARNING     │
                 └──────────────────┬───────────────────┘
                                    │
                             Verified Dataset
                                    │
                                    ▼
                         Candidate Model Training
                                    │
                                    ▼
                          Evaluation & Metrics
                                    │
                                    ▼
                         Security Promotion Gate
                                    │
                                    ▼
                              Model Registry
                                    │
                                    ▼
                            Promoted Production
                                    │
                                    └────────► Live Inference
```

---

## 1. Core Principles

1. **Detection $\neq$ Automatic Retraining**: Live security events NEVER automatically alter the active production model. Automatic unsupervised retraining invites data poisoning, adversarial drift, and loss of deterministic compliance.
2. **Analyst Verification Gate**: Only human SOC analyst feedback (`CONFIRM_THREAT` $\rightarrow$ label 1, `FALSE_POSITIVE` $\rightarrow$ label 0) enters the verified feedback pool. Unverified items (`NEEDS_REVIEW`) are excluded from training candidate sets.
3. **Candidate Model Isolation**: New candidate versions are trained and evaluated in sandbox isolation without affecting live scoring.
4. **Strict Promotion Criteria Gate**: A candidate model must pass hard security thresholds before promotion:
   - **Recall $\ge 0.85$**: Required minimum threat coverage to prevent false negatives.
   - **$F_1 \ge \text{active } F_1 - 0.05$**: Guard against degradation in harmonic precision/recall.
   - **False Positive Rate $\le 0.05$**: Prevent alert fatigue in SOC operations.
5. **Instant Rollback**: If a newly promoted model behaves unexpectedly, the Model Registry supports instantaneous rollback to the previous certified version.

---

## 2. ML Architecture Components

| Module | Location | Purpose |
| :--- | :--- | :--- |
| **Feature Extractor** | `backend/ml/features.py` | 10-dimensional standardized numerical feature vector extractor. |
| **Model Wrapper** | `backend/ml/model.py` | `SentinelModelWrapper` encapsulating `RandomForestClassifier` with balanced class weights. |
| **Inference Predictor** | `backend/ml/predictor.py` | Real-time attack probability, severity classification, and contributing factors. |
| **Hybrid Risk Fusion** | `backend/ml/fusion.py` | Fuses Behaviour (45%), Sequence (30%), ML Probability (25%), and Context Multiplier. |
| **Dataset Builder** | `backend/ml/dataset_builder.py` | Manages verified feedback pool and dataset augmentation. |
| **Model Registry** | `backend/ml/registry/model_registry.py` | Version control (`v1.0.0`, `v1.1.0-candidate`), metadata, gating, promotion, and rollback. |
| **Candidate Trainer** | `backend/ml/trainer.py` | Stratified candidate model fitting and evaluation. |
| **Model Evaluator** | `backend/ml/evaluator.py` | Comprehensive metrics: Precision, Recall, F1, FPR, FNR, ROC-AUC. |

---

## 3. Controlled Retraining Workflow

1. **Analyst Reviews Alert**: In the Investigation workspace, an analyst marks an event as `CONFIRM_THREAT` or `FALSE_POSITIVE`.
2. **Feedback Recorded**: `POST /api/feedback` persists the label to `data/analyst_feedback.json`.
3. **Train Candidate**: `POST /api/ml/train-candidate` generates candidate `v1.x.0-candidate`, trains on baseline + feedback, and registers metrics.
4. **Security Gate Check**: `model_registry.evaluate_promotion_criteria()` checks Recall, F1, and FPR.
5. **Promotion**: `POST /api/ml/promote` activates the candidate model and updates `active_version`.
6. **Rollback**: `POST /api/ml/rollback` restores the previous active model.
