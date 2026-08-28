# ============================================================
# M12 ENHANCED MULTI-MODEL RISK FUSION ENGINE
# ============================================================

import os
import sys
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

OUTPUT_DIR = os.path.join(BASE_DIR, "output")


# M11 Enhanced Random Forest
ML_FILE = os.path.join(
    OUTPUT_DIR,
    "ml_results.csv"
)

# M8 Isolation Forest
ISOLATION_FOREST_FILE = os.path.join(
    OUTPUT_DIR,
    "isolation_forest_results.csv"
)

# M10 Enhanced Features
ENHANCED_FEATURE_FILE = os.path.join(
    OUTPUT_DIR,
    "enhanced_behavior_features.csv"
)

# Output
OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "m12_risk_fusion_results.csv"
)


# ============================================================
# START
# ============================================================

print("\n" + "=" * 70)
print("M12 ENHANCED MULTI-MODEL RISK FUSION ENGINE")
print("=" * 70)


# ============================================================
# CHECK FILES
# ============================================================

required_files = {
    "M11 Random Forest": ML_FILE,
    "M8 Isolation Forest": ISOLATION_FOREST_FILE,
    "M10 Enhanced Features": ENHANCED_FEATURE_FILE
}

for name, path in required_files.items():

    if not os.path.exists(path):

        print(f"\nERROR: {name} file not found:")
        print(path)

        sys.exit(1)


# ============================================================
# LOAD DATA
# ============================================================

ml_data = pd.read_csv(ML_FILE)

isolation_data = pd.read_csv(
    ISOLATION_FOREST_FILE
)

enhanced_data = pd.read_csv(
    ENHANCED_FEATURE_FILE
)


print("\nDATA LOADED SUCCESSFULLY")

print(
    "M11 Random Forest Results:",
    ml_data.shape
)

print(
    "M8 Isolation Forest Results:",
    isolation_data.shape
)

print(
    "M10 Enhanced Features:",
    enhanced_data.shape
)


# ============================================================
# REQUIRED COLUMNS
# ============================================================

required_ml_columns = [

    "event_id",
    "user_id",
    "event_type",
    "m2_behavior_score",
    "ml_attack_probability",
    "ml_attack_prediction"
]


required_isolation_columns = [

    "event_id",
    "isolation_risk_score",
    "isolation_forest_prediction"
]


required_enhanced_columns = [

    "event_id",

    "off_hours_flag",
    "weekend_activity_flag",

    "user_events_last_5min",
    "user_events_last_15min",
    "user_events_last_30min",

    "event_velocity_score",

    "transaction_ratio_to_user_average",
    "transaction_spike_score",

    "new_device_off_hours_flag",
    "attack_stage_score",
    "sequence_progression_score",
    "contextual_risk_score"
]


# ============================================================
# VALIDATE COLUMNS
# ============================================================

missing_ml = [

    column
    for column in required_ml_columns
    if column not in ml_data.columns

]

missing_isolation = [

    column
    for column in required_isolation_columns
    if column not in isolation_data.columns

]

missing_enhanced = [

    column
    for column in required_enhanced_columns
    if column not in enhanced_data.columns

]


if missing_ml:

    raise ValueError(
        f"Missing M11 columns: {missing_ml}"
    )


if missing_isolation:

    raise ValueError(
        f"Missing M8 columns: {missing_isolation}"
    )


if missing_enhanced:

    raise ValueError(
        f"Missing M10 columns: {missing_enhanced}"
    )


# ============================================================
# SELECT COLUMNS
# ============================================================

ml_data = ml_data[
    required_ml_columns
].copy()


isolation_data = isolation_data[
    required_isolation_columns
].copy()


enhanced_data = enhanced_data[
    required_enhanced_columns
].copy()


# ============================================================
# REMOVE DUPLICATES
# ============================================================

ml_data = ml_data.drop_duplicates(
    subset=["event_id"]
)

isolation_data = isolation_data.drop_duplicates(
    subset=["event_id"]
)

enhanced_data = enhanced_data.drop_duplicates(
    subset=["event_id"]
)


# ============================================================
# MERGE M11 + M8
# ============================================================

data = ml_data.merge(

    isolation_data,

    on="event_id",

    how="left"

)


# ============================================================
# MERGE M10 FEATURES
# ============================================================

data = data.merge(

    enhanced_data,

    on="event_id",

    how="left"

)


print("\n" + "=" * 70)
print("M12 MERGED DATA")
print("=" * 70)

print(
    "Merged Shape:",
    data.shape
)


# ============================================================
# NUMERIC CONVERSION
# ============================================================

numeric_columns = [

    "m2_behavior_score",

    "ml_attack_probability",

    "isolation_risk_score",

    "off_hours_flag",
    "weekend_activity_flag",

    "user_events_last_5min",
    "user_events_last_15min",
    "user_events_last_30min",

    "event_velocity_score",

    "transaction_ratio_to_user_average",
    "transaction_spike_score",

    "new_device_off_hours_flag",

    "attack_stage_score",
    "sequence_progression_score",
    "contextual_risk_score"

]


