"""
SENTINEL Telemetry Scenarios Definition.

Defines realistic scenario templates and multi-stage attack progressions for
the Live Telemetry Simulator.
"""

SCENARIOS = {
    "mixed": {
        "id": "mixed",
        "name": "Mixed Operational Traffic",
        "description": "Realistic blend of normal business activity with intermittent attack sequences.",
    },
    "normal_activity": {
        "id": "normal_activity",
        "name": "Normal Business Baseline",
        "description": "Legitimate, baseline-compliant user actions (standard logins, routine file access, ordinary transactions).",
    },
    "privilege_abuse": {
        "id": "privilege_abuse",
        "name": "Privileged Insider Abuse",
        "description": "Progressive 5-stage attack chain escalating from unusual login to unauthorized large transaction.",
        "stages": [
            {
                "stage": 1,
                "name": "Unusual Ingress",
                "event_type": "login",
                "after_hours": True,
                "new_device": True,
                "description": "User logged in outside typical hours from an unfamiliar device.",
            },
            {
                "stage": 2,
                "name": "Privilege Escalation",
                "event_type": "permission_change",
                "permission_change": True,
                "new_permission_level": "SYSTEM_ADMIN",
                "description": "User modified system security permissions to elevate privilege.",
            },
            {
                "stage": 3,
                "name": "Sensitive Resource Access",
                "event_type": "file_access",
                "sensitive_resource": True,
                "records_accessed": 50,
                "resource_id": "RES-CORE-DB",
                "description": "User queried restricted database containing financial customer records.",
            },
            {
                "stage": 4,
                "name": "Beneficiary Modification",
                "event_type": "beneficiary_change",
                "new_beneficiary": True,
                "beneficiary_id": "BEN-UNAPPROVED-99",
                "description": "User registered an unapproved external payment beneficiary.",
            },
            {
                "stage": 5,
                "name": "High-Value Transaction",
                "event_type": "transaction",
                "transaction_multiplier": 5.0,
                "exceeds_limit": True,
                "description": "User executed a large financial transfer to the newly created beneficiary.",
            },
        ],
    },
    "account_takeover": {
        "id": "account_takeover",
        "name": "Account Takeover & Data Exfiltration",
        "description": "Compromised credential ingress followed by mass sensitive data export.",
        "stages": [
            {
                "stage": 1,
                "name": "Anomalous Login",
                "event_type": "login",
                "after_hours": True,
                "new_device": True,
                "description": "Anomalous login detected from new remote IP address.",
            },
            {
                "stage": 2,
                "name": "Mass Sensitive Query",
                "event_type": "file_access",
                "sensitive_resource": True,
                "records_accessed": 500,
                "resource_id": "RES-CREDENTIALS-VAULT",
                "description": "Bulk query against sensitive credentials vault.",
            },
            {
                "stage": 3,
                "name": "Data Export",
                "event_type": "data_export",
                "records_accessed": 500,
                "resource_id": "EXP-REMOTE-SHARE",
                "description": "Large archive of confidential data exported to external endpoint.",
            },
        ],
    },
    "data_exfiltration": {
        "id": "data_exfiltration",
        "name": "Mass Data Exfiltration",
        "description": "Bulk customer records accessed and exported outside working hours.",
        "stages": [
            {
                "stage": 1,
                "name": "Routine Login",
                "event_type": "login",
                "after_hours": False,
                "new_device": False,
                "description": "Standard user session initiated.",
            },
            {
                "stage": 2,
                "name": "Sensitive File Search",
                "event_type": "file_access",
                "sensitive_resource": True,
                "records_accessed": 250,
                "resource_id": "RES-CUSTOMER-PII",
                "description": "Access to customer personally identifiable information.",
            },
            {
                "stage": 3,
                "name": "Bulk Download",
                "event_type": "data_export",
                "records_accessed": 250,
                "description": "Compressed customer archive downloaded.",
            },
        ],
    },
}
