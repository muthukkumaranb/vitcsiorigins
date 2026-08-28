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
    OUTPUT_DIR,
    "behavior_baseline_results.csv"
)

ENHANCED_FEATURE_FILE = os.path.join(
    OUTPUT_DIR,
    "enhanced_behavior_features.csv"
)

GROUND_TRUTH_FILE = os.path.join(
    DATA_DIR,
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
print("M11 ENHANCED RANDOM FOREST DETECTION ENGINE")
print("=" * 70)


# ============================================================
# CHECK FILES
# ============================================================

for file_path, name in [
    (BEHAVIOR_FILE, "Behaviour results"),
    (ENHANCED_FEATURE_FILE, "Enhanced feature results"),
    (GROUND_TRUTH_FILE, "Ground truth")
]:

    if not os.path.exists(file_path):

        print(f"\nERROR: {name} not found:")
        print(file_path)

        sys.exit()


# ============================================================
# LOAD DATA
# ============================================================

behavior_data = pd.read_csv(BEHAVIOR_FILE)

enhanced_data = pd.read_csv(
    ENHANCED_FEATURE_FILE
)

ground_truth = pd.read_csv(
    GROUND_TRUTH_FILE
)


print("\nDATA LOADED SUCCESSFULLY")

print(
    f"Behaviour Results       : {behavior_data.shape}"
)

print(
    f"Enhanced Features       : {enhanced_data.shape}"
)

print(
    f"Ground Truth            : {ground_truth.shape}"
)


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

    print(
        ground_truth.columns.tolist()
    )

    sys.exit()


print(
    f"\nAttack label column detected: {label_column}"
)


# ============================================================
# PREPARE GROUND TRUTH
# ============================================================

ground_truth = ground_truth[
    ["event_id", label_column]
].copy()

ground_truth = ground_truth.drop_duplicates(
    subset=["event_id"]
)


# ============================================================
# MERGE BEHAVIOUR + ENHANCED FEATURES
# ============================================================

print("\n" + "=" * 70)
print("MERGING ORIGINAL + ENHANCED FEATURES")
print("=" * 70)


# Only take new M10 columns.
# This prevents duplicate copies of existing behaviour columns.

enhanced_feature_columns = [

    "off_hours_flag",
    "weekend_activity_flag",
    "time_since_previous_event_seconds",

    "user_events_last_5min",
    "user_events_last_15min",
    "user_events_last_30min",

    "event_velocity_score",

    "transaction_ratio_to_user_average",
    "transaction_spike_score",

    "new_device_off_hours_flag",
    "sensitive_new_device_flag",
    "privilege_sensitive_access_flag",
    "beneficiary_transaction_flag",

    "attack_stage_score",
    "sequence_progression_score",
    "contextual_risk_score"
]


available_enhanced_features = [

    feature
    for feature in enhanced_feature_columns
    if feature in enhanced_data.columns
]


print("\nEnhanced features available:")

for feature in available_enhanced_features:

    print(f"- {feature}")


# Keep only event_id + enhanced features

enhanced_subset = enhanced_data[
    ["event_id"] + available_enhanced_features
].copy()


# Remove duplicate event IDs

enhanced_subset = enhanced_subset.drop_duplicates(
    subset=["event_id"]
)


# Merge

data = behavior_data.merge(
    enhanced_subset,
    on="event_id",
    how="left",
    suffixes=("", "_enhanced")
)


# Merge ground truth

data = data.merge(
    ground_truth,
    on="event_id",
    how="left"
)


print("\nMerged Data:")
print(data.shape)


# ============================================================
# PREPARE ATTACK LABEL
# ============================================================

data[label_column] = data[label_column].fillna(0)


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
    data[label_column].value_counts()
)


# ============================================================
# FEATURE SELECTION
# ============================================================

original_features = [

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

    # Sequence

    "sequence_behavior_score",

    # Overall behaviour

    "m2_behavior_score"
]


# New M10 features

new_features = [

    "off_hours_flag",
    "weekend_activity_flag",

    "time_since_previous_event_seconds",

    "user_events_last_5min",
    "user_events_last_15min",
    "user_events_last_30min",

    "event_velocity_score",

    "transaction_ratio_to_user_average",
    "transaction_spike_score",

    "new_device_off_hours_flag",

    "sensitive_new_device_flag",

    "privilege_sensitive_access_flag",

    "beneficiary_transaction_flag",

    "attack_stage_score",

    "sequence_progression_score",

    "contextual_risk_score"
]


# Combine

preferred_features = (
    original_features +
    new_features
)


features = [

    feature
    for feature in preferred_features
    if feature in data.columns
]


