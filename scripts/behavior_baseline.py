import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "output"

USERS_FILE = DATA_DIR / "users.csv"
EVENTS_FILE = DATA_DIR / "events.csv"
GROUND_TRUTH_FILE = DATA_DIR / "ground_truth.csv"

OUTPUT_FILE = OUTPUT_DIR / "behavior_baseline_results.csv"

OUTPUT_DIR.mkdir(exist_ok=True)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def safe_number(value, default=0.0):
    """
    Safely convert a value to float.
    """
    try:
        if pd.isna(value):
            return default
        return float(value)
    except (ValueError, TypeError):
        return default


def calculate_z_score(value, mean, spread):
    """
    Calculate a safe absolute z-score.
    """

    value = safe_number(value)
    mean = safe_number(mean)
    spread = safe_number(spread)

    if spread <= 0:
        return 0.0

    return abs(value - mean) / spread


def risk_from_zscore(z_score):
    """
    Convert a deviation into a 0-100 score.
    """

    if z_score >= 4:
        return 100.0

    elif z_score >= 3:
        return 80.0

    elif z_score >= 2:
        return 60.0

    elif z_score >= 1:
        return 30.0

    return 0.0


def circular_hour_difference(hour1, hour2):
    """
    Calculate the shortest difference between two hours
    on a 24-hour clock.
    """

    difference = abs(hour1 - hour2)

    return min(difference, 24 - difference)


# ============================================================
# LOAD DATA
# ============================================================

print()
print("=" * 70)
print("M2 BEHAVIOUR BASELINE ENGINE")
print("=" * 70)
print()

users = pd.read_csv(USERS_FILE)
events = pd.read_csv(EVENTS_FILE)

print("DATA LOADED SUCCESSFULLY")
print(f"Users: {users.shape}")
print(f"Events: {events.shape}")

ground_truth = None

if GROUND_TRUTH_FILE.exists():

    ground_truth = pd.read_csv(GROUND_TRUTH_FILE)

    print(f"Ground Truth: {ground_truth.shape}")


# ============================================================
# MERGE USERS + EVENTS
# ============================================================

data = events.merge(
    users,
    on="user_id",
    how="left"
)

print()
print(f"Merged data: {data.shape}")


# ============================================================
# PREPARE TIMESTAMP
# ============================================================

data["timestamp"] = pd.to_datetime(
    data["timestamp"],
    errors="coerce"
)

data["event_hour"] = data["timestamp"].dt.hour.fillna(0)

data["event_date"] = data["timestamp"].dt.date


# ============================================================
# 1. LOGIN TIME DEVIATION
# ============================================================

data["login_hour_difference"] = data.apply(
    lambda row: circular_hour_difference(
        safe_number(row["event_hour"]),
        safe_number(row["typical_login_hour"])
    ),
    axis=1
)

data["login_deviation_z"] = data.apply(
    lambda row: (
        row["login_hour_difference"]
        / max(safe_number(row["login_hour_spread"]), 0.5)
    ),
    axis=1
)

data["login_behavior_score"] = data[
    "login_deviation_z"
].apply(risk_from_zscore)


# Only login events should contribute strongly to login behaviour.
data.loc[
    data["event_type"] != "login",
    "login_behavior_score"
] = 0.0


# ============================================================
# 2. TRANSACTION AMOUNT DEVIATION
# ============================================================

data["transaction_amount_z"] = data.apply(
    lambda row: calculate_z_score(
        row["transaction_amount"],
        row["avg_txn_amount"],
        row["txn_amount_spread"]
    ),
    axis=1
)

data["transaction_behavior_score"] = data[
    "transaction_amount_z"
].apply(risk_from_zscore)


# Only transaction events should receive transaction score.
data.loc[
    data["event_type"] != "transaction",
    "transaction_behavior_score"
] = 0.0


# ============================================================
# 3. SESSION DURATION DEVIATION
# ============================================================

# Calculate each user's average session duration
# ============================================================
# 3. SESSION DURATION DEVIATION
# ============================================================

data["session_behavior_score"] = 0.0

if "session_duration_minutes" in data.columns:

    # Convert to numeric safely
    data["session_duration_minutes"] = pd.to_numeric(
        data["session_duration_minutes"],
        errors="coerce"
    ).fillna(0)

    # Calculate each user's average session duration
    user_session_mean = (
        data.groupby("user_id")["session_duration_minutes"]
        .mean()
        .rename("user_session_mean")
    )

    user_session_std = (
        data.groupby("user_id")["session_duration_minutes"]
        .std()
        .fillna(1)
        .rename("user_session_std")
    )

    data = data.merge(
        user_session_mean,
        on="user_id",
        how="left"
    )

    data = data.merge(
        user_session_std,
        on="user_id",
        how="left"
    )

    data["session_duration_z"] = data.apply(
        lambda row: calculate_z_score(
            row["session_duration_minutes"],
            row["user_session_mean"],
            max(safe_number(row["user_session_std"]), 1)
        ),
        axis=1
    )

    data["session_behavior_score"] = data[
        "session_duration_z"
    ].apply(risk_from_zscore)

    # Ignore zero-duration events
    data.loc[
        data["session_duration_minutes"] <= 0,
        "session_behavior_score"
    ] = 0.0

