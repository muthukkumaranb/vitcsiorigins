# ============================================================
# M8 ISOLATION FOREST ANOMALY DETECTION ENGINE
# ============================================================

import os
import pandas as pd

from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INPUT_FILE = os.path.join(
    BASE_DIR,
    "output",
    "behavior_baseline_results.csv"
)

# ============================================================
# LOAD GROUND TRUTH
# ============================================================

# Use ML results because they contain the correctly merged
# ground-truth labels for all 736 events.

GROUND_TRUTH_FILE = os.path.join(
    BASE_DIR,
    "output",
    "ml_results.csv"
)

GROUND_TRUTH_FILE = os.path.join(
    BASE_DIR,
    "output",
    "ml_results.csv"
)

ground_truth = pd.read_csv(GROUND_TRUTH_FILE)

ground_truth = ground_truth[
    ["event_id", "is_attack"]
].copy()

print("Ground Truth Loaded From ML Results")
print("Ground Truth Shape:", ground_truth.shape)

print("\nGround Truth Distribution:")
print(ground_truth["is_attack"].value_counts())

# Keep only the columns needed for evaluation


OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "output",
    "isolation_forest_results.csv"
)


# ============================================================
# HEADER
# ============================================================

print("=" * 70)
print("M8 ISOLATION FOREST ANOMALY DETECTION ENGINE")
print("=" * 70)


# ============================================================
# LOAD DATA
# ============================================================

data = pd.read_csv(INPUT_FILE)
ground_truth = pd.read_csv(GROUND_TRUTH_FILE)

print()
print("DATA LOADED SUCCESSFULLY")
print(f"Behaviour Results: {data.shape}")
print(f"Ground Truth: {ground_truth.shape}")


# ============================================================
# MERGE GROUND TRUTH
# ============================================================

if "event_id" not in data.columns:
    raise ValueError("event_id column missing from behaviour results")

if "event_id" not in ground_truth.columns:
    raise ValueError("event_id column missing from ground truth")

if "is_attack" not in ground_truth.columns:
    raise ValueError("is_attack column missing from ground truth")

# Avoid duplicate is_attack column if behaviour_results
# already contains it.
if "is_attack" in data.columns:
    data = data.drop(columns=["is_attack"])

data = data.merge(
    ground_truth[["event_id", "is_attack"]],
    on="event_id",
    how="left"
)

if data["is_attack"].isna().any():
    print("WARNING: Some events do not have ground truth labels.")

data["is_attack"] = (
    pd.to_numeric(
        data["is_attack"],
        errors="coerce"
    )
    .fillna(0)
    .astype(int)
)

print()
print("MERGED DATA")
print(data.shape)


# ============================================================
# SELECT BEHAVIOURAL FEATURES
# ============================================================

features = [
    "login_behavior_score",
    "transaction_behavior_score",
    "session_behavior_score",
    "device_behavior_score",
    "event_type_behavior_score",
    "peer_login_score",
    "peer_event_score",
    "peer_deviation_score",
    "sequence_behavior_score",
    "m2_behavior_score"
]

print()
print("=" * 70)
print("ISOLATION FOREST FEATURES")
print("=" * 70)

for feature in features:
    print(f"- {feature}")


# ============================================================
# CHECK FEATURES
# ============================================================

missing_features = [
    feature
    for feature in features
    if feature not in data.columns
]

if missing_features:
    raise ValueError(
        f"Missing required features: {missing_features}"
    )


# ============================================================
# PREPARE FEATURES
# ============================================================

X = data[features].copy()

for feature in features:
    X[feature] = pd.to_numeric(
        X[feature],
        errors="coerce"
    )

X = X.fillna(0)


# ============================================================
# TRAIN ISOLATION FOREST
# ============================================================

print()
print("=" * 70)
print("TRAINING ISOLATION FOREST")
print("=" * 70)

# Your dataset contains approximately 1.36% attacks.
# contamination controls the expected proportion of anomalies.
contamination_rate = 10 / 736

print(f"Contamination rate: {contamination_rate:.4f}")

model = IsolationForest(
    n_estimators=300,
    contamination=contamination_rate,
    random_state=42,
    n_jobs=-1
)

model.fit(X)

print("Isolation Forest training completed successfully.")


# ============================================================
# GENERATE ANOMALY SCORES
# ============================================================

