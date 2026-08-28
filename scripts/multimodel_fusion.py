# ============================================================
# M9 MULTI-MODEL RISK FUSION ENGINE
# ============================================================

import os
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

FINAL_DETECTION_FILE = os.path.join(
    OUTPUT_DIR,
    "final_detection_results.csv"
)

ISOLATION_FOREST_FILE = os.path.join(
    OUTPUT_DIR,
    "isolation_forest_results.csv"
)

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "m9_risk_fusion_results.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("M9 MULTI-MODEL RISK FUSION ENGINE")
print("=" * 70)

final_data = pd.read_csv(FINAL_DETECTION_FILE)
isolation_data = pd.read_csv(ISOLATION_FOREST_FILE)

print("\nDATA LOADED SUCCESSFULLY")
print("M5 Final Detection Results:", final_data.shape)
print("M8 Isolation Forest Results:", isolation_data.shape)


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_m5_columns = [
    "event_id",
    "user_id",
    "event_type",
    "m2_behavior_score",
    "ml_attack_probability",
    "ml_attack_prediction"
]

required_m8_columns = [
    "event_id",
    "isolation_risk_score",
    "isolation_forest_prediction"
]

missing_m5 = [
    col for col in required_m5_columns
    if col not in final_data.columns
]

missing_m8 = [
    col for col in required_m8_columns
    if col not in isolation_data.columns
]

if missing_m5:
    raise ValueError(
        f"Missing M5 columns: {missing_m5}"
    )

if missing_m8:
    raise ValueError(
        f"Missing M8 columns: {missing_m8}"
    )


# ============================================================
# SELECT M8 COLUMNS
# ============================================================

isolation_data = isolation_data[
    required_m8_columns
].copy()


# ============================================================
# REMOVE DUPLICATE EVENT IDS
# ============================================================

isolation_data = isolation_data.drop_duplicates(
    subset=["event_id"]
)


# ============================================================
# MERGE M5 + M8
# ============================================================

data = final_data.merge(
    isolation_data,
    on="event_id",
    how="left"
)

print("\nMERGED M9 DATA")
print(data.shape)


# ============================================================
# HANDLE MISSING VALUES
# ============================================================

data["m2_behavior_score"] = pd.to_numeric(
    data["m2_behavior_score"],
    errors="coerce"
).fillna(0)

data["ml_attack_probability"] = pd.to_numeric(
    data["ml_attack_probability"],
    errors="coerce"
).fillna(0)

data["isolation_risk_score"] = pd.to_numeric(
    data["isolation_risk_score"],
    errors="coerce"
).fillna(0)


# ============================================================
# NORMALIZE M2 BEHAVIOUR SCORE
# ============================================================

data["m2_risk_normalized"] = (
    data["m2_behavior_score"] / 100
).clip(0, 1)


# ============================================================
# NORMALIZE RANDOM FOREST PROBABILITY
# ============================================================

ml_probability = data["ml_attack_probability"]

# Handles both 0-1 and 0-100 formats
if ml_probability.max() > 1:
    data["ml_risk_normalized"] = (
        ml_probability / 100
    ).clip(0, 1)
else:
    data["ml_risk_normalized"] = (
        ml_probability
    ).clip(0, 1)


# ============================================================
# NORMALIZE ISOLATION FOREST RISK
# ============================================================

data["isolation_risk_normalized"] = (
    data["isolation_risk_score"] / 100
).clip(0, 1)


# ============================================================
# M9 MULTI-MODEL FUSION
# ============================================================

print("\n" + "=" * 70)
print("M9 MULTI-MODEL RISK FUSION")
print("=" * 70)

print("""
Model Weights:
M2 Behaviour Risk       : 40%
M3 Random Forest Risk   : 40%
M8 Isolation Forest Risk: 20%
""")


data["m9_risk_score"] = (
    0.40 * data["m2_risk_normalized"] +
    0.40 * data["ml_risk_normalized"] +
    0.20 * data["isolation_risk_normalized"]
) * 100


data["m9_risk_score"] = data[
    "m9_risk_score"
].round(2)


# ============================================================
# MULTI-MODEL DETECTION
# ============================================================

data["m9_attack_prediction"] = (
    (
        (data["ml_attack_prediction"] == 1) |
        (data["isolation_forest_prediction"] == 1)
    )
).astype(int)


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
    else:
        return "LOW"


data["m9_risk_level"] = data[
    "m9_risk_score"
].apply(calculate_risk_level)


