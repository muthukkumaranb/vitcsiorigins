import pandas as pd
import numpy as np
from pathlib import Path


print("\n" + "=" * 70)
print("M5 FINAL DETECTION & RISK FUSION ENGINE")
print("=" * 70)


# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

OUTPUT_DIR = BASE_DIR / "output"

ML_RESULTS_PATH = OUTPUT_DIR / "ml_results.csv"
BEHAVIOR_RESULTS_PATH = OUTPUT_DIR / "behavior_baseline_results.csv"

FINAL_RESULTS_PATH = OUTPUT_DIR / "final_detection_results.csv"


# ============================================================
# LOAD DATA
# ============================================================

try:
    ml_data = pd.read_csv(ML_RESULTS_PATH)
    behavior_data = pd.read_csv(BEHAVIOR_RESULTS_PATH)

    print("\nDATA LOADED SUCCESSFULLY")
    print(f"ML Results: {ml_data.shape}")
    print(f"Behaviour Results: {behavior_data.shape}")

except FileNotFoundError as e:
    print("\nERROR: Required input file not found.")
    print(e)
    exit()


# ============================================================
# SELECT REQUIRED COLUMNS
# ============================================================

behavior_columns = [
    "event_id",
    "m2_behavior_score",
    "m2_behavior_risk_level"
]

missing_columns = [
    col for col in behavior_columns
    if col not in behavior_data.columns
]

if missing_columns:
    print("\nERROR: Missing columns in behaviour results:")
    print(missing_columns)
    exit()


behavior_subset = behavior_data[behavior_columns].copy()


# ============================================================
# MERGE M2 + M3 RESULTS
# ============================================================

# Remove duplicate M2 columns from ML results if present
for column in [
    "m2_behavior_score",
    "m2_behavior_risk_level"
]:
    if column in ml_data.columns:
        ml_data = ml_data.drop(columns=[column])


data = ml_data.merge(
    behavior_subset,
    on="event_id",
    how="left"
)

print("\nMERGED FINAL DATA")
print(data.shape)


# ============================================================
# CHECK REQUIRED ML COLUMNS
# ============================================================

required_columns = [
    "event_id",
    "m2_behavior_score",
    "ml_attack_prediction",
    "ml_attack_probability"
]

missing_columns = [
    col for col in required_columns
    if col not in data.columns
]

if missing_columns:
    print("\nERROR: Required columns missing:")
    print(missing_columns)
    exit()







# ============================================================
# NORMALIZE BEHAVIOUR SCORE
# ============================================================

data["behavior_risk_normalized"] = (
    pd.to_numeric(
        data["m2_behavior_score"],
        errors="coerce"
    ).fillna(0) / 100
).clip(0, 1)


# ============================================================
# NORMALIZE ML PROBABILITY
# Automatically handles both 0-1 and 0-100 formats
# ============================================================

ml_probability = pd.to_numeric(
    data["ml_attack_probability"],
    errors="coerce"
).fillna(0)

if ml_probability.max() > 1:
    data["ml_risk_normalized"] = (
        ml_probability / 100
    ).clip(0, 1)
else:
    data["ml_risk_normalized"] = (
        ml_probability
    ).clip(0, 1)

# ============================================================
# FINAL RISK FUSION
#
# 40% Behaviour Baseline
# 60% Machine Learning
# ============================================================

data["final_risk_score"] = (
    0.40 * data["behavior_risk_normalized"] +
    0.60 * data["ml_risk_normalized"]
) * 100


data["final_risk_score"] = (
    data["final_risk_score"]
    .round(2)
)


# ============================================================
# FORCE ATTACK EVENTS TO HIGHER PRIORITY
# ============================================================

data.loc[
    data["ml_attack_prediction"] == 1,
    "final_risk_score"
] = data.loc[
    data["ml_attack_prediction"] == 1,
    "final_risk_score"
].clip(lower=70)


# ============================================================
# FINAL RISK LEVEL
# ============================================================

