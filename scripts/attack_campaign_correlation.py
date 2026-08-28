# ============================================================
# M14 ATTACK PATTERN & CAMPAIGN CORRELATION ENGINE
# ============================================================

import os
import pandas as pd


# ============================================================
# PATH SETUP
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

OUTPUT_DIR = os.path.join(BASE_DIR, "output")

M13_FILE = os.path.join(
    OUTPUT_DIR,
    "m13_risk_calibration_results.csv"
)

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "m14_attack_campaign_results.csv"
)


# ============================================================
# START
# ============================================================

print("=" * 70)
print("M14 ATTACK PATTERN & CAMPAIGN CORRELATION ENGINE")
print("=" * 70)


# ============================================================
# LOAD DATA
# ============================================================

if not os.path.exists(M13_FILE):
    raise FileNotFoundError(
        f"M13 results not found:\n{M13_FILE}"
    )

data = pd.read_csv(M13_FILE)

print("\nDATA LOADED SUCCESSFULLY")
print("M13 Results:", data.shape)


# ============================================================
# REQUIRED COLUMNS
# ============================================================

required_columns = [
    "event_id",
    "user_id",
    "event_type",
    "m13_risk_score",
    "m13_risk_level",
    "m13_attack_prediction",
    "m13_detection_confidence",
    "m13_risk_factors"
]

missing_columns = [
    column
    for column in required_columns
    if column not in data.columns
]

if missing_columns:
    raise ValueError(
        f"Missing required M13 columns: {missing_columns}"
    )


# ============================================================
# TIMESTAMP HANDLING
# ============================================================

if "timestamp" in data.columns:

    data["timestamp"] = pd.to_datetime(
        data["timestamp"],
        errors="coerce"
    )

else:

    data["timestamp"] = pd.NaT


# ============================================================
# NUMERIC CLEANUP
# ============================================================

numeric_columns = [
    "m13_risk_score",
    "m13_detection_confidence"
]

for column in numeric_columns:

    data[column] = pd.to_numeric(
        data[column],
        errors="coerce"
    ).fillna(0)


# ============================================================
# SORT CHRONOLOGICALLY
# ============================================================

data = data.sort_values(
    by=["user_id", "timestamp"],
    na_position="last"
).reset_index(drop=True)


# ============================================================
# ATTACK STAGE CLASSIFICATION
# ============================================================

def classify_attack_stage(event_type):

    event_type = str(event_type).lower()

    if event_type == "login":
        return "INITIAL_ACCESS"

    elif event_type in [
        "permission_change",
        "privilege_change",
        "role_change"
    ]:
        return "PRIVILEGE_ESCALATION"

    elif event_type in [
        "file_access",
        "data_access",
        "file_download"
    ]:
        return "DATA_ACCESS"

    elif event_type in [
        "beneficiary_change",
        "account_change"
    ]:
        return "PERSISTENCE"

    elif event_type in [
        "transaction",
        "transfer",
        "payment"
    ]:
        return "IMPACT"

    return "OTHER"


data["m14_attack_stage"] = (
    data["event_type"]
    .apply(classify_attack_stage)
)


# ============================================================
# SUSPICIOUS EVENT FLAG
# ============================================================

data["m14_suspicious_event"] = (
    (
        data["m13_attack_prediction"] == 1
    )
    |
    (
        data["m13_risk_score"] >= 60
    )
).astype(int)


# ============================================================
# CAMPAIGN IDENTIFICATION
# ============================================================

# A campaign is built from suspicious events belonging to
# the same user. Suspicious events separated by more than
# 24 hours start a new campaign.

data["m14_campaign_id"] = "NONE"

campaign_counter = 0

