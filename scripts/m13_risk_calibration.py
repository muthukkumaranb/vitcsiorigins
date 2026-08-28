# ============================================================
# M13 ADAPTIVE RISK CALIBRATION & EXPLAINABLE DECISION ENGINE
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

M12_FILE = os.path.join(
    OUTPUT_DIR,
    "m12_risk_fusion_results.csv"
)

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "m13_risk_calibration_results.csv"
)


# ============================================================
# START
# ============================================================

print("=" * 70)
print("M13 ADAPTIVE RISK CALIBRATION & EXPLAINABLE DECISION ENGINE")
print("=" * 70)


# ============================================================
# LOAD M12
# ============================================================

if not os.path.exists(M12_FILE):
    raise FileNotFoundError(
        f"M12 results not found:\n{M12_FILE}"
    )

data = pd.read_csv(M12_FILE)

print("\nDATA LOADED SUCCESSFULLY")
print("M12 Results:", data.shape)


# ============================================================
# REQUIRED COLUMNS
# ============================================================

required_columns = [
    "event_id",
    "user_id",
    "event_type",
    "m2_behavior_score",
    "ml_attack_probability",
    "ml_attack_prediction",
    "isolation_risk_score",
    "isolation_forest_prediction",
    "contextual_risk_score",
    "sequence_progression_score",
    "m12_risk_score",
    "m12_risk_level",
    "model_agreement"
]

missing_columns = [
    column
    for column in required_columns
    if column not in data.columns
]

if missing_columns:
    raise ValueError(
        f"Missing required M12 columns: {missing_columns}"
    )


# ============================================================
# NUMERIC CLEANUP
# ============================================================

numeric_columns = [
    "m2_behavior_score",
    "ml_attack_probability",
    "isolation_risk_score",
    "contextual_risk_score",
    "sequence_progression_score",
    "m12_risk_score"
]

for column in numeric_columns:

    data[column] = pd.to_numeric(
        data[column],
        errors="coerce"
    ).fillna(0)


# ============================================================
# NORMALIZED COMPONENTS
# ============================================================

data["m2_normalized"] = (
    data["m2_behavior_score"] / 100
).clip(0, 1)

data["rf_normalized"] = (
    data["ml_attack_probability"] / 100
).clip(0, 1)

data["isolation_normalized"] = (
    data["isolation_risk_score"] / 100
).clip(0, 1)

data["context_normalized"] = (
    data["contextual_risk_score"] / 50
).clip(0, 1)

data["sequence_normalized"] = (
    data["sequence_progression_score"] / 70
).clip(0, 1)


# ============================================================
# MODEL AGREEMENT
# ============================================================

data["both_models_detect"] = (
    (
        data["ml_attack_prediction"] == 1
    )
    &
    (
        data["isolation_forest_prediction"] == 1
    )
).astype(int)

data["rf_only"] = (
    (
        data["ml_attack_prediction"] == 1
    )
    &
    (
        data["isolation_forest_prediction"] == 0
    )
).astype(int)

data["isolation_only"] = (
    (
        data["ml_attack_prediction"] == 0
    )
    &
    (
        data["isolation_forest_prediction"] == 1
    )
).astype(int)


# ============================================================
# DETECTION CONFIDENCE
# ============================================================

def calculate_confidence(row):

    rf = row["rf_normalized"]
    iso = row["isolation_normalized"]

    if row["both_models_detect"] == 1:

        confidence = (
            0.50 * rf +
            0.50 * iso
        )

        # Agreement provides additional confidence.
        confidence += 0.10

    elif row["rf_only"] == 1:

        confidence = (
            0.75 * rf +
            0.25 * iso
        )

    elif row["isolation_only"] == 1:

        confidence = (
            0.25 * rf +
            0.75 * iso
        )

    else:

        confidence = (
            0.50 * rf +
            0.50 * iso
        )

    return min(confidence, 1.0) * 100


data["m13_detection_confidence"] = data.apply(
    calculate_confidence,
    axis=1
).round(2)


# ============================================================
# ADAPTIVE CALIBRATION
# ============================================================

def calculate_calibrated_score(row):

    base_score = row["m12_risk_score"]

    rf = row["rf_normalized"]
    iso = row["isolation_normalized"]

    contextual = row["context_normalized"]
    sequence = row["sequence_normalized"]

    score = base_score

    # Strong independent model agreement.
    if row["both_models_detect"] == 1:

        score += 10

    # Strong RF evidence.
    if rf >= 0.80:

        score += 3

    # Strong Isolation Forest evidence.
    if iso >= 0.80:

        score += 3

    # Strong contextual evidence.
    if contextual >= 0.60:

        score += 2

    # Strong sequence evidence.
    if sequence >= 0.60:

        score += 2

    return min(score, 100)


data["m13_risk_score"] = data.apply(
    calculate_calibrated_score,
    axis=1
).round(2)


# ============================================================
# FINAL RISK LEVEL
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

    return "LOW"


data["m13_risk_level"] = (
    data["m13_risk_score"]
    .apply(calculate_risk_level)
)


# ============================================================
# FINAL DETECTION DECISION
# ============================================================

