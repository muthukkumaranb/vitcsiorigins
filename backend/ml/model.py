"""
SENTINEL ML Model Wrapper & Persistence Module.

Provides an abstract, robust interface for machine learning classifiers
used in attack detection, with model persistence and lightweight fallback.
"""

import os
import pickle
from datetime import datetime

try:
    from sklearn.ensemble import RandomForestClassifier
except ImportError:
    RandomForestClassifier = None

MODEL_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
DEFAULT_MODEL_PATH = os.path.join(MODEL_DIR, "sentinel_rf_model.pkl")


class SentinelModelWrapper:
    """
    Standardized wrapper around the underlying ML classifier.
    """

    def __init__(self, classifier=None, model_name="RandomForestClassifier", version="1.0.0"):
        self.classifier = classifier
        self.model_name = model_name
        self.version = version
        self.trained_at = None
        self.feature_names = []
        self.training_metadata = {}

    def is_loaded(self):
        return self.classifier is not None

    def fit(self, X, y, feature_names=None, metadata=None):
        if RandomForestClassifier is None:
            raise RuntimeError("scikit-learn is required to train the SENTINEL ML model.")

        if self.classifier is None:
            self.classifier = RandomForestClassifier(
                n_estimators=50,
                max_depth=6,
                min_samples_split=4,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=42,
            )

        self.classifier.fit(X, y)
        self.trained_at = datetime.utcnow().isoformat() + "Z"
        self.feature_names = feature_names or []
        self.training_metadata = metadata or {}
        return self

    def predict_proba(self, X):
        """
        Returns an array of attack probabilities (class 1).
        """
        if not self.is_loaded():
            raise RuntimeError("ML model is not loaded.")
        probas = self.classifier.predict_proba(X)
        # Class 1 is attack probability
        if probas.shape[1] > 1:
            return probas[:, 1]
        return probas[:, 0]

    def predict(self, X, threshold=0.5):
        probas = self.predict_proba(X)
        return (probas >= threshold).astype(int)

    def save(self, filepath=DEFAULT_MODEL_PATH):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        payload = {
            "classifier": self.classifier,
            "model_name": self.model_name,
            "version": self.version,
            "trained_at": self.trained_at,
            "feature_names": self.feature_names,
            "training_metadata": self.training_metadata,
        }
        with open(filepath, "wb") as f:
            pickle.dump(payload, f)
        return filepath

    @classmethod
    def load(cls, filepath=DEFAULT_MODEL_PATH):
        if not os.path.exists(filepath):
            return None
        try:
            with open(filepath, "rb") as f:
                payload = pickle.load(f)
            wrapper = cls(
                classifier=payload.get("classifier"),
                model_name=payload.get("model_name", "RandomForestClassifier"),
                version=payload.get("version", "1.0.0"),
            )
            wrapper.trained_at = payload.get("trained_at")
            wrapper.feature_names = payload.get("feature_names", [])
            wrapper.training_metadata = payload.get("training_metadata", {})
            return wrapper
        except Exception:
            return None