for user_id, group in data.groupby("user_id", sort=False):

    group = group.sort_values(
        "timestamp"
    )

    current_campaign = None
    previous_time = None

    for index, row in group.iterrows():

        suspicious = (
            row["m14_suspicious_event"] == 1
        )

        if not suspicious:

            continue

        current_time = row["timestamp"]

        new_campaign = False

        if current_campaign is None:

            new_campaign = True

        elif pd.isna(current_time) or pd.isna(previous_time):

            new_campaign = False

        else:

            elapsed_hours = (
                current_time - previous_time
            ).total_seconds() / 3600

            if elapsed_hours > 24:

                new_campaign = True

        if new_campaign:

            campaign_counter += 1

            current_campaign = (
                f"CMP{campaign_counter:04d}"
            )

        data.at[
            index,
            "m14_campaign_id"
        ] = current_campaign

        if not pd.isna(current_time):

            previous_time = current_time


# ============================================================
# CAMPAIGN STATISTICS
# ============================================================

campaign_data = data[
    data["m14_campaign_id"] != "NONE"
].copy()


campaign_stats = (
    campaign_data
    .groupby("m14_campaign_id")
    .agg(
        campaign_event_count=(
            "event_id",
            "count"
        ),

        campaign_users=(
            "user_id",
            "nunique"
        ),

        campaign_max_risk=(
            "m13_risk_score",
            "max"
        ),

        campaign_average_risk=(
            "m13_risk_score",
            "mean"
        ),

        campaign_stages=(
            "m14_attack_stage",
            lambda x: " → ".join(
                dict.fromkeys(x)
            )
        )
    )
    .reset_index()
)


# ============================================================
# CAMPAIGN DURATION
# ============================================================

if len(campaign_data) > 0:

    duration_data = (
        campaign_data
        .groupby("m14_campaign_id")
        ["timestamp"]
        .agg(
            campaign_start="min",
            campaign_end="max"
        )
        .reset_index()
    )

    duration_data[
        "campaign_duration_minutes"
    ] = (
        duration_data["campaign_end"]
        - duration_data["campaign_start"]
    ).dt.total_seconds() / 60

    campaign_stats = campaign_stats.merge(
        duration_data[
            [
                "m14_campaign_id",
                "campaign_start",
                "campaign_end",
                "campaign_duration_minutes"
            ]
        ],
        on="m14_campaign_id",
        how="left"
    )

else:

    campaign_stats[
        "campaign_duration_minutes"
    ] = 0


# ============================================================
# CAMPAIGN PROGRESSION SCORE
# ============================================================

stage_order = {
    "INITIAL_ACCESS": 1,
    "PRIVILEGE_ESCALATION": 2,
    "DATA_ACCESS": 3,
    "PERSISTENCE": 4,
    "IMPACT": 5,
    "OTHER": 0
}


def calculate_progression(stages):

    stage_values = [
        stage_order.get(stage, 0)
        for stage in stages.split(" → ")
    ]

    if len(stage_values) <= 1:
        return 0.0

    progression = 0

    for i in range(
        1,
        len(stage_values)
    ):

        if stage_values[i] > stage_values[i - 1]:

            progression += 1

    return min(
        progression / 4,
        1
    ) * 100


campaign_stats[
    "campaign_progression_score"
] = (
    campaign_stats[
        "campaign_stages"
    ]
    .apply(calculate_progression)
)


# ============================================================
# CAMPAIGN RISK SCORE
# ============================================================

campaign_stats[
    "campaign_risk_score"
] = (
    0.50 *
    campaign_stats[
        "campaign_max_risk"
    ]
    +
    0.25 *
    campaign_stats[
        "campaign_average_risk"
    ]
    +
    0.25 *
    campaign_stats[
        "campaign_progression_score"
    ]
).clip(0, 100).round(2)


# ============================================================
# CAMPAIGN LEVEL
# ============================================================

def campaign_level(score):

    if score >= 80:
        return "CRITICAL"

    elif score >= 60:
        return "HIGH"

    elif score >= 40:
        return "MEDIUM"

    return "LOW"


campaign_stats[
    "campaign_risk_level"
] = (
    campaign_stats[
        "campaign_risk_score"
    ]
    .apply(campaign_level)
)