data["m13_attack_prediction"] = (
    (
        (data["both_models_detect"] == 1)
        |
        (
            (data["m13_detection_confidence"] >= 70)
            &
            (
                (data["m13_risk_score"] >= 60)
            )
        )
    )
).astype(int)


# ============================================================
# EXPLAINABLE RISK FACTORS
# ============================================================

def generate_risk_factors(row):

    factors = []

    if row["m2_behavior_score"] >= 30:
        factors.append("HIGH BEHAVIOUR DEVIATION")

    if row["ml_attack_probability"] >= 80:
        factors.append("HIGH RANDOM FOREST RISK")

    if row["isolation_risk_score"] >= 80:
        factors.append("HIGH ISOLATION FOREST ANOMALY")

    if row["contextual_risk_score"] >= 20:
        factors.append("ELEVATED CONTEXTUAL RISK")

    if row["sequence_progression_score"] >= 20:
        factors.append("SUSPICIOUS EVENT SEQUENCE")

    if row["both_models_detect"] == 1:
        factors.append("INDEPENDENT MODEL AGREEMENT")

    if not factors:
        return "NO SIGNIFICANT RISK FACTORS"

    return " | ".join(factors)


data["m13_risk_factors"] = data.apply(
    generate_risk_factors,
    axis=1
)


# ============================================================
# RECOMMENDED ACTION
# ============================================================

def recommended_action(row):

    if row["m13_risk_level"] == "CRITICAL":

        return "IMMEDIATE INVESTIGATION AND CONTAINMENT"

    elif row["m13_risk_level"] == "HIGH":

        return "HIGH PRIORITY SECURITY INVESTIGATION"

    elif row["m13_risk_level"] == "MEDIUM":

        return "SECURITY REVIEW RECOMMENDED"

    elif row["m13_risk_level"] == "LOW-MODERATE":

        return "MONITOR EVENT"

    return "NO IMMEDIATE ACTION"


data["m13_recommended_action"] = data.apply(
    recommended_action,
    axis=1
)


# ============================================================
# FINAL EXPLANATION
# ============================================================

def generate_explanation(row):

    if row["both_models_detect"] == 1:

        return (
            "Random Forest and Isolation Forest independently "
            "identified this event as suspicious"
        )

    if row["rf_only"] == 1:

        return (
            "Random Forest identified elevated attack probability"
        )

    if row["isolation_only"] == 1:

        return (
            "Isolation Forest identified anomalous behaviour"
        )

    if row["contextual_risk_score"] >= 20:

        return (
            "Elevated contextual risk detected"
        )

    if row["sequence_progression_score"] >= 20:

        return (
            "Suspicious event sequence detected"
        )

    return "No strong independent detection signal"


data["m13_explanation"] = data.apply(
    generate_explanation,
    axis=1
)


# ============================================================
# FINAL OUTPUT
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

    "contextual_risk_score",
    "sequence_progression_score",

    "m12_risk_score",
    "m12_risk_level",

    "m13_detection_confidence",
    "m13_risk_score",
    "m13_risk_level",
    "m13_attack_prediction",

    "model_agreement",

    "m13_risk_factors",
    "m13_explanation",
    "m13_recommended_action"
]

output_columns = [
    column
    for column in output_columns
    if column in data.columns
]

m13_results = data[output_columns].copy()


# ============================================================
# SORT
# ============================================================

m13_results = m13_results.sort_values(
    by="m13_risk_score",
    ascending=False
).reset_index(drop=True)


# ============================================================
# TOP 20
# ============================================================

print("\n" + "=" * 70)
print("TOP 20 M13 SECURITY DETECTIONS")
print("=" * 70)

print(
    m13_results[
        [
            "event_id",
            "user_id",
            "event_type",
            "m12_risk_score",
            "m13_detection_confidence",
            "m13_risk_score",
            "m13_risk_level",
            "model_agreement",
            "m13_attack_prediction"
        ]
    ].head(20).to_string(index=False)
)


# ============================================================
# RISK DISTRIBUTION
# ============================================================

print("\n" + "=" * 70)
print("M13 RISK DISTRIBUTION")
print("=" * 70)

print(
    m13_results[
        "m13_risk_level"
    ].value_counts()
)


# ============================================================
# DETECTION SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("M13 DETECTION SUMMARY")
print("=" * 70)

print(
    f"Total Events             : {len(m13_results)}"
)

print(
    "M12 High/Critical Events :",
    int(
        m13_results[
            "m12_risk_level"
        ].isin(
            ["HIGH", "CRITICAL"]
        ).sum()
    )
)

print(
    "M13 Predicted Attacks    :",
    int(
        m13_results[
            "m13_attack_prediction"
        ].sum()
    )
)

print(
    "M13 Critical Events      :",
    int(
        (
            m13_results[
                "m13_risk_level"
            ] == "CRITICAL"
        ).sum()
    )
)

print(
    "M13 High Events          :",
    int(
        (
            m13_results[
                "m13_risk_level"
            ] == "HIGH"
        ).sum()
    )
)

print(
    "M13 Medium Events        :",
    int(
        (
            m13_results[
                "m13_risk_level"
            ] == "MEDIUM"
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

m13_results.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# COMPLETION
# ============================================================

print("\n" + "=" * 70)
print("M13 ADAPTIVE RISK CALIBRATION COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nResults saved to:")
print(OUTPUT_FILE)