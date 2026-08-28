"""
M3 MACHINE LEARNING DETECTION ENGINE

Uses:
- M2 Behaviour Baseline results
- Ground truth labels
- Random Forest classifier

Output:
- ML prediction
- Attack probability
- Final ML risk level
"""

import os
import sys
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)


# ============================================================
# PATH SETUP
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

OUTPUT_DIR = os.path.join(BASE_DIR, "output")
DATA_DIR = os.path.join(BASE_DIR, "data")

BEHAVIOR_FILE = os.path.join(
    BASE_DIR,
    "output",
    "behavior_baseline_results.csv"
)

GROUND_TRUTH_FILE = os.path.join(
    BASE_DIR,
    "data",
    "ground_truth.csv"
)

ML_OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "ml_results.csv"
)


# ============================================================
# START
# ============================================================

print("\n" + "=" * 70)
print("M3 MACHINE LEARNING DETECTION ENGINE")
print("=" * 70)


# ============================================================
# LOAD DATA
# ============================================================

if not os.path.exists(BEHAVIOR_FILE):
    print(f"\nERROR: Behaviour results not found:")
    print(BEHAVIOR_FILE)
    print("\nRun behavior_baseline.py first.")
    sys.exit()

if not os.path.exists(GROUND_TRUTH_FILE):
    print(f"\nERROR: Ground truth file not found:")
    print(GROUND_TRUTH_FILE)
    sys.exit()


behavior_data = pd.read_csv(BEHAVIOR_FILE)
ground_truth = pd.read_csv(GROUND_TRUTH_FILE)

print("\nDATA LOADED SUCCESSFULLY")
print(f"Behaviour Results: {behavior_data.shape}")
print(f"Ground Truth: {ground_truth.shape}")


# ============================================================
# DISPLAY COLUMNS
# ============================================================

print("\nAvailable Behaviour Columns:")
print(behavior_data.columns.tolist())

print("\nAvailable Ground Truth Columns:")
print(ground_truth.columns.tolist())


# ============================================================
# IDENTIFY LABEL COLUMN
# ============================================================

possible_label_columns = [
    "is_attack",
    "attack",
    "label",
    "target",
    "ground_truth",
    "is_anomaly"
]

label_column = None

for column in possible_label_columns:
    if column in ground_truth.columns:
        label_column = column
        break


if label_column is None:

    print("\nERROR: Could not find attack label column.")

    print("\nAvailable ground truth columns:")
    print(ground_truth.columns.tolist())

    sys.exit()


print(f"\nAttack label column detected: {label_column}")


# ============================================================
# MERGE BEHAVIOUR DATA WITH GROUND TRUTH
# ============================================================

merge_columns = []

if "event_id" in behavior_data.columns and "event_id" in ground_truth.columns:
    merge_columns.append("event_id")

if "user_id" in behavior_data.columns and "user_id" in ground_truth.columns:
    merge_columns.append("user_id")


if not merge_columns:

    print("\nERROR: No common merge columns found.")
    sys.exit()


data = behavior_data.merge(
    ground_truth[
        merge_columns + [label_column]
    ],
    on=merge_columns,
    how="left"
)


print("\nMerged Data:")
print(data.shape)


# ============================================================
# PREPARE ATTACK LABEL
# ============================================================

data[label_column] = data[label_column].fillna(0)


# Convert labels safely to numeric
if data[label_column].dtype == object:

    data[label_column] = (
        data[label_column]
        .astype(str)
        .str.lower()
        .map({
            "attack": 1,
            "malicious": 1,
            "anomaly": 1,
            "true": 1,
            "yes": 1,
            "1": 1,

            "normal": 0,
            "benign": 0,
            "false": 0,
            "no": 0,
            "0": 0
        })
        .fillna(0)
    )


data[label_column] = pd.to_numeric(
    data[label_column],
    errors="coerce"
).fillna(0).astype(int)


print("\nAttack Distribution:")

print(
    data[label_column]
    .value_counts()
)


# ============================================================
# FEATURE SELECTION
# ============================================================

preferred_features = [

    # M2 behaviour scores
    "login_behavior_score",
    "transaction_behavior_score",
    "session_behavior_score",
    "device_behavior_score",
    "event_type_behavior_score",

    # Peer behaviour
    "peer_login_score",
    "peer_event_score",
    "peer_deviation_score",

    # Sequence detection
    "sequence_behavior_score",

    # Final M2 score
    "m2_behavior_score"
]