# ============================================================
# SECURITY ALERT
# ============================================================

def generate_alert(row):

    if row["m9_risk_level"] == "CRITICAL":
        return "IMMEDIATE INVESTIGATION REQUIRED"

    elif row["m9_risk_level"] == "HIGH":
        return "HIGH PRIORITY SECURITY ALERT"

    elif row["m9_risk_level"] == "MEDIUM":
        return "SECURITY REVIEW RECOMMENDED"

    return "NO IMMEDIATE ACTION"


data["m9_security_alert"] = data.apply(
    generate_alert,
    axis=1
)


# ============================================================
# MODEL AGREEMENT
# ============================================================

def model_agreement(row):

    signals = [
        int(row["ml_attack_prediction"] == 1),
        int(row["isolation_forest_prediction"] == 1)
    ]

    if signals[0] == 1 and signals[1] == 1:
        return "BOTH MODELS"

    elif signals[0] == 1:
        return "RANDOM FOREST ONLY"

    elif signals[1] == 1:
        return "ISOLATION FOREST ONLY"

    return "NO MODEL DETECTION"


data["model_agreement"] = data.apply(
    model_agreement,
    axis=1
)


# ============================================================
# FINAL OUTPUT COLUMNS
# ============================================================

output_columns = [
    "event_id",
    "user_id",
    "timestamp",
    "event_type",

    "m2_behavior_score",
    "ml_attack_probability",
    "ml_attack_prediction",
    "isolation_risk_score",
    "isolation_forest_prediction",

    "m2_risk_normalized",
    "ml_risk_normalized",
    "isolation_risk_normalized",

    "m9_risk_score",
    "m9_risk_level",
    "m9_attack_prediction",
    "model_agreement",
    "m9_security_alert"
]


# Keep only columns that exist
output_columns = [
    col for col in output_columns
    if col in data.columns
]

m9_results = data[output_columns].copy()


# ============================================================
# SORT BY RISK
# ============================================================

m9_results = m9_results.sort_values(
    by="m9_risk_score",
    ascending=False
).reset_index(drop=True)


# ============================================================
# TOP 20 DETECTIONS
# ============================================================

print("\n" + "=" * 70)
print("TOP 20 M9 MULTI-MODEL SECURITY DETECTIONS")
print("=" * 70)

print(
    m9_results[
        [
            "event_id",
            "user_id",
            "event_type",
            "m2_behavior_score",
            "ml_attack_probability",
            "isolation_risk_score",
            "m9_risk_score",
            "m9_risk_level",
            "model_agreement"
        ]
    ].head(20).to_string(index=False)
)


# ============================================================
# RISK DISTRIBUTION
# ============================================================

print("\n" + "=" * 70)
print("M9 RISK DISTRIBUTION")
print("=" * 70)

print(
    m9_results["m9_risk_level"].value_counts()
)


# ============================================================
# MODEL AGREEMENT DISTRIBUTION
# ============================================================

print("\n" + "=" * 70)
print("MODEL AGREEMENT")
print("=" * 70)

print(
    m9_results["model_agreement"].value_counts()
)


# ============================================================
# ATTACK DETECTION SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("M9 DETECTION SUMMARY")
print("=" * 70)

print(
    f"Total Events Processed : {len(m9_results)}"
)

print(
    "Random Forest Detections :",
    int(
        m9_results[
            "ml_attack_prediction"
        ].sum()
    )
)

print(
    "Isolation Forest Anomalies :",
    int(
        m9_results[
            "isolation_forest_prediction"
        ].sum()
    )
)

print(
    "M9 Combined Detections :",
    int(
        m9_results[
            "m9_attack_prediction"
        ].sum()
    )
)

print(
    "Critical Risk Events :",
    int(
        (
            m9_results["m9_risk_level"]
            == "CRITICAL"
        ).sum()
    )
)

print(
    "High Risk Events :",
    int(
        (
            m9_results["m9_risk_level"]
            == "HIGH"
        ).sum()
    )
)

print(
    "Medium Risk Events :",
    int(
        (
            m9_results["m9_risk_level"]
            == "MEDIUM"
        ).sum()
    )
)


# ============================================================
# SAVE RESULTS
# ============================================================

m9_results.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# COMPLETION
# ============================================================

print("\n" + "=" * 70)
print("M9 MULTI-MODEL RISK FUSION COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nResults saved to:")
print(OUTPUT_FILE)