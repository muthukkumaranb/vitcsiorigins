"""
SENTINEL ML Feature Extraction Module.

Extracts normalized, bounded numerical feature vectors from security telemetry
events, user baseline profiles, and historical lookback windows.
"""

from datetime import datetime, timedelta
import math

FEATURE_NAMES = [
    "login_deviation_score",
    "after_hours_flag",
    "new_device_flag",
    "sensitive_access_flag",
    "records_accessed_score",
    "permission_change_flag",
    "new_beneficiary_flag",
    "transaction_amount_score",
    "transaction_frequency_score",
    "sequence_matched_ratio",
]


def _num(row, key, default=0.0):
    try:
        val = (row or {}).get(key)
        return float(val) if val is not None and val != "" else default
    except (TypeError, ValueError):
        return default


def _flag(row, key):
    return 1.0 if _num(row, key) == 1.0 else 0.0


def extract_features(event, user=None, history=None):
    """
    Extract a 10-dimensional numeric feature vector for a single event.

    Args:
        event (dict): Telemetry event record.
        user (dict, optional): User baseline profile.
        history (list, optional): Historical prior events within lookback window.

    Returns:
        list of float: Standardized feature vector matching FEATURE_NAMES.
    """
    history = history or []
    event = event or {}
    user = user or {}

    # 1. Login Deviation Score [0.0, 1.0]
    login_dev_score = 0.0
    after_hours = 0.0
    if event.get("event_type") == "login":
        ts = event.get("_parsed_timestamp")
        if ts is None and event.get("timestamp"):
            try:
                raw_ts = str(event["timestamp"]).replace(" ", "T")
                ts = datetime.fromisoformat(raw_ts)
            except ValueError:
                ts = None

        if ts and user:
            typical_hour = _num(user, "typical_login_hour", 9.0)
            spread = max(_num(user, "login_hour_spread", 1.0), 0.5)
            actual_hour = ts.hour + ts.minute / 60.0
            diff = abs(actual_hour - typical_hour)
            circular_diff = min(diff, 24.0 - diff)
            login_dev_score = min(1.0, circular_diff / max(spread * 3.0, 1.0))
            if circular_diff > max(spread * 2.0, 1.5):
                after_hours = 1.0

    # 2. Device Flag
    new_device = _flag(event, "new_device_flag")

    # 3. Sensitive Resource & Records Accessed
    sensitive_access = _flag(event, "sensitive_resource_flag")
    records = _num(event, "records_accessed", 0.0)
    # Log-scaled score: 0 -> 0, 10 -> 0.33, 100 -> 0.66, 1000+ -> 1.0
    records_score = min(1.0, math.log10(records + 1.0) / 3.0) if records > 0 else 0.0

    # 4. Permission / Privilege Change
    permission_change = _flag(event, "permission_change_flag")

    # 5. Beneficiary Change
    new_beneficiary = 1.0 if (
        _flag(event, "new_beneficiary_flag") == 1.0 or event.get("event_type") == "beneficiary_change"
    ) else 0.0

    # 6. Transaction Amount Score
    txn_amount = _num(event, "transaction_amount", 0.0)
    txn_score = 0.0
    if txn_amount > 0:
        avg_txn = _num(user, "avg_txn_amount", 0.0)
        spread_txn = max(_num(user, "txn_amount_spread", 100.0), 50.0)
        if _flag(event, "exceeds_limit_flag") == 1.0:
            txn_score = 1.0
        else:
            diff_txn = max(0.0, txn_amount - avg_txn)
            txn_score = min(1.0, diff_txn / (spread_txn * 3.0))

    # 7. Transaction Frequency Score
    txn_freq_score = 0.0
    if txn_amount > 0:
        ts = event.get("_parsed_timestamp")
        if ts:
            prior_same_day = sum(
                1 for item in history
                if item.get("event_type") == "transaction"
                and item.get("_parsed_timestamp")
                and item["_parsed_timestamp"].date() == ts.date()
            )
            avg_daily = max(_num(user, "avg_txn_per_day", 1.0), 1.0)
            if prior_same_day + 1 > avg_daily:
                txn_freq_score = min(1.0, (prior_same_day + 1 - avg_daily) / max(avg_daily * 2.0, 1.0))

    # 8. Sequence Matched Ratio
    sequence_matched_ratio = 0.0
    # Evaluate sequence steps on history
    sequence_step_defs = [
        ("login", lambda e: e.get("event_type") == "login" and (_flag(e, "new_device_flag") == 1.0 or _flag(e, "after_hours_flag") == 1.0)),
        ("sensitive_access", lambda e: _flag(e, "sensitive_resource_flag") == 1.0),
        ("permission_change", lambda e: _flag(e, "permission_change_flag") == 1.0),
        ("beneficiary_change", lambda e: _flag(e, "new_beneficiary_flag") == 1.0 or e.get("event_type") == "beneficiary_change"),
        ("large_transaction", lambda e: _num(e, "transaction_amount", 0.0) > 0 and (_flag(e, "exceeds_limit_flag") == 1.0 or _num(e, "transaction_amount", 0.0) > 500.0)),
        ("data_export", lambda e: e.get("event_type") == "data_export"),
    ]
    all_events = sorted((history or []) + [event], key=lambda x: str(x.get("timestamp", "")))
    matched_count = 0
    step_idx = 0
    for ev in all_events:
        if step_idx < len(sequence_step_defs) and sequence_step_defs[step_idx][1](ev):
            matched_count += 1
            step_idx += 1
    sequence_matched_ratio = round(matched_count / float(len(sequence_step_defs)), 3)

    return [
        round(login_dev_score, 4),
        round(after_hours, 4),
        round(new_device, 4),
        round(sensitive_access, 4),
        round(records_score, 4),
        round(permission_change, 4),
        round(new_beneficiary, 4),
        round(txn_score, 4),
        round(txn_freq_score, 4),
        round(sequence_matched_ratio, 4),
    ]


def extract_features_dict(event, user=None, history=None):
    """
    Extract features as a dictionary mapped by FEATURE_NAMES.
    """
    vec = extract_features(event, user, history)
    return dict(zip(FEATURE_NAMES, vec))