else:

    print()
    print(
        "WARNING: 'session_duration_minutes' column not found."
    )
    print(
        "Session behaviour scoring will be skipped."
    )

    data["session_duration_z"] = 0.0
    data["session_behavior_score"] = 0.0


# ============================================================
# 4. DEVICE BEHAVIOUR
# ============================================================

data["device_behavior_score"] = 0.0


# New device
data.loc[
    data["new_device_flag"] == 1,
    "device_behavior_score"
] = 70.0


# Device different from home device
data.loc[
    data["device_id"] != data["home_device"],
    "device_behavior_score"
] = np.maximum(
    data.loc[
        data["device_id"] != data["home_device"],
        "device_behavior_score"
    ],
    50.0
)


# ============================================================
# 5. USER EVENT-TYPE BASELINE
# ============================================================

# Count events per user and event type
user_event_counts = (
    data.groupby(["user_id", "event_type"])
    .size()
    .reset_index(name="user_event_type_count")
)

data = data.merge(
    user_event_counts,
    on=["user_id", "event_type"],
    how="left"
)


# Calculate total events per user
user_total_events = (
    data.groupby("user_id")
    .size()
    .reset_index(name="user_total_events")
)

data = data.merge(
    user_total_events,
    on="user_id",
    how="left"
)


data["user_event_type_frequency"] = (
    data["user_event_type_count"]
    / data["user_total_events"]
)


# Rare event types receive higher behavioural attention.
data["event_type_behavior_score"] = 0.0

data.loc[
    data["user_event_type_frequency"] < 0.05,
    "event_type_behavior_score"
] = 60.0

data.loc[
    (
        data["user_event_type_frequency"] >= 0.05
    )
    &
    (
        data["user_event_type_frequency"] < 0.10
    ),
    "event_type_behavior_score"
] = 30.0


# ============================================================
# 6. PEER GROUP BEHAVIOUR BASELINE
# ============================================================

# Calculate peer-group average login hour
peer_login_mean = (
    data.groupby("peer_group_id")["event_hour"]
    .mean()
    .rename("peer_login_mean")
)

peer_login_std = (
    data.groupby("peer_group_id")["event_hour"]
    .std()
    .fillna(1)
    .rename("peer_login_std")
)

data = data.merge(
    peer_login_mean,
    on="peer_group_id",
    how="left"
)

data = data.merge(
    peer_login_std,
    on="peer_group_id",
    how="left"
)


data["peer_login_event_deviation"] = data.apply(
    lambda row: calculate_z_score(
        row["event_hour"],
        row["peer_login_mean"],
        max(safe_number(row["peer_login_std"]), 1)
    ),
    axis=1
)


# ============================================================
# PEER LOGIN SCORE
# ============================================================

data["peer_login_score"] = 0.0

data.loc[
    data["peer_login_event_deviation"] > 1,
    "peer_login_score"
] = 30.0

data.loc[
    data["peer_login_event_deviation"] > 2,
    "peer_login_score"
] = 60.0

data.loc[
    data["peer_login_event_deviation"] > 4,
    "peer_login_score"
] = 100.0


# Only login events should contribute to peer login score.
data.loc[
    data["event_type"] != "login",
    "peer_login_score"
] = 0.0


# ============================================================
# PEER EVENT TYPE DEVIATION
# ============================================================

peer_event_counts = (
    data.groupby(["peer_group_id", "event_type"])
    .size()
    .reset_index(name="peer_event_type_count")
)

peer_total_events = (
    data.groupby("peer_group_id")
    .size()
    .reset_index(name="peer_total_events")
)

peer_frequency = peer_event_counts.merge(
    peer_total_events,
    on="peer_group_id",
    how="left"
)

peer_frequency["peer_event_frequency"] = (
    peer_frequency["peer_event_type_count"]
    / peer_frequency["peer_total_events"]
)

data = data.merge(
    peer_frequency[
        [
            "peer_group_id",
            "event_type",
            "peer_event_frequency"
        ]
    ],
    on=[
        "peer_group_id",
        "event_type"
    ],
    how="left"
)


data["peer_event_score"] = 0.0


