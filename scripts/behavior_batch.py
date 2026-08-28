import pandas as pd
import numpy as np


# ============================================================
# M2 — BEHAVIOUR ENGINE
# Privileged Access Behaviour Deviation Scoring
# ============================================================


# ============================================================
# STEP 1: LOAD DATA
# ============================================================

users = pd.read_csv("output/users.csv")
events = pd.read_csv("output/events.csv")
ground_truth = pd.read_csv("output/ground_truth.csv")

print("=" * 70)
print("M2 BEHAVIOUR ENGINE")
print("=" * 70)

print("\nDATA LOADED SUCCESSFULLY")
print("Users:", users.shape)
print("Events:", events.shape)
print("Ground Truth:", ground_truth.shape)


# ============================================================
# STEP 2: MERGE EVENTS WITH USER BASELINE
# ============================================================

data = events.merge(
    users,
    on="user_id",
    how="left"
)

data["timestamp"] = pd.to_datetime(data["timestamp"])

data = data.sort_values(
    ["user_id", "timestamp"]
).reset_index(drop=True)

print("\nMerged data:", data.shape)


# ============================================================
# STEP 3: LOGIN-HOUR DEVIATION
# Only applies to LOGIN events
# ============================================================

data["event_hour"] = data["timestamp"].dt.hour

raw_difference = (
    data["event_hour"]
    - data["typical_login_hour"]
).abs()

# Handle midnight boundary correctly
data["login_hour_deviation"] = raw_difference.apply(
    lambda x: min(x, 24 - x)
)


def login_score(deviation, spread):

    if deviation <= spread:
        return 0
    elif deviation <= spread * 2:
        return 30
    elif deviation <= spread * 3:
        return 60
    else:
        return 100


data["login_deviation_score"] = 0

login_mask = data["event_type"] == "login"

data.loc[
    login_mask,
    "login_deviation_score"
] = data.loc[
    login_mask
].apply(
    lambda row: login_score(
        row["login_hour_deviation"],
        row["login_hour_spread"]
    ),
    axis=1
)


# ============================================================
# STEP 4: AFTER-HOURS DETECTION
# Only applies to LOGIN events
# ============================================================

data["after_hours_flag"] = 0

data.loc[
    (data["event_type"] == "login")
    &
    (
        data["login_hour_deviation"]
        > data["login_hour_spread"] * 2
    ),
    "after_hours_flag"
] = 1


def after_hours_score(flag):

    if flag == 1:
        return 100

    return 0


data["after_hours_score"] = (
    data["after_hours_flag"]
    .apply(after_hours_score)
)


# ============================================================
# STEP 5: DEVICE DEVIATION
# ============================================================

def device_score(device, home_device, new_flag):

    if new_flag == 1:
        return 100

    elif device != home_device:
        return 70

    return 0


data["device_deviation_score"] = data.apply(
    lambda row: device_score(
        row["device_id"],
        row["home_device"],
        row["new_device_flag"]
    ),
    axis=1
)


# ============================================================
# STEP 6: SESSION DURATION DEVIATION
# ============================================================

data["session_duration_deviation"] = (
    data["session_duration_minutes"]
    - data["avg_session_minutes"]
).abs()


def session_score(duration, average):

    # No session data
    if duration <= 0 or average <= 0:
        return 0

    ratio = abs(duration - average) / average

    if ratio <= 0.5:
        return 0
    elif ratio <= 1:
        return 30
    elif ratio <= 2:
        return 60
    else:
        return 100


data["session_deviation_score"] = data.apply(
    lambda row: session_score(
        row["session_duration_minutes"],
        row["avg_session_minutes"]
    ),
    axis=1
)


# ============================================================
# STEP 7: TRANSACTION AMOUNT DEVIATION
# Only relevant for TRANSACTION events
# ============================================================

data["transaction_amount_deviation"] = (
    data["transaction_amount"]
    - data["avg_txn_amount"]
).abs()


def transaction_amount_score(
    amount,
    average,
    spread,
    exceeds_limit
):

    # Not a transaction
    if amount <= 0:
        return 0

    # Explicit transaction limit violation
    if exceeds_limit == 1:
        return 100

    deviation = abs(amount - average)

    if deviation <= spread:
        return 0
    elif deviation <= spread * 2:
        return 30
    elif deviation <= spread * 3:
        return 60
    else:
        return 100


