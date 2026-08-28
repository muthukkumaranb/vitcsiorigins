"""
SENTINEL Verified Dataset Builder for Controlled Learning (Plane B).

Captures analyst investigation feedback, validates labels, and builds verified
training candidate datasets without contaminating the baseline dataset.
"""

import os
import json
from datetime import datetime

try:
    from .features import extract_features
    from ..data_loader import store
except ImportError:
    from ml.features import extract_features
    from data_loader import store

FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "analyst_feedback.json")


class FeedbackDatasetBuilder:
    """
    Manages the ingestion and curation of verified analyst feedback for candidate model retraining.
    """

    def __init__(self, feedback_filepath=FEEDBACK_FILE):
        self.feedback_filepath = os.path.abspath(feedback_filepath)
        self.feedback_entries = []
        self._load_feedback()

    def _load_feedback(self):
        if os.path.exists(self.feedback_filepath):
            try:
                with open(self.feedback_filepath, "r", encoding="utf-8") as f:
                    self.feedback_entries = json.load(f)
            except Exception:
                self.feedback_entries = []
        else:
            self.feedback_entries = []

    def _save_feedback(self):
        os.makedirs(os.path.dirname(self.feedback_filepath), exist_ok=True)
        with open(self.feedback_filepath, "w", encoding="utf-8") as f:
            json.dump(self.feedback_entries, f, indent=2)

    def record_feedback(self, event_id, user_id, decision, analyst="SOC Analyst", comment=""):
        """
        Record a verified analyst decision.
        Decisions:
            - 'CONFIRM_THREAT' -> label = 1 (verified attack)
            - 'FALSE_POSITIVE' -> label = 0 (verified benign activity)
            - 'NEEDS_REVIEW'   -> label = None (unverified, excluded from training)
        """
        decision_upper = str(decision).upper()
        if decision_upper not in {"CONFIRM_THREAT", "FALSE_POSITIVE", "NEEDS_REVIEW"}:
            raise ValueError(f"Invalid decision: {decision}. Must be CONFIRM_THREAT, FALSE_POSITIVE, or NEEDS_REVIEW.")

        entry = {
            "feedback_id": f"FBK-{len(self.feedback_entries) + 1:04d}",
            "event_id": event_id,
            "user_id": user_id,
            "decision": decision_upper,
            "analyst": analyst,
            "comment": comment,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "is_verified_label": decision_upper in {"CONFIRM_THREAT", "FALSE_POSITIVE"},
            "label": 1 if decision_upper == "CONFIRM_THREAT" else 0 if decision_upper == "FALSE_POSITIVE" else None,
        }

        self.feedback_entries.append(entry)
        self._save_feedback()
        return entry

    def get_all_feedback(self):
        return self.feedback_entries

    def get_verified_training_samples(self):
        """
        Returns feature vectors and verified binary labels from recorded analyst feedback.
        """
        X = []
        y = []
        metadata = []

        for entry in self.feedback_entries:
            if not entry.get("is_verified_label") or entry.get("label") is None:
                continue

            eid = entry.get("event_id")
            event = store.events_by_id.get(eid)
            if not event:
                continue

            user = store.users_by_id.get(event.get("user_id"))
            features = extract_features(event, user)
            X.append(features)
            y.append(entry["label"])
            metadata.append(entry)

        return X, y, metadata


feedback_builder = FeedbackDatasetBuilder()
