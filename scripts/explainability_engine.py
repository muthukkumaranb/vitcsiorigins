import pandas as pd
import os


# ============================================================
# M6 EXPLAINABLE SECURITY ALERT & INVESTIGATION ENGINE
# ============================================================

print("\n" + "=" * 70)
print("M6 EXPLAINABLE SECURITY ALERT & INVESTIGATION ENGINE")
print("=" * 70)


# ============================================================
# FILE PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INPUT_FILE = os.path.join(
    BASE_DIR,
    "output",
    "final_detection_results.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "output",
    "explainable_security_alerts.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

try:
    data = pd.read_csv(INPUT_FILE)

    print("\nDATA LOADED SUCCESSFULLY")
    print(f"Final Detection Results: {data.shape}")

except FileNotFoundError:

    print("\nERROR: final_detection_results.csv not found.")
    print("Please run the M5 Final Detection & Risk Fusion Engine first.")

    exit()


# ============================================================
# CHECK AVAILABLE COLUMNS
# ============================================================

print("\nAvailable Columns:")
print(data.columns.tolist())


# ============================================================
# GENERATE DETECTION REASONS
# ============================================================

def generate_detection_reasons(row):

    reasons = []

    # --------------------------------------------------------
    # ML ATTACK DETECTION
    # --------------------------------------------------------

    ml_probability = pd.to_numeric(
        row.get("ml_attack_probability", 0),
        errors="coerce"
    )

    if pd.isna(ml_probability):
        ml_probability = 0

    if ml_probability > 1:
        ml_probability_normalized = ml_probability / 100
    else:
        ml_probability_normalized = ml_probability


    if ml_probability_normalized >= 0.90:

        reasons.append(
            "Very high machine learning attack probability"
        )

    elif ml_probability_normalized >= 0.70:

        reasons.append(
            "High machine learning attack probability"
        )

    elif ml_probability_normalized >= 0.40:

        reasons.append(
            "Moderate machine learning attack probability"
        )


    # --------------------------------------------------------
    # BEHAVIOURAL DEVIATION
    # --------------------------------------------------------

    behavior_score = pd.to_numeric(
        row.get("m2_behavior_score", 0),
        errors="coerce"
    )

    if pd.isna(behavior_score):
        behavior_score = 0


    if behavior_score >= 50:

        reasons.append(
            "Severe deviation from the user's normal behaviour"
        )

    elif behavior_score >= 30:

        reasons.append(
            "Significant deviation from the user's normal behaviour"
        )

    elif behavior_score >= 20:

        reasons.append(
            "Moderate deviation from the user's normal behaviour"
        )


    # --------------------------------------------------------
    # ATTACK SEQUENCE
    # --------------------------------------------------------

    sequence_score = pd.to_numeric(
        row.get("sequence_behavior_score", 0),
        errors="coerce"
    )

    if pd.isna(sequence_score):
        sequence_score = 0


    if sequence_score >= 100:

        reasons.append(
            "Detected as the final stage of a suspicious attack sequence"
        )

    elif sequence_score >= 80:

        reasons.append(
            "Detected as part of a suspicious multi-stage attack sequence"
        )

    elif sequence_score >= 60:

        reasons.append(
            "Suspicious event sequence detected"
        )


    # --------------------------------------------------------
    # DEVICE ANOMALY
    # --------------------------------------------------------

    device_score = pd.to_numeric(
        row.get("device_behavior_score", 0),
        errors="coerce"
    )

    if pd.isna(device_score):
        device_score = 0


    if device_score >= 70:

        reasons.append(
            "Activity detected from a highly unusual or new device"
        )

    elif device_score >= 50:

        reasons.append(
            "Device behaviour differs from the user's normal pattern"
        )


    # --------------------------------------------------------
    # NEW DEVICE
    # --------------------------------------------------------

    new_device = pd.to_numeric(
        row.get("new_device_flag", 0),
        errors="coerce"
    )

    if pd.notna(new_device) and new_device == 1:

        reasons.append(
            "Login or activity originated from a new device"
        )


    # --------------------------------------------------------
    # PERMISSION CHANGE
    # --------------------------------------------------------

    permission_change = pd.to_numeric(
        row.get("permission_change_flag", 0),
        errors="coerce"
    )

    if pd.notna(permission_change) and permission_change == 1:

        reasons.append(
            "Suspicious permission or privilege change detected"
        )


    # --------------------------------------------------------
    # SENSITIVE FILE ACCESS
    # --------------------------------------------------------

    sensitive_access = pd.to_numeric(
        row.get("sensitive_resource_flag", 0),
        errors="coerce"
    )

    if pd.notna(sensitive_access) and sensitive_access == 1:

        reasons.append(
            "Sensitive resource accessed"
        )


    # --------------------------------------------------------
    # NEW BENEFICIARY
    # --------------------------------------------------------

    new_beneficiary = pd.to_numeric(
        row.get("new_beneficiary_flag", 0),
        errors="coerce"
    )

    if pd.notna(new_beneficiary) and new_beneficiary == 1:

        reasons.append(
            "New beneficiary added or used"
        )


    # --------------------------------------------------------
    # LARGE TRANSACTION
    # --------------------------------------------------------

    transaction_amount = pd.to_numeric(
        row.get("transaction_amount", 0),
        errors="coerce"
    )

    if pd.notna(transaction_amount):

        if transaction_amount > 10000:

            reasons.append(
                "High-value transaction detected"
            )


    # --------------------------------------------------------
    # PEER DEVIATION
    # --------------------------------------------------------

    peer_score = pd.to_numeric(
        row.get("peer_deviation_score", 0),
        errors="coerce"
    )

    if pd.isna(peer_score):
        peer_score = 0


    if peer_score >= 50:

        reasons.append(
            "Behaviour strongly deviates from peer group patterns"
        )

    elif peer_score >= 20:

        reasons.append(
            "Behaviour deviates from peer group patterns"
        )


    # --------------------------------------------------------
    # DEFAULT
    # --------------------------------------------------------

    if len(reasons) == 0:

        reasons.append(
            "No significant security anomaly detected"
        )


    return " | ".join(reasons)


