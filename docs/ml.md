# Machine Learning (ML) Subsystem Documentation

SENTINEL integrates a decoupled, production-oriented Machine Learning detection layer (M3–M6) alongside its deterministic behavioural baseline.

## 1. Architectural Role

```
           Raw Security Telemetry Event
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
Deterministic Engine            ML Feature Vector
- Baseline Deviations           - 10-D Normalized Features
- 60-min Lookback Sequence      - Scikit-Learn Classifier
- Context Suppression Multiplier- Attack Probability [0–1]
       │                               │
       └───────────────┬───────────────┘
                       ▼
             Hybrid Risk Fusion
             - 45% Behaviour
             - 30% Sequence
             - 25% ML Probability
             - Context Multiplier
                       ▼
             Explainable Assessment
```

## 2. Behavioral Feature Vector (10 Dimensions)

All feature values are bounded and normalized to $[0.0, 1.0]$:

| # | Feature Name | Description | Formula / Normalization |
|---|---|---|---|
| 1 | `login_deviation_score` | Circular distance from user's typical login hour | $\min(1.0, \frac{|\text{actual} - \text{typical}|}{3 \times \text{spread}})$ |
| 2 | `after_hours_flag` | Binary indicator for login outside 2x spread window | $1.0 \text{ if diff} > 2 \times \text{spread else } 0.0$ |
| 3 | `new_device_flag` | Unfamiliar device access | $1.0 \text{ if new else } 0.0$ |
| 4 | `sensitive_access_flag` | Sensitive resource accessed | $1.0 \text{ if sensitive else } 0.0$ |
| 5 | `records_accessed_score` | Log-scaled records query volume | $\min(1.0, \frac{\log_{10}(\text{records} + 1)}{3.0})$ |
| 6 | `permission_change_flag` | Privilege escalation / role change | $1.0 \text{ if modified else } 0.0$ |
| 7 | `new_beneficiary_flag` | Beneficiary created or modified | $1.0 \text{ if modified else } 0.0$ |
| 8 | `transaction_amount_score` | Transaction deviation vs user baseline | $\min(1.0, \frac{\text{amount} - \mu}{3 \times \sigma})$ |
| 9 | `transaction_frequency_score` | Daily transaction frequency spike | $\min(1.0, \frac{\text{daily\_txns} - \text{avg}}{2 \times \text{avg}})$ |
| 10 | `sequence_matched_ratio` | Ratio of 6-stage attack progression completed | $\frac{\text{matched\_steps}}{6.0}$ |

## 3. Training & Evaluation Pipeline

- **Training Script**: `backend/ml/training.py`
- **Evaluation Script**: `backend/ml/evaluation.py`
- **Model Classifier**: `RandomForestClassifier` (50 estimators, balanced class weights, max depth 6)
- **Model Persistence**: Serialized binary artifact at `backend/ml/artifacts/sentinel_rf_model.pkl`
- **Splits**: Stratified scenario-aware splits (60% Train, 20% Validation, 20% Test)
- **Leakage Controls**:
  1. Strict prior-event lookback window only (no future timestamps).
  2. Ground truth labels (`data/ground_truth.csv`) are strictly quarantined to offline training/evaluation and are never accessed by runtime data loaders.

## 4. Hybrid Risk Fusion Formula

$$\text{Hybrid Risk} = \text{clamp}\Big( \big(0.45 \times \text{Behaviour} + 0.30 \times \text{Sequence} + 0.25 \times (\text{ML Probability} \times 100)\big) \times \text{Context Multiplier},\ 0,\ 100 \Big)$$

### Graceful Fallback
If the ML model is offline or disabled (`ml_available: false`), the system automatically executes the deterministic v1 formula:
$$\text{Deterministic Risk} = \text{clamp}\Big( (0.60 \times \text{Behaviour} + 0.40 \times \text{Sequence}) \times \text{Context Multiplier},\ 0,\ 100 \Big)$$
