import pandas as pd
import os


# ============================================================
# M7 SECURITY INCIDENT CORRELATION & ATTACK TIMELINE ENGINE
# ============================================================

print("\n" + "=" * 70)
print("M7 SECURITY INCIDENT CORRELATION & ATTACK TIMELINE ENGINE")
print("=" * 70)


# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

INPUT_FILE = os.path.join(
    BASE_DIR,
    "output",
    "explainable_security_alerts.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "output",
    "security_incidents.csv"
)


# ============================================================
# LOAD M6 EXPLAINABLE SECURITY ALERTS
# ============================================================

if not os.path.exists(INPUT_FILE):

    print("\nERROR: M6 output file not found.")

    print("Expected file:")
    print(INPUT_FILE)

    raise SystemExit


data = pd.read_csv(INPUT_FILE)


print("\nDATA LOADED SUCCESSFULLY")

print(
    f"Explainable Security Alerts: {data.shape}"
)


print("\nAvailable Columns:")

print(
    data.columns.tolist()
)


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [

    "event_id",
    "user_id",
    "timestamp",
    "event_type",
    "final_risk_score",
    "final_risk_level"

]


missing_columns = [

    column

    for column in required_columns

    if column not in data.columns

]


if missing_columns:

    print("\nERROR: Required columns missing:")

    print(missing_columns)

    raise SystemExit


# ============================================================
# CONVERT TIMESTAMP
# ============================================================

data["timestamp"] = pd.to_datetime(
    data["timestamp"],
    errors="coerce"
)


data = data.dropna(
    subset=["timestamp"]
)


# ============================================================
# KEEP ONLY SECURITY ALERTS
# ============================================================

if "security_alert" in data.columns:

    alert_data = data[
        data["security_alert"]
        != "NO IMMEDIATE ACTION"
    ].copy()

else:

    alert_data = data[
        data["final_risk_level"]
        .isin(["HIGH", "CRITICAL"])
    ].copy()


print("\n" + "=" * 70)
print("SECURITY EVENTS SELECTED FOR INCIDENT CORRELATION")
print("=" * 70)

print(
    f"\nTotal Events: {len(data)}"
)

print(
    f"Security Alerts: {len(alert_data)}"
)


# ============================================================
# SORT BY USER AND TIME
# ============================================================

alert_data = alert_data.sort_values(

    by=[
        "user_id",
        "timestamp"
    ]

).reset_index(
    drop=True
)


# ============================================================
# INCIDENT CORRELATION SETTINGS
# ============================================================

TIME_WINDOW_MINUTES = 120

incident_counter = 1

alert_data["incident_id"] = None


# ============================================================
# CORRELATE EVENTS INTO INCIDENTS
# ============================================================

for user_id, group in alert_data.groupby("user_id"):

    group = group.sort_values(
        "timestamp"
    )

    previous_timestamp = None

    current_incident_id = None


    for index, row in group.iterrows():

        current_timestamp = row["timestamp"]


        # ----------------------------------------------------
        # FIRST EVENT FOR THIS USER
        # ----------------------------------------------------

        if previous_timestamp is None:

            current_incident_id = (
                f"INC-{incident_counter:03d}"
            )

            incident_counter += 1


        else:

            time_difference = (

                current_timestamp
                -
                previous_timestamp

            ).total_seconds() / 60


            # ------------------------------------------------
            # CREATE NEW INCIDENT IF TOO MUCH TIME HAS PASSED
            # ------------------------------------------------

            if time_difference > TIME_WINDOW_MINUTES:

                current_incident_id = (
                    f"INC-{incident_counter:03d}"
                )

                incident_counter += 1


        alert_data.loc[
            index,
            "incident_id"
        ] = current_incident_id


        previous_timestamp = current_timestamp


# ============================================================
# CREATE ATTACK STAGES
# ============================================================

def get_attack_stage(event_type):

    event_type = str(event_type).lower()


    if event_type == "login":

        return "INITIAL ACCESS"


    elif event_type == "permission_change":

        return "PRIVILEGE ESCALATION"


    elif event_type == "file_access":

        return "SENSITIVE DATA ACCESS"


    elif event_type == "beneficiary_change":

        return "FINANCIAL PREPARATION"


    elif event_type == "transaction":

        return "FINANCIAL IMPACT"


    else:

        return "SUSPICIOUS ACTIVITY"


alert_data["attack_stage"] = (

    alert_data["event_type"]

    .apply(
        get_attack_stage
    )

)


# ============================================================
# CREATE ATTACK SEQUENCE ORDER
# ============================================================

alert_data["attack_sequence_step"] = (

    alert_data.groupby(
        "incident_id"
    )

    .cumcount()

    + 1

)


# ============================================================
# INCIDENT EVENT COUNT
# ============================================================

alert_data["incident_event_count"] = (

    alert_data.groupby(
        "incident_id"
    )["event_id"]

    .transform(
        "count"
    )

)