data["transaction_amount_score"] = data.apply(
    lambda row: transaction_amount_score(
        row["transaction_amount"],
        row["avg_txn_amount"],
        row["txn_amount_spread"],
        row["exceeds_limit_flag"]
    ),
    axis=1
)


# ============================================================
# STEP 8: TRANSACTION FREQUENCY DEVIATION
# Count transactions within a 60-minute window
# ============================================================

data["transaction_frequency"] = 0

transaction_mask = (
    (data["event_type"] == "transaction")
    &
    (data["transaction_amount"] > 0)
)


for index, row in data[transaction_mask].iterrows():

    user = row["user_id"]

    current_time = row["timestamp"]

    start_time = current_time - pd.Timedelta(hours=1)

    count = len(
        data[
            (data["user_id"] == user)
            &
            (data["event_type"] == "transaction")
            &
            (data["timestamp"] >= start_time)
            &
            (data["timestamp"] <= current_time)
        ]
    )

    data.loc[
        index,
        "transaction_frequency"
    ] = count


def transaction_frequency_score(count):

    if count <= 1:
        return 0
    elif count == 2:
        return 30
    elif count == 3:
        return 60
    else:
        return 100


data["transaction_frequency_score"] = (
    data["transaction_frequency"]
    .apply(transaction_frequency_score)
)


# ============================================================
# STEP 9: PEER-GROUP EVENT DEVIATION
# ============================================================

peer_stats = users.groupby(
    "peer_group_id"
).agg(
    peer_avg_session=(
        "avg_session_minutes",
        "mean"
    ),
    peer_avg_transaction=(
        "avg_txn_amount",
        "mean"
    ),
    peer_avg_login_hour=(
        "typical_login_hour",
        "mean"
    )
).reset_index()


data = data.merge(
    peer_stats,
    on="peer_group_id",
    how="left"
)


# ------------------------------------------------------------
# PEER SESSION DEVIATION
# ------------------------------------------------------------

data["peer_session_event_deviation"] = (
    data["session_duration_minutes"]
    - data["peer_avg_session"]
).abs()


data["peer_session_score"] = 0

session_ratio = (
    data["peer_session_event_deviation"]
    /
    data["peer_avg_session"].replace(0, 1)
)


data.loc[
    (data["session_duration_minutes"] > 0)
    &
    (session_ratio > 0.5),
    "peer_session_score"
] = 30


data.loc[
    (data["session_duration_minutes"] > 0)
    &
    (session_ratio > 1),
    "peer_session_score"
] = 60


data.loc[
    (data["session_duration_minutes"] > 0)
    &
    (session_ratio > 2),
    "peer_session_score"
] = 100


# ------------------------------------------------------------
# PEER TRANSACTION DEVIATION
# ------------------------------------------------------------

data["peer_transaction_event_deviation"] = (
    data["transaction_amount"]
    - data["peer_avg_transaction"]
).abs()


data["peer_transaction_score"] = 0

transaction_ratio = (
    data["peer_transaction_event_deviation"]
    /
    data["peer_avg_transaction"].replace(0, 1)
)


data.loc[
    (data["event_type"] == "transaction")
    &
    (data["transaction_amount"] > 0)
    &
    (transaction_ratio > 0.5),
    "peer_transaction_score"
] = 30


data.loc[
    (data["event_type"] == "transaction")
    &
    (data["transaction_amount"] > 0)
    &
    (transaction_ratio > 1),
    "peer_transaction_score"
] = 60


data.loc[
    (data["event_type"] == "transaction")
    &
    (data["transaction_amount"] > 0)
    &
    (transaction_ratio > 2),
    "peer_transaction_score"
] = 100


# ------------------------------------------------------------
# PEER LOGIN DEVIATION
# Only applies to LOGIN events
# ------------------------------------------------------------

data["peer_login_event_deviation"] = (
    data["event_hour"]
    - data["peer_avg_login_hour"]
).abs()


data["peer_login_event_deviation"] = (
    data["peer_login_event_deviation"]
    .apply(lambda x: min(x, 24 - x))
)


data["peer_login_score"] = 0


data.loc[
    data["peer_login_event_deviation"] > 1,
    "peer_login_score"
] = 30


