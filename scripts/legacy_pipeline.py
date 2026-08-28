import pandas as pd
import numpy as np

# ============================================================
# STEP 1: LOAD DATA
# ============================================================

users = pd.read_csv("output/users.csv")
events = pd.read_csv("output/events.csv")
context = pd.read_csv("output/context.csv")
ground_truth = pd.read_csv("output/ground_truth.csv")

print("DATA LOADED SUCCESSFULLY")
print("Users:", users.shape)
print("Events:", events.shape)
print("Context:", context.shape)
print("Ground Truth:", ground_truth.shape)


# ============================================================
# STEP 2: MERGE EVENTS WITH USER BASELINE
# ============================================================

merged_data = events.merge(
    users,
    on="user_id",
    how="left"
)

# Convert timestamp to datetime
merged_data["timestamp"] = pd.to_datetime(
    merged_data["timestamp"]
)

# Extract hour
merged_data["event_hour"] = (
    merged_data["timestamp"].dt.hour
)


# ============================================================
# STEP 3: LOGIN TIME RISK
# ============================================================

raw_difference = (
    merged_data["event_hour"]
    - merged_data["typical_login_hour"]
).abs()

# Correct difference around midnight
merged_data["login_hour_difference"] = raw_difference.apply(
    lambda x: min(x, 24 - x)
)


def calculate_login_risk(difference, spread):

    if difference <= spread:
        return 0

    elif difference <= spread * 2:
        return 30

    elif difference <= spread * 3:
        return 60

    else:
        return 100


merged_data["login_risk"] = merged_data.apply(
    lambda row: calculate_login_risk(
        row["login_hour_difference"],
        row["login_hour_spread"]
    ),
    axis=1
)


# ============================================================
# STEP 4: DEVICE RISK
# ============================================================

def calculate_device_risk(
    device_id,
    home_device,
    new_device_flag
):

    if new_device_flag == 1:
        return 100

    elif device_id != home_device:
        return 70

    else:
        return 0


merged_data["device_risk"] = merged_data.apply(
    lambda row: calculate_device_risk(
        row["device_id"],
        row["home_device"],
        row["new_device_flag"]
    ),
    axis=1
)


# ============================================================
# STEP 5: TRANSACTION RISK
# ============================================================

def calculate_transaction_risk(
    transaction_amount,
    avg_txn_amount,
    txn_amount_spread,
    transaction_limit,
    exceeds_limit_flag
):

    # No transaction
    if transaction_amount <= 0:
        return 0

    # Transaction exceeds allowed limit
    if exceeds_limit_flag == 1:
        return 100

    difference = abs(
        transaction_amount - avg_txn_amount
    )

    if difference <= txn_amount_spread:
        return 0

    elif difference <= txn_amount_spread * 2:
        return 30

    elif difference <= txn_amount_spread * 3:
        return 60

    else:
        return 90


merged_data["transaction_risk"] = merged_data.apply(
    lambda row: calculate_transaction_risk(
        row["transaction_amount"],
        row["avg_txn_amount"],
        row["txn_amount_spread"],
        row["transaction_limit"],
        row["exceeds_limit_flag"]
    ),
    axis=1
)


# ============================================================
# STEP 6: SENSITIVE RESOURCE RISK
# ============================================================

def calculate_sensitive_resource_risk(
    sensitive_resource_flag,
    records_accessed
):

    if sensitive_resource_flag == 1:

        # Large number of sensitive records
        if records_accessed > 100:
            return 100

        # Sensitive resource access
        return 60

    return 0


merged_data["resource_risk"] = merged_data.apply(
    lambda row: calculate_sensitive_resource_risk(
        row["sensitive_resource_flag"],
        row["records_accessed"]
    ),
    axis=1
)


# ============================================================
# STEP 7: PERMISSION / PRIVILEGE RISK
# ============================================================

def calculate_permission_risk(
    permission_change_flag,
    new_permission_level
):

    if permission_change_flag == 1:

        # High privilege
        if new_permission_level in [
            "admin",
            "administrator",
            "high"
        ]:
            return 100

        return 70

    return 0


merged_data["permission_risk"] = merged_data.apply(
    lambda row: calculate_permission_risk(
        row["permission_change_flag"],
        row["new_permission_level"]
    ),
    axis=1
)


# ============================================================
# STEP 8: BENEFICIARY RISK
# ============================================================

def calculate_beneficiary_risk(
    new_beneficiary_flag,
    transaction_amount
):

    if new_beneficiary_flag == 1:

        # New beneficiary with transaction
        if transaction_amount > 0:
            return 80

        return 50

    return 0


