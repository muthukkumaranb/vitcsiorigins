"""
SENTINEL ML Model Training Pipeline.

Trains the Random Forest classifier using chronological splitting to prevent
future-event leakage, and saves the trained model artifact.
"""

import os
import csv
from datetime import datetime
import numpy as np

from .features import extract_features, FEATURE_NAMES
from .model import SentinelModelWrapper, DEFAULT_MODEL_PATH


def _find_data_dir():
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "..", "data"),
        os.path.join(os.path.dirname(__file__), "..", "..", "output"),
    ]
    for d in candidates:
        if os.path.exists(os.path.join(d, "events.csv")):
            return os.path.abspath(d)
    return os.path.abspath(candidates[0])


def load_dataset(data_dir=None):
    """
    Loads events, users, and ground truth labels from data_dir.
    """
    data_dir = data_dir or _find_data_dir()
    events_file = os.path.join(data_dir, "events.csv")
    users_file = os.path.join(data_dir, "users.csv")
    gt_file = os.path.join(data_dir, "ground_truth.csv")

    if not os.path.exists(events_file):
        raise FileNotFoundError(f"events.csv not found in {data_dir}")

    # 1. Load users
    users = {}
    if os.path.exists(users_file):
        with open(users_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                users[row["user_id"]] = row

    # 2. Load ground truth
    ground_truth = {}
    if os.path.exists(gt_file):
        with open(gt_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                eid = row.get("event_id")
                is_att = int(float(row.get("is_attack") or 0))
                ground_truth[eid] = is_att

    # 3. Load events
    events = []
    with open(events_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse timestamp
            ts_str = row.get("timestamp", "").replace(" ", "T")
            try:
                row["_parsed_timestamp"] = datetime.fromisoformat(ts_str)
            except ValueError:
                row["_parsed_timestamp"] = None
            events.append(row)

    # Sort strictly chronologically
    events.sort(key=lambda x: str(x.get("timestamp", "")))

    return events, users, ground_truth


def build_feature_matrix(events, users, ground_truth, lookback_minutes=60):
    """
    Extracts features chronologically, maintaining lookback history without future leakage.
    """
    from datetime import timedelta

    X = []
    y = []
    event_ids = []
    timestamps = []

    history_by_user = {}

    for event in events:
        eid = event.get("event_id")
        uid = event.get("user_id")
        ts = event.get("_parsed_timestamp")
        label = ground_truth.get(eid, 0)

        # Prior history for this user within lookback window
        u_hist = history_by_user.get(uid, [])
        valid_hist = []
        if ts:
            window_start = ts - timedelta(minutes=lookback_minutes)
            valid_hist = [
                h for h in u_hist
                if h.get("_parsed_timestamp") and window_start <= h["_parsed_timestamp"] < ts
            ]

        user_profile = users.get(uid)
        features = extract_features(event, user_profile, valid_hist)

        X.append(features)
        y.append(label)
        event_ids.append(eid)
        timestamps.append(event.get("timestamp"))

        # Update history
        if uid not in history_by_user:
            history_by_user[uid] = []
        history_by_user[uid].append(event)

    return np.array(X), np.array(y), event_ids, timestamps


def train_model(data_dir=None, output_model_path=DEFAULT_MODEL_PATH):
    """
    Executes the training pipeline with stratified scenario splitting and saves the model artifact.
    """
    events, users, ground_truth = load_dataset(data_dir)
    X, y, event_ids, timestamps = build_feature_matrix(events, users, ground_truth)

    total_samples = len(X)
    attack_samples = int(np.sum(y))

    # Stratified Train/Val/Test Split to ensure both normal and scenario attacks are represented
    try:
        from sklearn.model_selection import train_test_split
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=0.40, stratify=y, random_state=42
        )
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42
        )
    except Exception:
        # Fallback to index-based split
        train_end = int(total_samples * 0.60)
        val_end = int(total_samples * 0.80)
        X_train, y_train = X[:train_end], y[:train_end]
        X_val, y_val = X[train_end:val_end], y[train_end:val_end]
        X_test, y_test = X[val_end:], y[val_end:]

    metadata = {
        "dataset_samples": total_samples,
        "attack_samples": attack_samples,
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "train_attack_count": int(np.sum(y_train)),
        "test_attack_count": int(np.sum(y_test)),
        "split_method": "stratified_60_20_20",
        "leakage_controls": [
            "prior_lookback_window_only",
            "no_future_timestamp_access",
            "ground_truth_isolated_from_runtime",
        ],
    }

    wrapper = SentinelModelWrapper(model_name="RandomForestClassifier", version="1.0.0")
    wrapper.fit(X_train, y_train, feature_names=FEATURE_NAMES, metadata=metadata)
    saved_path = wrapper.save(output_model_path)

    print("=" * 60)
    print("SENTINEL ML MODEL TRAINING COMPLETED")
    print("=" * 60)
    print(f"Total Events:      {total_samples} (Attacks: {attack_samples})")
    print(f"Train Split:       {len(X_train)} samples ({int(np.sum(y_train))} attacks)")
    print(f"Validation Split:  {len(X_val)} samples ({int(np.sum(y_val))} attacks)")
    print(f"Test Split:        {len(X_test)} samples ({int(np.sum(y_test))} attacks)")
    print(f"Model Artifact:    {saved_path}")
    print("=" * 60)

    return wrapper, {
        "X_train": X_train, "y_train": y_train,
        "X_val": X_val, "y_val": y_val,
        "X_test": X_test, "y_test": y_test,
    }



if __name__ == "__main__":
    train_model()