# Rare behaviour within peer group
data.loc[
    data["peer_event_frequency"] < 0.05,
    "peer_event_score"
] = 40.0

data.loc[
    (
        data["peer_event_frequency"] >= 0.05
    )
    &
    (
        data["peer_event_frequency"] < 0.10
    ),
    "peer_event_score"
] = 20.0


# ============================================================
# 7. PEER DEVIATION SCORE
# ============================================================

data["peer_deviation_score"] = (
    0.7 * data["peer_login_score"]
    +
    0.3 * data["peer_event_score"]
)


# ============================================================
# FINAL M2 BEHAVIOUR SCORE
# ============================================================
# ============================================================
# 7. ATTACK SEQUENCE / BEHAVIOURAL CHAIN DETECTION
# ============================================================

print()
print("=" * 70)
print("ATTACK SEQUENCE DETECTION")
print("=" * 70)

# Make sure events are ordered correctly
data["timestamp"] = pd.to_datetime(
    data["timestamp"],
    errors="coerce"
)

data = data.sort_values(
    by=["user_id", "timestamp"]
).reset_index(drop=True)

# Default sequence score
data["sequence_behavior_score"] = 0.0


# ------------------------------------------------------------
# Define suspicious event types
# ------------------------------------------------------------

data["is_new_device_login"] = (
    (data["event_type"] == "login") &
    (data["new_device_flag"] == 1)
)

data["is_permission_change"] = (
    data["event_type"] == "permission_change"
)

data["is_sensitive_file_access"] = (
    (data["event_type"] == "file_access") &
    (data["sensitive_resource_flag"] == 1)
)

data["is_new_beneficiary"] = (
    (data["event_type"] == "beneficiary_change") &
    (data["new_beneficiary_flag"] == 1)
)

data["is_large_transaction"] = (
    (data["event_type"] == "transaction") &
    (data["transaction_amount"] > 0)
)


# ------------------------------------------------------------
# Check suspicious behaviour within the previous 60 minutes
# ------------------------------------------------------------

for index, row in data.iterrows():

    user_id = row["user_id"]
    current_time = row["timestamp"]

    if pd.isna(current_time):
        continue

    # Get events from the same user
    user_events = data[
        (data["user_id"] == user_id) &
        (data["timestamp"] < current_time)
    ]

    # Only look at the previous 60 minutes
    previous_events = user_events[
        user_events["timestamp"] >=
        current_time - pd.Timedelta(minutes=60)
    ]

    score = 0


    # --------------------------------------------------------
    # New device login followed by suspicious action
    # --------------------------------------------------------

    if row["event_type"] != "login":

        if previous_events["is_new_device_login"].any():
            score += 25


    # --------------------------------------------------------
    # Permission change after suspicious login
    # --------------------------------------------------------

    if row["is_permission_change"]:

        if previous_events["is_new_device_login"].any():
            score += 35


    # --------------------------------------------------------
    # Sensitive file access after suspicious login
    # --------------------------------------------------------

    if row["is_sensitive_file_access"]:

        if previous_events["is_new_device_login"].any():
            score += 35

        if previous_events["is_permission_change"].any():
            score += 20


    # --------------------------------------------------------
    # New beneficiary after suspicious activity
    # --------------------------------------------------------

    if row["is_new_beneficiary"]:

        if previous_events["is_new_device_login"].any():
            score += 30

        if previous_events["is_permission_change"].any():
            score += 25


    # --------------------------------------------------------
    # Transaction after suspicious sequence
    # --------------------------------------------------------

    if row["event_type"] == "transaction":

        if previous_events["is_new_device_login"].any():
            score += 25

        if previous_events["is_permission_change"].any():
            score += 25

        if previous_events["is_new_beneficiary"].any():
            score += 35


    # Limit score to 100
    data.at[index, "sequence_behavior_score"] = min(score, 100)


print()
print("Sequence detection completed.")

print()
print(
    data[
        data["sequence_behavior_score"] > 0
    ][
        [
            "event_id",
            "user_id",
            "timestamp",
            "event_type",
            "sequence_behavior_score"
        ]
    ].head(20)
)
print()
print("=" * 70)
print("AVAILABLE SCORE COLUMNS")
print("=" * 70)

print([
    col for col in data.columns
    if "score" in col.lower()
])
# ============================================================
# FINAL M2 BEHAVIOUR SCORE
# ============================================================

data["m2_behavior_score"] = (
    0.20 * data["login_behavior_score"] +
    0.15 * data["transaction_behavior_score"] +
    0.10 * data["device_behavior_score"] +
    0.10 * data["peer_deviation_score"] +
    0.10 * data["event_type_behavior_score"] +
    0.35 * data["sequence_behavior_score"]
)