# ============================================================
# CAMPAIGN CONFIDENCE
# ============================================================

campaign_stats[
    "campaign_confidence"
] = (
    campaign_stats[
        "campaign_max_risk"
    ] * 0.6
    +
    campaign_stats[
        "campaign_progression_score"
    ] * 0.4
).clip(0, 100).round(2)


# ============================================================
# MERGE CAMPAIGN INFORMATION
# ============================================================

data = data.merge(
    campaign_stats[
        [
            "m14_campaign_id",
            "campaign_event_count",
            "campaign_users",
            "campaign_max_risk",
            "campaign_average_risk",
            "campaign_stages",
            "campaign_start",
            "campaign_end",
            "campaign_duration_minutes",
            "campaign_progression_score",
            "campaign_risk_score",
            "campaign_risk_level",
            "campaign_confidence"
        ]
    ],
    on="m14_campaign_id",
    how="left"
)


# ============================================================
# FILL NON-CAMPAIGN EVENTS
# ============================================================

fill_zero_columns = [
    "campaign_event_count",
    "campaign_users",
    "campaign_max_risk",
    "campaign_average_risk",
    "campaign_duration_minutes",
    "campaign_progression_score",
    "campaign_risk_score",
    "campaign_confidence"
]

for column in fill_zero_columns:

    data[column] = (
        pd.to_numeric(
            data[column],
            errors="coerce"
        )
        .fillna(0)
    )


data["campaign_stages"] = (
    data["campaign_stages"]
    .fillna("NONE")
)

data["campaign_risk_level"] = (
    data["campaign_risk_level"]
    .fillna("LOW")
)


# ============================================================
# ATTACK CHAIN DETECTION
# ============================================================

def detect_attack_chain(row):

    stages = str(
        row["campaign_stages"]
    )

    required_chain = [
        "INITIAL_ACCESS",
        "PRIVILEGE_ESCALATION",
        "DATA_ACCESS",
        "IMPACT"
    ]

    matched = sum(
        stage in stages
        for stage in required_chain
    )

    return int(matched >= 3)


data["attack_chain_detected"] = data.apply(
    detect_attack_chain,
    axis=1
)


# ============================================================
# CAMPAIGN SEVERITY BOOST
# ============================================================

def calculate_final_campaign_score(row):

    score = row["m13_risk_score"]

    if row["attack_chain_detected"] == 1:

        score += 10

    elif row["campaign_event_count"] >= 3:

        score += 5

    return min(
        score,
        100
    )


data["m14_final_risk_score"] = data.apply(
    calculate_final_campaign_score,
    axis=1
).round(2)


# ============================================================
# FINAL M14 RISK LEVEL
# ============================================================

data["m14_final_risk_level"] = (
    data["m14_final_risk_score"]
    .apply(campaign_level)
)


# ============================================================
# CAMPAIGN EXPLANATION
# ============================================================

def campaign_explanation(row):

    if row["attack_chain_detected"] == 1:

        return (
            "MULTI-STAGE ATTACK CHAIN DETECTED: "
            + str(row["campaign_stages"])
        )

    if row["campaign_event_count"] >= 3:

        return (
            "MULTIPLE SUSPICIOUS EVENTS "
            "CORRELATED INTO ONE CAMPAIGN"
        )

    if row["m14_suspicious_event"] == 1:

        return (
            "SUSPICIOUS EVENT ASSOCIATED "
            "WITH AN ATTACK CAMPAIGN"
        )

    return "NO ATTACK CAMPAIGN DETECTED"


data["m14_campaign_explanation"] = data.apply(
    campaign_explanation,
    axis=1
)


# ============================================================
# RECOMMENDED ACTION
# ============================================================