merged_data["beneficiary_risk"] = merged_data.apply(
    lambda row: calculate_beneficiary_risk(
        row["new_beneficiary_flag"],
        row["transaction_amount"]
    ),
    axis=1
)


# ============================================================
# STEP 9: SESSION DURATION RISK
# ============================================================

def calculate_session_risk(
    session_duration,
    avg_session
):

    if session_duration <= 0:
        return 0

    difference = abs(
        session_duration - avg_session
    )

    if difference <= avg_session * 0.5:
        return 0

    elif difference <= avg_session:
        return 30

    elif difference <= avg_session * 2:
        return 60

    else:
        return 90


merged_data["session_risk"] = merged_data.apply(
    lambda row: calculate_session_risk(
        row["session_duration_minutes"],
        row["avg_session_minutes"]
    ),
    axis=1
)


# ============================================================
# STEP 10: BEHAVIOUR RISK SCORE
# ============================================================

# Weighted combination of behavioural signals

merged_data["behavior_risk"] = (
    merged_data["login_risk"] * 0.15
    + merged_data["device_risk"] * 0.20
    + merged_data["transaction_risk"] * 0.25
    + merged_data["resource_risk"] * 0.15
    + merged_data["permission_risk"] * 0.15
    + merged_data["beneficiary_risk"] * 0.05
    + merged_data["session_risk"] * 0.05
)

merged_data["behavior_risk"] = (
    merged_data["behavior_risk"].round(2)
)


# ============================================================
# STEP 11: SEQUENCE RISK
# ============================================================

# Sort by user and time
merged_data = merged_data.sort_values(
    ["user_id", "timestamp"]
).reset_index(drop=True)


def calculate_sequence_risk(data):

    sequence_risks = []

    for index, row in data.iterrows():

        risk = 0

        user_id = row["user_id"]
        current_time = row["timestamp"]

        # Look at previous events from same user
        previous_events = data[
            (data["user_id"] == user_id)
            &
            (data["timestamp"] < current_time)
            &
            (
                data["timestamp"]
                >= current_time - pd.Timedelta(minutes=60)
            )
        ]

        # Check suspicious combinations
        if len(previous_events) > 0:

            # New device followed by sensitive access
            if (
                row["sensitive_resource_flag"] == 1
                and
                previous_events["new_device_flag"].eq(1).any()
            ):
                risk += 40

            # Permission change followed by transaction
            if (
                row["transaction_amount"] > 0
                and
                previous_events[
                    "permission_change_flag"
                ].eq(1).any()
            ):
                risk += 40

            # New beneficiary after suspicious activity
            if (
                row["new_beneficiary_flag"] == 1
                and len(previous_events) >= 2
            ):
                risk += 20

        # Many events in one hour
        if len(previous_events) >= 5:
            risk += 20

        sequence_risks.append(
            min(risk, 100)
        )

    return sequence_risks


merged_data["sequence_risk"] = (
    calculate_sequence_risk(merged_data)
)


# ============================================================
# STEP 12: CONTEXT RISK
# ============================================================

# Default: no context adjustment
merged_data["context_risk"] = 0


# Check context records
for _, ctx in context.iterrows():

    # Adjust based on context information
    # Currently we use context as a small adjustment
    # rather than treating it as suspicious by itself

    if "user_id" in context.columns:

        mask = (
            merged_data["user_id"]
            == ctx["user_id"]
        )

        # Context reduces risk slightly
        merged_data.loc[
            mask,
            "context_risk"
        ] = -10


# ============================================================
# STEP 13: FINAL RISK SCORE
# ============================================================

merged_data["final_risk"] = (
    merged_data["behavior_risk"] * 0.70
    + merged_data["sequence_risk"] * 0.20
    + merged_data["context_risk"] * 0.10
)

# Keep score between 0 and 100
merged_data["final_risk"] = (
    merged_data["final_risk"]
    .clip(0, 100)
    .round(2)
)


# ============================================================
# STEP 14: ALERT LEVEL
# ============================================================

def get_alert_level(score):

    if score >= 70:
        return "CRITICAL"

    elif score >= 50:
        return "HIGH"

    elif score >= 30:
        return "MEDIUM"

    else:
        return "LOW"


merged_data["alert_level"] = (
    merged_data["final_risk"]
    .apply(get_alert_level)
)


# ============================================================
# STEP 15: DISPLAY TOP SUSPICIOUS EVENTS
# ============================================================

print("\n")
print("=" * 70)
print("TOP 20 SUSPICIOUS EVENTS")
print("=" * 70)