if len(features) == 0:

    print("\nERROR: No valid ML features found.")

    sys.exit()


print("\n" + "=" * 70)
print("M11 FEATURES SELECTED")
print("=" * 70)

print(
    f"\nTotal Features: {len(features)}"
)

for feature in features:

    print(f"- {feature}")


# ============================================================
# REMOVE CONSTANT FEATURES
# ============================================================

print("\n" + "=" * 70)
print("CHECKING FEATURE VARIANCE")
print("=" * 70)


constant_features = []

for feature in features:

    values = pd.to_numeric(
        data[feature],
        errors="coerce"
    )

    if values.nunique(dropna=True) <= 1:

        constant_features.append(feature)


if constant_features:

    print("\nConstant features detected:")

    for feature in constant_features:

        print(f"- {feature}")

    print(
        "\nThese features will not be used for training."
    )


features = [

    feature
    for feature in features
    if feature not in constant_features
]


print(
    f"\nUsable Features: {len(features)}"
)


# ============================================================
# PREPARE FEATURE MATRIX
# ============================================================

X = data[features].copy()


X = X.apply(
    pd.to_numeric,
    errors="coerce"
)


X = X.replace(
    [float("inf"), float("-inf")],
    0
)


X = X.fillna(0)


y = data[label_column]


# ============================================================
# DATASET DISTRIBUTION
# ============================================================

attack_count = int(
    (y == 1).sum()
)

normal_count = int(
    (y == 0).sum()
)


print("\n" + "=" * 70)
print("DATASET DISTRIBUTION")
print("=" * 70)

print(
    f"Normal Events : {normal_count}"
)

print(
    f"Attack Events : {attack_count}"
)


if attack_count < 2:

    print(
        "\nERROR: Not enough attack samples."
    )

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

print(
    f"Training Samples : {len(X_train)}"
)

print(
    f"Testing Samples  : {len(X_test)}"
)


# ============================================================
# RANDOM FOREST
# ============================================================

print("\n" + "=" * 70)
print("TRAINING ENHANCED RANDOM FOREST")
print("=" * 70)


model = RandomForestClassifier(

    n_estimators=400,

    max_depth=10,

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


print(
    "\nEnhanced Random Forest training completed successfully."
)


# ============================================================
# TEST PREDICTIONS
# ============================================================

y_pred = model.predict(
    X_test
)

y_probability = (
    model.predict_proba(X_test)[:, 1]
)


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
print("M11 ENHANCED RANDOM FOREST PERFORMANCE")
print("=" * 70)

print(
    f"Accuracy  : {accuracy:.4f}"
)

print(
    f"Precision : {precision:.4f}"
)

print(
    f"Recall    : {recall:.4f}"
)

print(
    f"F1 Score  : {f1:.4f}"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\nCLASSIFICATION REPORT")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

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

    "importance":
        model.feature_importances_

}).sort_values(

    by="importance",

    ascending=False

)


print("\n" + "=" * 70)
print("M11 FEATURE IMPORTANCE")
print("=" * 70)

print(
    feature_importance.to_string(
        index=False
    )
)


# ============================================================
# PREDICT ENTIRE DATASET
# ============================================================

data["ml_attack_prediction"] = model.predict(
    X
)


data["ml_attack_probability"] = (

    model.predict_proba(X)[:, 1]

    * 100
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
# SORT
# ============================================================

data = data.sort_values(

    by="ml_attack_probability",

    ascending=False

).reset_index(
    drop=True
)


# ============================================================
# TOP DETECTIONS
# ============================================================

display_columns = [

    "event_id",
    "user_id",
    "event_type",

    label_column,

    "m2_behavior_score",

    "attack_stage_score",
    "sequence_progression_score",
    "contextual_risk_score",

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
print("TOP 20 M11 ML ATTACK DETECTIONS")
print("=" * 70)


print(

    data[
        display_columns
    ]
    .head(20)
    .to_string(index=False)

)


# ============================================================
# DETECTION SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("M11 DETECTION SUMMARY")
print("=" * 70)


print(
    f"Total Events        : {len(data)}"
)


print(
    "Predicted Attacks   :",
    int(
        data["ml_attack_prediction"].sum()
    )
)


print(
    "High/Critical Risk  :",
    int(
        (
            data["ml_risk_level"]
            .isin(["HIGH", "CRITICAL"])
        ).sum()
    )
)


# ============================================================
# SAVE
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
# COMPLETION
# ============================================================

print("\n" + "=" * 70)
print("M11 ENHANCED RANDOM FOREST COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nResults saved to:")

print(
    ML_OUTPUT_FILE
)

print()