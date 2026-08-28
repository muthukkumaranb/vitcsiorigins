"""
SENTINEL Model Registry Module (Plane B).

Provides lightweight model version control, promotion gating, and rollback capabilities.
"""

import os
import json
import shutil
from datetime import datetime, timezone

REGISTRY_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
REGISTRY_FILE = os.path.join(REGISTRY_DIR, "registry.json")


class ModelRegistry:
    """
    Manages ML model lifecycle: versioning, candidate registration, evaluation gating,
    promotion to production, and safe rollback.
    """

    def __init__(self, registry_filepath=REGISTRY_FILE):
        self.registry_filepath = os.path.abspath(registry_filepath)
        self.registry_dir = os.path.dirname(self.registry_filepath)
        self._data = {
            "active_version": "v1.0.0",
            "previous_version": None,
            "versions": {},
        }
        self._load()

    def _load(self):
        if os.path.exists(self.registry_filepath):
            try:
                with open(self.registry_filepath, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except Exception:
                self._initialize_default_registry()
        else:
            self._initialize_default_registry()

    def _save(self):
        os.makedirs(self.registry_dir, exist_ok=True)
        with open(self.registry_filepath, "w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=2)

    def _initialize_default_registry(self):
        self._data = {
            "active_version": "v1.0.0",
            "previous_version": None,
            "versions": {
                "v1.0.0": {
                    "version": "v1.0.0",
                    "model_name": "RandomForestClassifier",
                    "status": "active",
                    "registered_at": datetime.now(timezone.utc).isoformat(),
                    "description": "Baseline Random Forest classifier trained on stratified scenario splits.",
                    "metrics": {
                        "accuracy": 1.0,
                        "precision": 1.0,
                        "recall": 1.0,
                        "f1_score": 1.0,
                        "false_positive_rate": 0.0,
                        "false_negative_rate": 0.0,
                    },
                    "promotion_reason": "Initial baseline model certification.",
                }
            },
        }
        self._save()

    def get_active_version(self):
        return self._data.get("active_version", "v1.0.0")

    def get_all_versions(self):
        return self._data.get("versions", {})

    def get_version_details(self, version):
        return self._data.get("versions", {}).get(version)

    def register_candidate(self, version, model_name, metrics, artifact_path, description=""):
        """
        Registers a newly trained candidate model in the registry in 'candidate' status.
        Does NOT promote to production.
        """
        entry = {
            "version": version,
            "model_name": model_name,
            "status": "candidate",
            "registered_at": datetime.now(timezone.utc).isoformat(),
            "artifact_path": artifact_path,
            "description": description or f"Candidate model {version} trained on verified telemetry and analyst feedback.",
            "metrics": metrics,
        }
        self._data["versions"][version] = entry
        self._save()
        return entry

    def evaluate_promotion_criteria(self, candidate_version):
        """
        Evaluates candidate metrics against active baseline model requirements:
        1. Recall >= 0.85 (threat coverage)
        2. F1 score >= Active F1 - 0.05
        3. False Positive Rate <= 0.05
        """
        candidate = self.get_version_details(candidate_version)
        if not candidate:
            return False, "Candidate version not found in registry."

        c_metrics = candidate.get("metrics", {})
        active_version = self.get_active_version()
        active_model = self.get_version_details(active_version)
        a_metrics = active_model.get("metrics", {}) if active_model else {}

        rec = c_metrics.get("recall", 0.0)
        f1 = c_metrics.get("f1_score", 0.0)
        fpr = c_metrics.get("false_positive_rate", 0.0)
        active_f1 = a_metrics.get("f1_score", 1.0)

        checks = []
        if rec < 0.85:
            checks.append(f"Recall {rec:.2f} is below minimum required 0.85")
        if f1 < (active_f1 - 0.05):
            checks.append(f"F1 score {f1:.2f} is lower than active baseline {active_f1:.2f}")
        if fpr > 0.05:
            checks.append(f"False Positive Rate {fpr:.2f} exceeds threshold 0.05")

        if checks:
            return False, "; ".join(checks)
        return True, "All security validation criteria passed."

    def promote_candidate(self, candidate_version, override=False):
        """
        Promotes a validated candidate model to 'active' status.
        """
        candidate = self.get_version_details(candidate_version)
        if not candidate:
            return {"success": False, "message": f"Version '{candidate_version}' not found."}

        passed, reason = self.evaluate_promotion_criteria(candidate_version)
        if not passed and not override:
            candidate["status"] = "rejected"
            candidate["rejection_reason"] = reason
            self._save()
            return {"success": False, "message": f"Promotion rejected: {reason}"}

        # Promote
        current_active = self.get_active_version()
        if current_active and current_active in self._data["versions"]:
            self._data["versions"][current_active]["status"] = "deprecated"
            self._data["previous_version"] = current_active

        candidate["status"] = "active"
        candidate["promoted_at"] = datetime.now(timezone.utc).isoformat()
        self._data["active_version"] = candidate_version
        self._save()

        # Update predictor singleton if model artifact exists
        if candidate.get("artifact_path") and os.path.exists(candidate["artifact_path"]):
            try:
                from ..model import SentinelModelWrapper
                from ..predictor import set_model
                loaded = SentinelModelWrapper.load(candidate["artifact_path"])
                if loaded:
                    set_model(loaded)
            except Exception:
                pass

        return {
            "success": True,
            "message": f"Model {candidate_version} successfully promoted to active.",
            "active_version": candidate_version,
            "previous_version": self._data.get("previous_version"),
        }

    def rollback(self):
        """
        Rolls back active model to previous approved version.
        """
        prev = self._data.get("previous_version")
        if not prev or prev not in self._data["versions"]:
            return {"success": False, "message": "No previous approved model version found for rollback."}

        current_active = self.get_active_version()
        if current_active and current_active in self._data["versions"]:
            self._data["versions"][current_active]["status"] = "rolled_back"

        self._data["versions"][prev]["status"] = "active"
        self._data["active_version"] = prev
        self._save()

        # Reload previous model artifact
        prev_entry = self._data["versions"][prev]
        if prev_entry.get("artifact_path") and os.path.exists(prev_entry["artifact_path"]):
            try:
                from ..model import SentinelModelWrapper
                from ..predictor import set_model
                loaded = SentinelModelWrapper.load(prev_entry["artifact_path"])
                if loaded:
                    set_model(loaded)
            except Exception:
                pass

        return {
            "success": True,
            "message": f"Successfully rolled back from {current_active} to {prev}.",
            "active_version": prev,
        }


model_registry = ModelRegistry()