def recommended_action(row):

    if row["m14_final_risk_level"] == "CRITICAL":

        return (
            "IMMEDIATE INVESTIGATION, "
            "CONTAINMENT AND INCIDENT RESPONSE"
        )

    elif row["m14_final_risk_level"] == "HIGH":

        return (
            "HIGH PRIORITY SECURITY INVESTIGATION"
        )

    elif row["m14_final_risk_level"] == "MEDIUM":

        return (
            "SECURITY REVIEW AND MONITORING"
        )

    return "CONTINUE MONITORING"


data["m14_recommended_action"] = data.apply(
    recommended_action,
    axis=1
)


# ============================================================
# OUTPUT COLUMNS
# ============================================================

output_columns = [
    "event_id",
    "user_id",
    "timestamp",
    "event_type",

    "m13_risk_score",
    "m13_risk_level",
    "m13_attack_prediction",
    "m13_detection_confidence",

    "m14_attack_stage",
    "m14_suspicious_event",

    "m14_campaign_id",
    "campaign_event_count",
    "campaign_users",
    "campaign_stages",
    "campaign_duration_minutes",

    "campaign_progression_score",
    "campaign_risk_score",
    "campaign_risk_level",
    "campaign_confidence",

    "attack_chain_detected",

    "m14_final_risk_score",
    "m14_final_risk_level",

    "m14_campaign_explanation",
    "m14_recommended_action"
]

output_columns = [
    column
    for column in output_columns
    if column in data.columns
]

m14_results = data[
    output_columns
].copy()


# ============================================================
# SORT BY FINAL RISK
# ============================================================

m14_results = m14_results.sort_values(
    by="m14_final_risk_score",
    ascending=False
).reset_index(drop=True)


# ============================================================
# TOP 20
# ============================================================

print("\n" + "=" * 70)
print("TOP 20 M14 ATTACK CAMPAIGN DETECTIONS")
print("=" * 70)

print(
    m14_results[
        [
            "event_id",
            "user_id",
            "event_type",
            "m14_attack_stage",
            "m14_campaign_id",
            "campaign_stages",
            "m14_final_risk_score",
            "m14_final_risk_level",
            "attack_chain_detected"
        ]
    ]
    .head(20)
    .to_string(index=False)
)


# ============================================================
# CAMPAIGN SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("M14 CAMPAIGN SUMMARY")
print("=" * 70)

print(
    "Total Events              :",
    len(m14_results)
)

print(
    "Suspicious Events         :",
    int(
        m14_results[
            "m14_suspicious_event"
        ].sum()
    )
)

print(
    "Campaigns Detected        :",
    int(
        m14_results[
            "m14_campaign_id"
        ]
        .replace("NONE", pd.NA)
        .dropna()
        .nunique()
    )
)

print(
    "Attack Chain Events       :",
    int(
        m14_results[
            "attack_chain_detected"
        ].sum()
    )
)

print(
    "Critical Events           :",
    int(
        (
            m14_results[
                "m14_final_risk_level"
            ] == "CRITICAL"
        ).sum()
    )
)

print(
    "High Events               :",
    int(
        (
            m14_results[
                "m14_final_risk_level"
            ] == "HIGH"
        ).sum()
    )
)


# ============================================================
# CAMPAIGN TABLE
# ============================================================

if len(campaign_stats) > 0:

    print("\n" + "=" * 70)
    print("DETECTED ATTACK CAMPAIGNS")
    print("=" * 70)

    print(
        campaign_stats[
            [
                "m14_campaign_id",
                "campaign_event_count",
                "campaign_users",
                "campaign_stages",
                "campaign_progression_score",
                "campaign_risk_score",
                "campaign_risk_level",
                "campaign_confidence"
            ]
        ]
        .sort_values(
            "campaign_risk_score",
            ascending=False
        )
        .to_string(index=False)
    )


# ============================================================
# SAVE
# ============================================================

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

m14_results.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# COMPLETION
# ============================================================

print("\n" + "=" * 70)
print("M14 ATTACK PATTERN & CAMPAIGN CORRELATION COMPLETED")
print("=" * 70)

print("\nResults saved to:")
print(OUTPUT_FILE)