# ============================================================
# INCIDENT START TIME
# ============================================================

alert_data["incident_start_time"] = (

    alert_data.groupby(
        "incident_id"
    )["timestamp"]

    .transform(
        "min"
    )

)


# ============================================================
# INCIDENT END TIME
# ============================================================

alert_data["incident_end_time"] = (

    alert_data.groupby(
        "incident_id"
    )["timestamp"]

    .transform(
        "max"
    )

)


# ============================================================
# INCIDENT MAXIMUM RISK
# ============================================================

alert_data["incident_max_risk"] = (

    alert_data.groupby(
        "incident_id"
    )["final_risk_score"]

    .transform(
        "max"
    )

)


# ============================================================
# INCIDENT DURATION
# ============================================================

alert_data["incident_duration_minutes"] = (

    (
        alert_data["incident_end_time"]
        -
        alert_data["incident_start_time"]
    )

    .dt.total_seconds()

    / 60

)


# ============================================================
# DETERMINE INCIDENT SEVERITY
# ============================================================

def get_incident_severity(score):

    if score >= 80:

        return "CRITICAL"

    elif score >= 60:

        return "HIGH"

    elif score >= 30:

        return "MEDIUM"

    else:

        return "LOW"


alert_data["incident_severity"] = (

    alert_data["incident_max_risk"]

    .apply(
        get_incident_severity
    )

)


# ============================================================
# CREATE INCIDENT SUMMARY
# ============================================================

def create_incident_summary(group):

    user = group["user_id"].iloc[0]

    event_count = len(group)

    stages = (

        group["attack_stage"]

        .drop_duplicates()

        .tolist()

    )


    attack_flow = " -> ".join(stages)


    return (

        f"User {user} generated "

        f"{event_count} correlated security events. "

        f"Attack progression: "

        f"{attack_flow}"

    )


incident_summaries = (

    alert_data.groupby(
        "incident_id"
    )

    .apply(
        create_incident_summary
    )

    .to_dict()

)


alert_data["incident_summary"] = (

    alert_data["incident_id"]

    .map(
        incident_summaries
    )

)


# ============================================================
# INCIDENT RESPONSE RECOMMENDATION
# ============================================================

def get_incident_response(severity):

    if severity == "CRITICAL":

        return (

            "Immediately contain the incident, block suspicious "
            "activity, validate the user, and begin a full "
            "security investigation."

        )


    elif severity == "HIGH":

        return (

            "Perform an urgent investigation, review all "
            "correlated events, and restrict sensitive operations "
            "if required."

        )


    elif severity == "MEDIUM":

        return (

            "Review the correlated activity and increase "
            "monitoring for additional suspicious behaviour."

        )


    else:

        return (

            "Continue monitoring the activity."

        )


alert_data["incident_recommended_response"] = (

    alert_data["incident_severity"]

    .apply(
        get_incident_response
    )

)


# ============================================================
# DISPLAY ATTACK TIMELINE
# ============================================================

print("\n" + "=" * 70)
print("CORRELATED ATTACK TIMELINE")
print("=" * 70)


timeline_columns = [

    "incident_id",
    "user_id",
    "event_id",
    "timestamp",
    "attack_sequence_step",
    "event_type",
    "attack_stage",
    "final_risk_score",
    "final_risk_level"

]


print(

    alert_data[
        timeline_columns
    ]

    .sort_values(
        [
            "incident_id",
            "attack_sequence_step"
        ]
    )

    .to_string(
        index=False
    )

)


# ============================================================
# CREATE INCIDENT SUMMARY TABLE
# ============================================================

incident_summary = (

    alert_data.groupby(
        "incident_id"
    )

    .agg(

        user_id=(

            "user_id",
            "first"

        ),

        incident_start_time=(

            "incident_start_time",
            "first"

        ),

        incident_end_time=(

            "incident_end_time",
            "first"

        ),

        incident_duration_minutes=(

            "incident_duration_minutes",
            "first"

        ),

        incident_event_count=(

            "incident_event_count",
            "first"

        ),

        incident_max_risk=(

            "incident_max_risk",
            "first"

        ),

        incident_severity=(

            "incident_severity",
            "first"

        ),

        incident_summary=(

            "incident_summary",
            "first"

        )

    )

    .reset_index()

)


print("\n" + "=" * 70)
print("SECURITY INCIDENT SUMMARY")
print("=" * 70)


print(

    incident_summary

    .to_string(
        index=False
    )

)


# ============================================================
# SAVE RESULTS
# ============================================================

alert_data.to_csv(

    OUTPUT_FILE,

    index=False

)


print("\n" + "=" * 70)
print("M7 SECURITY INCIDENT CORRELATION COMPLETED SUCCESSFULLY")
print("=" * 70)


print("\nResults saved to:")

print(
    OUTPUT_FILE
)