# ============================================================
# GENERATE RECOMMENDED ACTION
# ============================================================

def generate_recommended_action(row):

    risk_level = str(
        row.get("final_risk_level", "LOW")
    ).upper()


    if risk_level == "CRITICAL":

        return (
            "Immediately investigate the event, "
            "validate the user identity, review related "
            "activities, and consider blocking the account "
            "or transaction."
        )


    elif risk_level == "HIGH":

        return (
            "Perform urgent security review, verify the user "
            "and investigate related events before allowing "
            "further sensitive activity."
        )


    elif risk_level == "MEDIUM":

        return (
            "Monitor the user closely and perform additional "
            "verification if further suspicious activity occurs."
        )


    else:

        return (
            "No immediate action required. Continue normal monitoring."
        )


# ============================================================
# GENERATE INVESTIGATION PRIORITY
# ============================================================

def generate_investigation_priority(row):

    risk_level = str(
        row.get("final_risk_level", "LOW")
    ).upper()


    if risk_level == "CRITICAL":

        return "P1 - IMMEDIATE"

    elif risk_level == "HIGH":

        return "P2 - URGENT"

    elif risk_level == "MEDIUM":

        return "P3 - REVIEW"

    else:

        return "P4 - MONITOR"


# ============================================================
# APPLY EXPLAINABILITY ENGINE
# ============================================================

print("\n" + "=" * 70)
print("GENERATING SECURITY EXPLANATIONS")
print("=" * 70)


data["detection_reasons"] = data.apply(
    generate_detection_reasons,
    axis=1
)


data["recommended_action"] = data.apply(
    generate_recommended_action,
    axis=1
)


data["investigation_priority"] = data.apply(
    generate_investigation_priority,
    axis=1
)


# ============================================================
# FILTER SECURITY ALERTS
# ============================================================

alerts = data[
    data["final_risk_level"].isin(
        ["MEDIUM", "HIGH", "CRITICAL"]
    )
].copy()


# ============================================================
# SORT BY RISK
# ============================================================

risk_order = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 1
}


data["risk_rank"] = data[
    "final_risk_level"
].map(risk_order)


data = data.sort_values(
    by=[
        "risk_rank",
        "final_risk_score"
    ],
    ascending=False
)


alerts = data[
    data["final_risk_level"].isin(
        ["MEDIUM", "HIGH", "CRITICAL"]
    )
].copy()


# ============================================================
# DISPLAY TOP SECURITY ALERTS
# ============================================================

print("\n" + "=" * 70)
print("TOP EXPLAINABLE SECURITY ALERTS")
print("=" * 70)


display_columns = [
    "event_id",
    "user_id",
    "event_type",
    "final_risk_score",
    "final_risk_level",
    "investigation_priority",
    "detection_reasons",
    "recommended_action"
]


available_columns = [

    column for column in display_columns

    if column in alerts.columns
]


print()

print(
    alerts[
        available_columns
    ].head(20).to_string(index=False)
)


# ============================================================
# ALERT SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("SECURITY INVESTIGATION SUMMARY")
print("=" * 70)


print(f"\nTotal Events Processed : {len(data)}")

print(
    f"Security Alerts : {len(alerts)}"
)


if "final_risk_level" in alerts.columns:

    print("\nAlert Distribution:")

    print(
        alerts[
            "final_risk_level"
        ].value_counts()
    )


if "investigation_priority" in alerts.columns:

    print("\nInvestigation Priority:")

    print(
        alerts[
            "investigation_priority"
        ].value_counts()
    )


# ============================================================
# SAVE RESULTS
# ============================================================

data.drop(
    columns=["risk_rank"],
    errors="ignore"
).to_csv(
    OUTPUT_FILE,
    index=False
)


print("\n" + "=" * 70)
print("M6 EXPLAINABLE SECURITY ALERT ENGINE COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nResults saved to:")

print(OUTPUT_FILE)