print(
    merged_data[
        [
            "event_id",
            "user_id",
            "event_type",
            "timestamp",
            "login_risk",
            "device_risk",
            "transaction_risk",
            "resource_risk",
            "permission_risk",
            "beneficiary_risk",
            "session_risk",
            "behavior_risk",
            "sequence_risk",
            "context_risk",
            "final_risk",
            "alert_level"
        ]
    ]
    .sort_values(
        "final_risk",
        ascending=False
    )
    .head(20)
)


# ============================================================
# STEP 16: COMPARE WITH GROUND TRUTH
# ============================================================

print("\n")
print("=" * 70)
print("GROUND TRUTH COMPARISON")
print("=" * 70)

# Show ground truth columns
print("Ground truth columns:")
print(ground_truth.columns.tolist())

# Merge predictions with ground truth
evaluation = merged_data.merge(
    ground_truth,
    on="event_id",
    how="left"
)

print("\nEvaluation sample:")
print(evaluation.head())


# ============================================================
# STEP 17: SAVE RESULTS
# ============================================================

merged_data.to_csv(
    "output/results.csv",
    index=False
)

print("\n")
print("=" * 70)
print("PROJECT COMPLETED SUCCESSFULLY")
print("=" * 70)

print("Results saved to:")
print("output/results.csv")

print("\nAlert distribution:")
print(
    merged_data["alert_level"]
    .value_counts()
)
print("\n--- GROUND TRUTH COLUMNS ---")
print(ground_truth.columns.tolist())

print("\n--- FIRST 10 GROUND TRUTH ROWS ---")
print(ground_truth.head(10))
# ============================================================
# STEP 18: MACHINE LEARNING MODEL TRAINING
# ============================================================

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score
)

print("\n")
print("=" * 70)
print("MACHINE LEARNING MODEL TRAINING")
print("=" * 70)


# ------------------------------------------------------------
# Merge calculated features with ground truth
# ------------------------------------------------------------

ml_data = merged_data.merge(
    ground_truth[
        [
            "event_id",
            "is_attack"
        ]
    ],
    on="event_id",
    how="left"
)


# ------------------------------------------------------------
# Select features for training
# ------------------------------------------------------------

features = [
    "login_risk",
    "device_risk",
    "transaction_risk",
    "resource_risk",
    "permission_risk",
    "beneficiary_risk",
    "session_risk",
    "behavior_risk",
    "sequence_risk"
]

X = ml_data[features]

# Target: 0 = normal, 1 = attack
y = ml_data["is_attack"]


print("\nTraining features:")
print(features)

print("\nNumber of normal events:", (y == 0).sum())
print("Number of attack events:", (y == 1).sum())


# ------------------------------------------------------------
# Split data into training and testing data
# ------------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y
)


print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ------------------------------------------------------------
# Create and train Random Forest model
# ------------------------------------------------------------

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)

model.fit(
    X_train,
    y_train
)


print("\nMODEL TRAINING COMPLETED SUCCESSFULLY")


# ------------------------------------------------------------
# Make predictions
# ------------------------------------------------------------

y_pred = model.predict(X_test)


# ------------------------------------------------------------
# Evaluate the model
# ------------------------------------------------------------

accuracy = accuracy_score(
    y_test,
    y_pred
)

print("\n")
print("=" * 70)
print("MODEL EVALUATION")
print("=" * 70)

print("\nAccuracy:")
print(round(accuracy * 100, 2), "%")

print("\nConfusion Matrix:")
print(
    confusion_matrix(
        y_test,
        y_pred
    )
)

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred
    )
)


# ------------------------------------------------------------
# FEATURE IMPORTANCE
# ------------------------------------------------------------

feature_importance = pd.DataFrame(
    {
        "feature": features,
        "importance": model.feature_importances_
    }
)

feature_importance = feature_importance.sort_values(
    "importance",
    ascending=False
)

print("\n")
print("=" * 70)
print("FEATURE IMPORTANCE")
print("=" * 70)

print(feature_importance)


# ------------------------------------------------------------
# PREDICT ALL EVENTS
# ------------------------------------------------------------

ml_data["ml_prediction"] = model.predict(X)

ml_data["ml_attack_probability"] = (
    model.predict_proba(X)[:, 1]
)


# ------------------------------------------------------------
# SAVE ML RESULTS
# ------------------------------------------------------------

ml_data.to_csv(
    "output/ml_results.csv",
    index=False
)

print("\nML RESULTS SAVED TO:")
print("output/ml_results.csv")