data.loc[
    data["peer_login_event_deviation"] > 2,
    "peer_login_score"
] = 60


data.loc[
    data["peer_login_event_deviation"] > 4,
    "peer_login_score"
] = 100


# Apply peer login score ONLY to login events

data.loc[
    data["event_type"] != "login",
    "peer_login_score"
] = 0


# ------------------------------------------------------------
# FINAL PEER DEVIATION SCORE
# ------------------------------------------------------------

data["peer_deviation_score"] = (
    data["peer_session_score"] * 0.30
    +
    data["peer_transaction_score"] * 0.40
    +
    data["peer_login_score"] * 0.30
)


data["peer_deviation_score"] = (
    data["peer_deviation_score"]
    .clip(0, 100)
    .round(2)
)


# ============================================================
# STEP 10: FINAL M2 BEHAVIOUR SCORE
# ============================================================

data["m2_behavior_score"] = (
    data["login_deviation_score"] * 0.20
    +
    data["after_hours_score"] * 0.10
    +
    data["device_deviation_score"] * 0.15
    +
    data["session_deviation_score"] * 0.15
    +
    data["transaction_amount_score"] * 0.20
    +
    data["transaction_frequency_score"] * 0.10
    +
    data["peer_deviation_score"] * 0.10
)


data["m2_behavior_score"] = (
    data["m2_behavior_score"]
    .clip(0, 100)
    .round(2)
)


# ============================================================
# STEP 11: M2 BEHAVIOUR RISK LEVEL
# ============================================================

def get_behavior_level(score):

    if score >= 70:
        return "HIGH"

    elif score >= 40:
        return "MODERATE"

    elif score >= 20:
        return "LOW-MODERATE"

    return "LOW"


data["m2_behavior_risk_level"] = (
    data["m2_behavior_score"]
    .apply(get_behavior_level)
)


# ============================================================
# STEP 12: TOP BEHAVIOURAL DEVIATIONS
# ============================================================

print("\n")
print("=" * 70)
print("TOP 20 BEHAVIOURAL DEVIATIONS")
print("=" * 70)


display_columns = [
    "event_id",
    "user_id",
    "event_type",
    "timestamp",
    "login_deviation_score",
    "after_hours_score",
    "device_deviation_score",
    "session_deviation_score",
    "transaction_amount_score",
    "transaction_frequency_score",
    "peer_deviation_score",
    "m2_behavior_score",
    "m2_behavior_risk_level"
]


print(
    data[
        display_columns
    ]
    .sort_values(
        "m2_behavior_score",
        ascending=False
    )
    .head(20)
)


# ============================================================
# STEP 13: BEHAVIOUR RISK DISTRIBUTION
# ============================================================

print("\n")
print("=" * 70)
print("M2 BEHAVIOUR RISK DISTRIBUTION")
print("=" * 70)


print(
    data[
        "m2_behavior_risk_level"
    ]
    .value_counts()
)


# ============================================================
# STEP 14: GROUND TRUTH COMPARISON
# ============================================================

evaluation = data.merge(
    ground_truth[
        [
            "event_id",
            "is_attack",
            "scenario_id",
            "expected_risk_final"
        ]
    ],
    on="event_id",
    how="left"
)


print("\n")
print("=" * 70)
print("GROUND TRUTH VS M2 BEHAVIOUR SCORE")
print("=" * 70)


attack_events = evaluation[
    evaluation["is_attack"] == 1
]


print(
    attack_events[
        [
            "event_id",
            "user_id",
            "event_type",
            "timestamp",
            "is_attack",
            "scenario_id",
            "expected_risk_final",
            "login_deviation_score",
            "after_hours_score",
            "device_deviation_score",
            "session_deviation_score",
            "transaction_amount_score",
            "transaction_frequency_score",
            "peer_deviation_score",
            "m2_behavior_score",
            "m2_behavior_risk_level"
        ]
    ]
    .sort_values(
        "m2_behavior_score",
        ascending=False
    )
)


# ============================================================
# STEP 15: SAVE M2 RESULTS
# ============================================================

data.to_csv(
    "output/behavior_results.csv",
    index=False
)


print("\n")
print("=" * 70)
print("M2 BEHAVIOUR ENGINE COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nResults saved to:")
print("output/behavior_results.csv")