for column in numeric_columns:

    if column in data.columns:

        data[column] = pd.to_numeric(
            data[column],
            errors="coerce"
        ).fillna(0)


# ============================================================
# NORMALIZE M2
# ============================================================

data["m2_risk_normalized"] = (

    data["m2_behavior_score"] / 100

).clip(0, 1)


# ============================================================
# NORMALIZE M11 RANDOM FOREST
# ============================================================

ml_probability = data[
    "ml_attack_probability"
]


if ml_probability.max() > 1:

    data["ml_risk_normalized"] = (

        ml_probability / 100

    ).clip(0, 1)

else:

    data["ml_risk_normalized"] = (

        ml_probability

    ).clip(0, 1)


# ============================================================
# NORMALIZE M8 ISOLATION FOREST
# ============================================================

data["isolation_risk_normalized"] = (

    data["isolation_risk_score"] / 100

).clip(0, 1)


# ============================================================
# NORMALIZE M10 CONTEXTUAL RISK
# ============================================================

data["contextual_risk_normalized"] = (

    data["contextual_risk_score"] / 100

).clip(0, 1)


# ============================================================
# NORMALIZE SEQUENCE PROGRESSION
# ============================================================

data["sequence_risk_normalized"] = (

    data["sequence_progression_score"] / 100

).clip(0, 1)


# ============================================================
# NORMALIZE ATTACK STAGE
# ============================================================

data["attack_stage_normalized"] = (

    data["attack_stage_score"] / 20

).clip(0, 1)


# ============================================================
# M12 ENHANCED FUSION
# ============================================================

print("\n" + "=" * 70)
print("M12 ENHANCED MULTI-MODEL FUSION")
print("=" * 70)

print("""
Risk Components:

M2 Behaviour Risk          : 30%
M11 Random Forest Risk     : 35%
M8 Isolation Forest Risk   : 15%
Contextual Risk            : 10%
Sequence Progression Risk  : 10%
""")


data["m12_risk_score"] = (

    0.30 * data["m2_risk_normalized"]

    +

    0.35 * data["ml_risk_normalized"]

    +

    0.15 * data["isolation_risk_normalized"]

    +

    0.10 * data["contextual_risk_normalized"]

    +

    0.10 * data["sequence_risk_normalized"]

) * 100


data["m12_risk_score"] = (

    data["m12_risk_score"]

    .clip(0, 100)

    .round(2)

)


# ============================================================
# MODEL DETECTION
# ============================================================

data["m12_attack_prediction"] = (

    (

        (data["ml_attack_prediction"] == 1)

        |

        (data["isolation_forest_prediction"] == 1)

    )

).astype(int)


# ============================================================
# MODEL AGREEMENT
# ============================================================

def get_model_agreement(row):

    rf = int(
        row["ml_attack_prediction"] == 1
    )

    isolation = int(
        row["isolation_forest_prediction"] == 1
    )

    if rf and isolation:

        return "BOTH MODELS"

    elif rf:

        return "RANDOM FOREST ONLY"

    elif isolation:

        return "ISOLATION FOREST ONLY"

    return "NO MODEL DETECTION"


data["model_agreement"] = data.apply(
    get_model_agreement,
    axis=1
)


# ============================================================
# RISK LEVEL
# ============================================================

def calculate_risk_level(score):

    if score >= 80:

        return "CRITICAL"

    elif score >= 60:

        return "HIGH"

    elif score >= 40:

        return "MEDIUM"

    elif score >= 20:

        return "LOW-MODERATE"

    else:

        return "LOW"


data["m12_risk_level"] = (

    data["m12_risk_score"]

    .apply(calculate_risk_level)

)


# ============================================================
# CONTEXTUAL SIGNALS
# ============================================================

data["contextual_signal_count"] = (

    (

        data["off_hours_flag"] == 1

    ).astype(int)

    +

    (

        data["weekend_activity_flag"] == 1

    ).astype(int)

    +

    (

        data["new_device_off_hours_flag"] == 1

    ).astype(int)

    +

    (

        data["transaction_spike_score"] > 10

    ).astype(int)

    +

    (

        data["attack_stage_score"] > 0

    ).astype(int)

    +

    (

        data["sequence_progression_score"] > 0

    ).astype(int)

)


# ============================================================
# SECURITY ALERT
# ============================================================

def generate_alert(row):

    if row["m12_risk_level"] == "CRITICAL":

        return "IMMEDIATE INVESTIGATION REQUIRED"

    elif row["m12_risk_level"] == "HIGH":

        return "HIGH PRIORITY SECURITY ALERT"

    elif row["m12_risk_level"] == "MEDIUM":

        return "SECURITY REVIEW RECOMMENDED"

    elif row["m12_risk_level"] == "LOW-MODERATE":

        return "MONITOR USER ACTIVITY"

    return "NO IMMEDIATE ACTION"


data["m12_security_alert"] = data.apply(
    generate_alert,
    axis=1
)


# ============================================================
# EXPLANATION
# ============================================================