features = [
    feature
    for feature in preferred_features
    if feature in data.columns
]


if len(features) == 0:

    print("\nERROR: No valid ML features found.")

    print("\nAvailable columns:")
    print(data.columns.tolist())

    sys.exit()


print("\n" + "=" * 70)
print("ML FEATURES SELECTED")
print("=" * 70)

for feature in features:
    print(f"- {feature}")


# ============================================================
# PREPARE FEATURE MATRIX
# ============================================================

X = data[features].copy()

X = X.apply(
    pd.to_numeric,
    errors="coerce"
)

X = X.fillna(0)


y = data[label_column]


# ============================================================
# CHECK CLASS DISTRIBUTION
# ============================================================

attack_count = int((y == 1).sum())
normal_count = int((y == 0).sum())

print("\n" + "=" * 70)
print("DATASET DISTRIBUTION")
print("=" * 70)

print(f"Normal Events : {normal_count}")
print(f"Attack Events : {attack_count}")


if attack_count < 2:

    print("\nERROR: Not enough attack samples for ML training.")
    print("At least 2 attack events are required.")

    sys.exit()


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,

    test_size=0.25,

    random_state=42,

    stratify=y
)


print("\n" + "=" * 70)
print("TRAIN / TEST SPLIT")
print("=" * 70)

print(f"Training Samples : {len(X_train)}")
print(f"Testing Samples  : {len(X_test)}")


# ============================================================
# RANDOM FOREST MODEL
# ============================================================

print("\n" + "=" * 70)
print("TRAINING RANDOM FOREST MODEL")
print("=" * 70)


model = RandomForestClassifier(

    n_estimators=300,

    max_depth=8,

    min_samples_split=2,

    min_samples_leaf=1,

    class_weight="balanced",

    random_state=42,

    n_jobs=-1
)


model.fit(
    X_train,
    y_train
)


print("\nModel training completed successfully.")


# ============================================================
# PREDICTIONS
# ============================================================

y_pred = model.predict(X_test)

y_probability = model.predict_proba(X_test)[:, 1]


# ============================================================
# EVALUATION
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)


print("\n" + "=" * 70)
print("M3 MODEL PERFORMANCE")
print("=" * 70)

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")


print("\nCLASSIFICATION REPORT")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


print("\nCONFUSION MATRIX")

print(
    confusion_matrix(
        y_test,
        y_pred
    )
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

feature_importance = pd.DataFrame({

    "feature": features,

    "importance": model.feature_importances_

}).sort_values(
    by="importance",
    ascending=False
)


print("\n" + "=" * 70)
print("FEATURE IMPORTANCE")
print("=" * 70)

print(
    feature_importance.to_string(
        index=False
    )
)


# ============================================================
# PREDICT ENTIRE DATASET
# ============================================================

data["ml_attack_prediction"] = model.predict(X)

data["ml_attack_probability"] = (
    model.predict_proba(X)[:, 1] * 100
)


# ============================================================
# ML RISK LEVEL
# ============================================================

def get_ml_risk_level(probability):

    if probability >= 80:
        return "CRITICAL"

    elif probability >= 60:
        return "HIGH"

    elif probability >= 35:
        return "MODERATE"

    elif probability >= 15:
        return "LOW-MODERATE"

    else:
        return "LOW"


data["ml_risk_level"] = (
    data["ml_attack_probability"]
    .apply(get_ml_risk_level)
)


# ============================================================
# SORT RESULTS
# ============================================================

data = data.sort_values(

    by="ml_attack_probability",

    ascending=False

).reset_index(
    drop=True
)


# ============================================================
# TOP ML DETECTIONS
# ============================================================

display_columns = [

    "event_id",

    "user_id",

    "event_type",

    label_column,

    "m2_behavior_score",

    "sequence_behavior_score",

    "ml_attack_probability",

    "ml_attack_prediction",

    "ml_risk_level"
]


display_columns = [

    column

    for column in display_columns

    if column in data.columns
]


print("\n" + "=" * 70)
print("TOP 20 ML ATTACK DETECTIONS")
print("=" * 70)

print(

    data[
        display_columns
    ]
    .head(20)
)


# ============================================================
# SAVE RESULTS
# ============================================================

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


data.to_csv(
    ML_OUTPUT_FILE,
    index=False
)


# ============================================================
# COMPLETED
# ============================================================

print("\n" + "=" * 70)
print("M3 MACHINE LEARNING DETECTION COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nResults saved to:")

print(
    ML_OUTPUT_FILE
)

print()