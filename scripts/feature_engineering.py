# ============================================================
# M10 FEATURE ENGINEERING ENGINE
# ============================================================

import os
import numpy as np
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

EVENTS_FILE = os.path.join(
    DATA_DIR,
    "events.csv"
)

BEHAVIOUR_FILE = os.path.join(
    OUTPUT_DIR,
    "behavior_baseline_results.csv"
)

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "enhanced_behavior_features.csv"
)


# ============================================================
# HEADER
# ============================================================

print("=" * 70)
print("M10 FEATURE ENGINEERING ENGINE")
print("=" * 70)


# ============================================================
# LOAD DATA
# ============================================================

events = pd.read_csv(EVENTS_FILE)
behaviour = pd.read_csv(BEHAVIOUR_FILE)

print("\nDATA LOADED SUCCESSFULLY")
print("Events:", events.shape)
print("Behaviour Results:", behaviour.shape)


# ============================================================
# PREPARE EVENT DATA
# ============================================================

data = behaviour.copy()

data["timestamp"] = pd.to_datetime(
    data["timestamp"],
    errors="coerce"
)

data = data.sort_values(
    ["user_id", "timestamp"]
).reset_index(drop=True)


# ============================================================
# FEATURE 1 — EVENT HOUR
# ============================================================

data["event_hour"] = data["timestamp"].dt.hour


# ============================================================
# FEATURE 2 — OFF-HOURS ACTIVITY
# ============================================================

# Normal working period assumed to be 08:00–18:00.
# This is a feature, not a final attack decision.

data["off_hours_flag"] = (
    (data["event_hour"] < 8) |
    (data["event_hour"] >= 18)
).astype(int)


# ============================================================
# FEATURE 3 — WEEKEND ACTIVITY
# ============================================================

data["weekend_activity_flag"] = (
    data["timestamp"].dt.dayofweek >= 5
).astype(int)


# ============================================================
# FEATURE 4 — TIME SINCE PREVIOUS USER EVENT
# ============================================================

data["previous_event_timestamp"] = (
    data.groupby("user_id")["timestamp"]
    .shift(1)
)

data["time_since_previous_event_seconds"] = (
    data["timestamp"] -
    data["previous_event_timestamp"]
).dt.total_seconds()

data["time_since_previous_event_seconds"] = (
    data["time_since_previous_event_seconds"]
    .fillna(999999)
)


# ============================================================
# FEATURE 5 — USER EVENT VELOCITY
# ============================================================

def rolling_event_count(group, window):

    timestamps = group["timestamp"]

    return pd.Series(
        [
            (
                (timestamps >= current - window) &
                (timestamps < current)
            ).sum()
            for current in timestamps
        ],
        index=group.index
    )


data["user_events_last_5min"] = (
    data.groupby("user_id", group_keys=False)
    .apply(
        lambda x: rolling_event_count(
            x,
            pd.Timedelta(minutes=5)
        )
    )
    .reset_index(level=0, drop=True)
)


data["user_events_last_15min"] = (
    data.groupby("user_id", group_keys=False)
    .apply(
        lambda x: rolling_event_count(
            x,
            pd.Timedelta(minutes=15)
        )
    )
    .reset_index(level=0, drop=True)
)


data["user_events_last_30min"] = (
    data.groupby("user_id", group_keys=False)
    .apply(
        lambda x: rolling_event_count(
            x,
            pd.Timedelta(minutes=30)
        )
    )
    .reset_index(level=0, drop=True)
)


# ============================================================
# FEATURE 6 — EVENT VELOCITY SCORE
# ============================================================

data["event_velocity_score"] = (
    0.40 * data["user_events_last_5min"].clip(0, 10) / 10 +
    0.35 * data["user_events_last_15min"].clip(0, 20) / 20 +
    0.25 * data["user_events_last_30min"].clip(0, 30) / 30
) * 100


data["event_velocity_score"] = (
    data["event_velocity_score"]
    .clip(0, 100)
    .round(2)
)


# ============================================================
# FEATURE 7 — TRANSACTION RATIO TO USER AVERAGE
# ============================================================

data["avg_txn_amount"] = pd.to_numeric(
    data["avg_txn_amount"],
    errors="coerce"
).fillna(0)

data["transaction_amount"] = pd.to_numeric(
    data["transaction_amount"],
    errors="coerce"
).fillna(0)