# Keep score between 0 and 100
data["m2_behavior_score"] = data[
    "m2_behavior_score"
].clip(0, 100)

'''# Keep score between 0 and 100
data["m2_behavior_score"] = (
    data["m2_behavior_score"]
    .clip(lower=0, upper=100)
    .round(2)
)'''


# ============================================================
# M2 RISK LEVEL
# ============================================================

data["m2_behavior_risk_level"] = "LOW"

data.loc[
    data["m2_behavior_score"] >= 20,
    "m2_behavior_risk_level"
] = "LOW-MODERATE"

data.loc[
    data["m2_behavior_score"] >= 40,
    "m2_behavior_risk_level"
] = "MODERATE"

data.loc[
    data["m2_behavior_score"] >= 60,
    "m2_behavior_risk_level"
] = "HIGH"

data.loc[
    data["m2_behavior_score"] >= 80,
    "m2_behavior_risk_level"
] = "CRITICAL"


# ============================================================
# SORT RESULTS
# ============================================================

data = data.sort_values(
    by="m2_behavior_score",
    ascending=False
).reset_index(drop=True)


# ============================================================
# DISPLAY TOP EVENTS
# ============================================================

print()
print()
print("=" * 70)
print("TOP 20 BEHAVIOURAL DEVIATIONS")
print("=" * 70)

display_columns = [
    "event_id",
    "user_id",
    "event_type",
    "login_behavior_score",
    "transaction_behavior_score",
    "session_behavior_score",
    "device_behavior_score",
    "event_type_behavior_score",
    "peer_login_score",
    "peer_event_score",
    "peer_deviation_score",
    "m2_behavior_score",
    "m2_behavior_risk_level"
]

available_columns = [
    column
    for column in display_columns
    if column in data.columns
]

print(
    data[available_columns]
    .head(20)
)


# ============================================================
# RISK DISTRIBUTION
# ============================================================

print()
print()
print("=" * 70)
print("M2 BEHAVIOUR RISK DISTRIBUTION")
print("=" * 70)

print(
    data["m2_behavior_risk_level"]
    .value_counts()
)


# ============================================================
# GROUND TRUTH COMPARISON
# ============================================================

if ground_truth is not None:

    print()
    print()
    print("=" * 70)
    print("GROUND TRUTH VS M2 BEHAVIOUR SCORE")
    print("=" * 70)

    evaluation = data.merge(
        ground_truth,
        on="event_id",
        how="left"
    )

    attack_events = evaluation[
        evaluation["is_attack"] == 1
    ]

    evaluation_columns = [
        "event_id",
        "user_id",
        "event_type",
        "is_attack",
        "scenario_id",
        "expected_risk_raw",
        "expected_risk_final",
        "login_behavior_score",
        "transaction_behavior_score",
        "session_behavior_score",
        "device_behavior_score",
        "event_type_behavior_score",
        "peer_login_score",
        "peer_event_score",
        "peer_deviation_score",
        "m2_behavior_score",
        "m2_behavior_risk_level"
    ]

    available_evaluation_columns = [
        column
        for column in evaluation_columns
        if column in attack_events.columns
    ]

    print(
        attack_events[
            available_evaluation_columns
        ]
        .sort_values(
            "m2_behavior_score",
            ascending=False
        )
    )
# ============================================================
# ATTACK EVENT DETAILED ANALYSIS
# ============================================================

print()
print("=" * 70)
print("DETAILED ANALYSIS OF GROUND TRUTH ATTACK EVENTS")
print("=" * 70)

# Find attack events from ground truth
attack_events = evaluation[
    evaluation["is_attack"] == 1
].copy()

# Columns we want to inspect
columns_to_show = [
    "event_id",
    "user_id",
    "timestamp",
    "event_type",
    "device_id",
    "new_device_flag",
    "resource_id",
    "sensitive_resource_flag",
    "records_accessed",
    "permission_change_flag",
    "new_permission_level",
    "beneficiary_id",
    "new_beneficiary_flag",
    "transaction_amount",
    "exceeds_limit_flag",
    "login_deviation_score",
    "device_behavior_score",
    "peer_deviation_score",
    "m2_behavior_score",
    "m2_behavior_risk_level"
]

# Keep only columns that actually exist
available_columns = [
    col for col in columns_to_show
    if col in attack_events.columns
]

print()
print(attack_events[available_columns].to_string(index=False))

# ============================================================
# SAVE RESULTS
# ============================================================

data.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# COMPLETION
# ============================================================

print()
print()
print("=" * 70)
print("M2 BEHAVIOUR BASELINE ENGINE COMPLETED SUCCESSFULLY")
print("=" * 70)

print()
print("Results saved to:")
print(OUTPUT_FILE)

print()