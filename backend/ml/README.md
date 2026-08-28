# SENTINEL Machine Learning (ML) Subsystem

The SENTINEL ML module provides an additional, decoupled intelligence layer that consumes behavioural feature vectors and outputs calibrated attack probabilities.

## Design Principles

1. **Non-Invasive Intelligence**: ML does not replace the deterministic behavioural engine; it augments it through the Hybrid Risk Fusion layer (`backend/ml/fusion.py`).
2. **Zero Ground-Truth Leakage**: Ground-truth labels are strictly isolated to offline training (`backend/ml/training.py`) and evaluation (`backend/ml/evaluation.py`). Runtime telemetry loading never reads labels.
3. **Chronological Splitting**: Train (70%), validation (15%), and test (15%) splits are strictly time-ordered.
4. **Graceful Fallback**: If the ML model is disabled or unavailable, the system automatically falls back to the deterministic v1 risk scoring formula with zero service degradation.

## Feature Vector (10 Dimensions)

| Feature | Type | Range | Description |
| :--- | :--- | :--- | :--- |
| `login_deviation_score` | Float | `[0.0, 1.0]` | Circular distance from user's typical login hour normalized by spread |
| `after_hours_flag` | Binary | `{0.0, 1.0}` | Indicator if login was outside user's 2x spread window |
| `new_device_flag` | Binary | `{0.0, 1.0}` | Indicator if device is unfamiliar for user |
| `sensitive_access_flag` | Binary | `{0.0, 1.0}` | Indicator if accessed resource is sensitive |
| `records_accessed_score` | Float | `[0.0, 1.0]` | Log-scaled volume of records accessed |
| `permission_change_flag` | Binary | `{0.0, 1.0}` | Indicator if user's permissions were escalated |
| `new_beneficiary_flag` | Binary | `{0.0, 1.0}` | Indicator if a new payment beneficiary was created |
| `transaction_amount_score` | Float | `[0.0, 1.0]` | Transaction amount deviation vs user historical mean & spread |
| `transaction_frequency_score`| Float | `[0.0, 1.0]` | Daily transaction count deviation vs daily baseline |
| `sequence_matched_ratio` | Float | `[0.0, 1.0]` | Ratio of completed lookback attack chain steps |

## Hybrid Risk Fusion Formula

$$\text{Hybrid Risk} = \text{clamp}\Big( \big(0.45 \times \text{Behaviour} + 0.30 \times \text{Sequence} + 0.25 \times (\text{ML Probability} \times 100)\big) \times \text{Context Multiplier},\ 0,\ 100 \Big)$$

## Running Training & Evaluation

Train the model and generate the artifact:
```bash
python -m backend.ml.training
```

Run model evaluation:
```bash
python -m backend.ml.evaluation
```