data["transaction_ratio_to_user_average"] = np.where(
    data["avg_txn_amount"] > 0,
    data["transaction_amount"] /
    data["avg_txn_amount"],
    0
)

data["transaction_ratio_to_user_average"] = (
    data["transaction_ratio_to_user_average"]
    .replace([np.inf, -np.inf], 0)
    .clip(0, 100)
    .round(2)
)


# ============================================================
# FEATURE 8 — TRANSACTION SPIKE SCORE
# ============================================================

data["transaction_spike_score"] = (
    data["transaction_ratio_to_user_average"]
    .clip(0, 10)
    / 10
    * 100
).round(2)


# ============================================================
# FEATURE 9 — NEW DEVICE + OFF-HOURS COMBINATION
# ============================================================

data["new_device_off_hours_flag"] = (
    (
        (data["new_device_flag"] == 1) &
        (data["off_hours_flag"] == 1)
    )
).astype(int)


# ============================================================
# FEATURE 10 — SENSITIVE ACCESS + NEW DEVICE
# ============================================================

data["sensitive_new_device_flag"] = (
    (
        (data["is_sensitive_file_access"] == 1) &
        (data["new_device_flag"] == 1)
    )
).astype(int)


# ============================================================
# FEATURE 11 — PRIVILEGE CHANGE + SENSITIVE ACCESS
# ============================================================

data["privilege_sensitive_access_flag"] = (
    (
        (data["is_permission_change"] == 1) &
        (data["is_sensitive_file_access"] == 1)
    )
).astype(int)


# ============================================================
# FEATURE 12 — BENEFICIARY + TRANSACTION COMBINATION
# ============================================================

data["beneficiary_transaction_flag"] = (
    (
        (data["is_new_beneficiary"] == 1) &
        (data["is_large_transaction"] == 1)
    )
).astype(int)


# ============================================================
# FEATURE 13 — ATTACK-STAGE COMBINATION
# ============================================================

data["attack_stage_signal"] = (
    (
        data["is_new_device_login"] +
        data["is_permission_change"] +
        data["is_sensitive_file_access"] +
        data["is_new_beneficiary"] +
        data["is_large_transaction"]
    )
    .clip(0, 5)
)


data["attack_stage_score"] = (
    data["attack_stage_signal"] / 5 * 100
).round(2)


# ============================================================
# FEATURE 14 — SEQUENCE PROGRESSION SIGNAL
# ============================================================

data["sequence_progression_score"] = (
    0.50 * data["sequence_behavior_score"] +
    0.20 * data["attack_stage_score"] +
    0.15 * data["event_velocity_score"] +
    0.15 * data["transaction_spike_score"]
).clip(0, 100).round(2)


# ============================================================
# FEATURE 15 — COMPOSITE CONTEXT RISK
# ============================================================

data["contextual_risk_score"] = (
    0.30 * data["event_velocity_score"] +
    0.20 * data["transaction_spike_score"] +
    0.20 * data["attack_stage_score"] +
    0.15 * data["off_hours_flag"] * 100 +
    0.15 * data["new_device_off_hours_flag"] * 100
).clip(0, 100).round(2)


# ============================================================
# CLEANUP
# ============================================================

data = data.replace(
    [np.inf, -np.inf],
    np.nan
)

data = data.fillna(0)


# ============================================================
# DISPLAY NEW FEATURES
# ============================================================

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
    "attack_stage_signal",
    "attack_stage_score",
    "sequence_progression_score",
    "contextual_risk_score"
]


# ============================================================
# OUTPUT
# ============================================================

print("\n" + "=" * 70)
print("NEW FEATURES GENERATED")
print("=" * 70)

print(
    data[
        ["event_id", "user_id", "event_type"] +
        new_features
    ].head(20).to_string(index=False)
)


# ============================================================
# FEATURE STATISTICS
# ============================================================

print("\n" + "=" * 70)
print("FEATURE STATISTICS")
print("=" * 70)

print(
    data[new_features]
    .describe()
    .round(2)
    .to_string()
)


# ============================================================
# SAVE
# ============================================================

data.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# COMPLETION
# ============================================================

print("\n" + "=" * 70)
print("M10 FEATURE ENGINEERING COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nTotal Events:", len(data))
print("New Features:", len(new_features))

print("\nResults saved to:")
print(OUTPUT_FILE)