def determine_risk_level(score):

    if score >= 80:
        return "CRITICAL"

    elif score >= 60:
        return "HIGH"

    elif score >= 30:
        return "MEDIUM"

    else:
        return "LOW"


data["final_risk_level"] = (
    data["final_risk_score"]
    .apply(determine_risk_level)
)


# ============================================================
# ALERT GENERATION
# ============================================================

def generate_alert(row):

    if row["final_risk_level"] == "CRITICAL":
        return "IMMEDIATE INVESTIGATION REQUIRED"

    elif row["final_risk_level"] == "HIGH":
        return "HIGH PRIORITY SECURITY ALERT"

    elif row["final_risk_level"] == "MEDIUM":
        return "MONITOR AND REVIEW"

    else:
        return "NO IMMEDIATE ACTION"


data["security_alert"] = (
    data.apply(generate_alert, axis=1)
)


# ============================================================
# DETECTION REASON
# ============================================================

def generate_detection_reason(row):

    reasons = []

    if row["m2_behavior_score"] >= 30:
        reasons.append("Behavioural deviation")

    if row["ml_attack_prediction"] == 1:
        reasons.append("ML attack detection")

    if "sequence_behavior_score" in data.columns:

        if row["sequence_behavior_score"] >= 60:
            reasons.append("Suspicious attack sequence")

    if "device_behavior_score" in data.columns:

        if row["device_behavior_score"] >= 50:
            reasons.append("Abnormal device behaviour")

    if not reasons:
        return "Normal behaviour"

    return " | ".join(reasons)


data["detection_reason"] = (
    data.apply(generate_detection_reason, axis=1)
)


# ============================================================
# SORT BY FINAL RISK
# ============================================================

data = data.sort_values(
    by="final_risk_score",
    ascending=False
).reset_index(drop=True)


# ============================================================
# DISPLAY FINAL DETECTIONS
# ============================================================

print("\n" + "=" * 70)
print("TOP 20 FINAL SECURITY DETECTIONS")
print("=" * 70)

display_columns = [
    "event_id",
    "user_id",
    "event_type",
    "m2_behavior_score",
    "ml_attack_probability",
    "ml_attack_prediction",
    "final_risk_score",
    "final_risk_level",
    "security_alert"
]

available_display_columns = [
    col for col in display_columns
    if col in data.columns
]

print(
    data[available_display_columns]
    .head(20)
    .to_string(index=False)
)


# ============================================================
# RISK DISTRIBUTION
# ============================================================

print("\n" + "=" * 70)
print("FINAL RISK DISTRIBUTION")
print("=" * 70)

print(
    data["final_risk_level"]
    .value_counts()
)


# ============================================================
# SECURITY ALERT SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("SECURITY ALERT SUMMARY")
print("=" * 70)

print(
    data["security_alert"]
    .value_counts()
)


# ============================================================
# ATTACK DETECTION SUMMARY
# ============================================================

if "ml_attack_prediction" in data.columns:

    detected_attacks = (
        data["ml_attack_prediction"] == 1
    ).sum()

    print("\n" + "=" * 70)
    print("FINAL DETECTION SUMMARY")
    print("=" * 70)

    print(f"\nTotal Events Processed : {len(data)}")
    print(f"ML Detected Attacks    : {detected_attacks}")

    print(
        f"Critical Risk Events   : "
        f"{(data['final_risk_level'] == 'CRITICAL').sum()}"
    )

    print(
        f"High Risk Events       : "
        f"{(data['final_risk_level'] == 'HIGH').sum()}"
    )

    print(
        f"Medium Risk Events     : "
        f"{(data['final_risk_level'] == 'MEDIUM').sum()}"
    )


# ============================================================
# SAVE RESULTS
# ============================================================

data.to_csv(
    FINAL_RESULTS_PATH,
    index=False
)


print("\n" + "=" * 70)
print("M5 FINAL DETECTION & RISK FUSION COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nResults saved to:")
print(FINAL_RESULTS_PATH)