# Isolation Forest:
#   decision_function -> higher = more normal
#
# We reverse it so that:
#   higher score = more anomalous

data["isolation_anomaly_score"] = (
    -model.decision_function(X)
)


# ============================================================
# NORMALIZE ANOMALY SCORE
# ============================================================

minimum_score = data["isolation_anomaly_score"].min()
maximum_score = data["isolation_anomaly_score"].max()

if maximum_score > minimum_score:
    data["isolation_risk_score"] = (
        (data["isolation_anomaly_score"] - minimum_score)
        / (maximum_score - minimum_score)
        * 100
    )
else:
    data["isolation_risk_score"] = 0


# ============================================================
# GENERATE ANOMALY PREDICTION
# ============================================================

# Isolation Forest returns:
#   1  = normal
#  -1  = anomaly

data["isolation_forest_prediction"] = (
    model.predict(X) == -1
).astype(int)


# ============================================================
# RISK LEVEL
# ============================================================

def risk_level(score):

    if score >= 75:
        return "CRITICAL"

    elif score >= 50:
        return "HIGH"

    elif score >= 25:
        return "MEDIUM"

    else:
        return "LOW"


data["isolation_risk_level"] = (
    data["isolation_risk_score"]
    .apply(risk_level)
)


# ============================================================
# EVALUATION
# ============================================================

y_true = data["is_attack"]
y_pred = data["isolation_forest_prediction"]

accuracy = accuracy_score(y_true, y_pred)

precision = precision_score(
    y_true,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_true,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_true,
    y_pred,
    zero_division=0
)


# ============================================================
# PERFORMANCE
# ============================================================

print()
print("=" * 70)
print("M8 ISOLATION FOREST PERFORMANCE")
print("=" * 70)

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")


# ============================================================
# CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(
    y_true,
    y_pred,
    labels=[0, 1]
)

print()
print("=" * 70)
print("CONFUSION MATRIX")
print("=" * 70)

print("                 Predicted")
print("                 Normal  Attack")
print(
    f"Actual Normal     {cm[0][0]:<7} {cm[0][1]}"
)
print(
    f"Actual Attack     {cm[1][0]:<7} {cm[1][1]}"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print()
print("=" * 70)
print("CLASSIFICATION REPORT")
print("=" * 70)

print(
    classification_report(
        y_true,
        y_pred,
        target_names=["Normal", "Attack"],
        zero_division=0
    )
)


# ============================================================
# ATTACK DISTRIBUTION
# ============================================================

print()
print("=" * 70)
print("ISOLATION FOREST DETECTION SUMMARY")
print("=" * 70)

actual_attacks = int(y_true.sum())
predicted_attacks = int(y_pred.sum())

detected_attacks = int(
    ((y_true == 1) & (y_pred == 1)).sum()
)

missed_attacks = int(
    ((y_true == 1) & (y_pred == 0)).sum()
)

false_alarms = int(
    ((y_true == 0) & (y_pred == 1)).sum()
)

print(f"Total Events        : {len(data)}")
print(f"Actual Attacks      : {actual_attacks}")
print(f"Predicted Anomalies : {predicted_attacks}")
print(f"Detected Attacks    : {detected_attacks}")
print(f"Missed Attacks      : {missed_attacks}")
print(f"False Alarms        : {false_alarms}")

if actual_attacks > 0:
    detection_rate = (
        detected_attacks / actual_attacks
    ) * 100
else:
    detection_rate = 0

print(
    f"Attack Detection Rate: {detection_rate:.2f}%"
)


# ============================================================
# TOP ANOMALIES
# ============================================================

print()
print("=" * 70)
print("TOP 20 ISOLATION FOREST ANOMALIES")
print("=" * 70)

display_columns = [
    "event_id",
    "user_id",
    "event_type",
    "m2_behavior_score",
    "isolation_risk_score",
    "isolation_forest_prediction",
    "isolation_risk_level",
    "is_attack"
]

top_anomalies = (
    data[
        display_columns
    ]
    .sort_values(
        "isolation_risk_score",
        ascending=False
    )
    .head(20)
)

print(top_anomalies.to_string(index=False))


# ============================================================
# SAVE RESULTS
# ============================================================

data.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("=" * 70)
print("M8 ISOLATION FOREST COMPLETED SUCCESSFULLY")
print("=" * 70)

print()
print("Results saved to:")
print(OUTPUT_FILE)