def generate_explanation(row):

    reasons = []

    if row["m2_behavior_score"] >= 30:

        reasons.append(
            "High behavioural deviation"
        )

    if row["ml_attack_prediction"] == 1:

        reasons.append(
            "Random Forest detection"
        )

    if row["isolation_forest_prediction"] == 1:

        reasons.append(
            "Isolation Forest anomaly"
        )

    if row["contextual_risk_score"] >= 15:

        reasons.append(
            "Elevated contextual risk"
        )

    if row["sequence_progression_score"] >= 20:

        reasons.append(
            "Suspicious sequence progression"
        )

    if row["attack_stage_score"] > 0:

        reasons.append(
            "Attack-stage activity detected"
        )

    if row["off_hours_flag"] == 1:

        reasons.append(
            "Off-hours activity"
        )

    if row["weekend_activity_flag"] == 1:

        reasons.append(
            "Weekend activity"
        )

    if not reasons:

        return "No significant security indicators"

    return "; ".join(reasons)


data["m12_detection_explanation"] = data.apply(
    generate_explanation,
    axis=1
)


# ============================================================
# OUTPUT COLUMNS
# ============================================================

output_columns = [

    "event_id",
    "user_id",
    "event_type",

    "m2_behavior_score",

    "ml_attack_probability",
    "ml_attack_prediction",

    "isolation_risk_score",
    "isolation_forest_prediction",

    "off_hours_flag",
    "weekend_activity_flag",

    "event_velocity_score",

    "transaction_ratio_to_user_average",
    "transaction_spike_score",

    "attack_stage_score",
    "sequence_progression_score",
    "contextual_risk_score",

    "m2_risk_normalized",
    "ml_risk_normalized",
    "isolation_risk_normalized",

    "contextual_risk_normalized",
    "sequence_risk_normalized",
    "attack_stage_normalized",

    "contextual_signal_count",

    "m12_risk_score",
    "m12_risk_level",

    "m12_attack_prediction",

    "model_agreement",

    "m12_security_alert",

    "m12_detection_explanation"

]


output_columns = [

    column

    for column in output_columns

    if column in data.columns

]


m12_results = data[
    output_columns
].copy()


# ============================================================
# SORT BY RISK
# ============================================================

m12_results = m12_results.sort_values(

    by="m12_risk_score",

    ascending=False

).reset_index(
    drop=True
)


# ============================================================
# TOP 20
# ============================================================

print("\n" + "=" * 70)
print("TOP 20 M12 SECURITY DETECTIONS")
print("=" * 70)

print(

    m12_results[

        [

            "event_id",
            "user_id",
            "event_type",

            "m2_behavior_score",

            "ml_attack_probability",

            "isolation_risk_score",

            "contextual_risk_score",

            "sequence_progression_score",

            "m12_risk_score",

            "m12_risk_level",

            "model_agreement"

        ]

    ]

    .head(20)

    .to_string(index=False)

)


# ============================================================
# RISK DISTRIBUTION
# ============================================================

print("\n" + "=" * 70)
print("M12 RISK DISTRIBUTION")
print("=" * 70)

print(
    m12_results[
        "m12_risk_level"
    ].value_counts()
)


# ============================================================
# MODEL AGREEMENT
# ============================================================

print("\n" + "=" * 70)
print("M12 MODEL AGREEMENT")
print("=" * 70)

print(
    m12_results[
        "model_agreement"
    ].value_counts()
)


# ============================================================
# DETECTION SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("M12 DETECTION SUMMARY")
print("=" * 70)

total_events = len(m12_results)

rf_detections = int(
    m12_results[
        "ml_attack_prediction"
    ].sum()
)

isolation_detections = int(
    m12_results[
        "isolation_forest_prediction"
    ].sum()
)

combined_detections = int(
    m12_results[
        "m12_attack_prediction"
    ].sum()
)

critical_events = int(

    (

        m12_results[
            "m12_risk_level"
        ]

        == "CRITICAL"

    ).sum()

)

high_events = int(

    (

        m12_results[
            "m12_risk_level"
        ]

        == "HIGH"

    ).sum()

)

medium_events = int(

    (

        m12_results[
            "m12_risk_level"
        ]

        == "MEDIUM"

    ).sum()

)


print(
    f"Total Events Processed     : {total_events}"
)

print(
    f"Random Forest Detections   : {rf_detections}"
)

print(
    f"Isolation Forest Anomalies : {isolation_detections}"
)

print(
    f"M12 Combined Detections    : {combined_detections}"
)

print(
    f"Critical Risk Events       : {critical_events}"
)

print(
    f"High Risk Events           : {high_events}"
)

print(
    f"Medium Risk Events         : {medium_events}"
)


# ============================================================
# SAVE
# ============================================================

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


m12_results.to_csv(

    OUTPUT_FILE,

    index=False

)


# ============================================================
# COMPLETE
# ============================================================

print("\n" + "=" * 70)
print("M12 ENHANCED MULTI-MODEL RISK FUSION COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nResults saved to:")

print(
    OUTPUT_FILE
)

print()