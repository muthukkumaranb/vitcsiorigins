"""
SENTINEL ML Predictor Module.

Provides runtime inference for security telemetry events, with automatic model
loading, feature extraction, probability calibration, and graceful fallback.
"""

import os
from .features import extract_features, extract_features_dict, FEATURE_NAMES
from .model import SentinelModelWrapper, DEFAULT_MODEL_PATH

_GLOBAL_MODEL = None


def get_model(reload=False):
    """
    Singleton accessor for the loaded ML model.
    """
    global _GLOBAL_MODEL
    if _GLOBAL_MODEL is None or reload:
        _GLOBAL_MODEL = SentinelModelWrapper.load(DEFAULT_MODEL_PATH)
    return _GLOBAL_MODEL


def set_model(model_wrapper):
    """
    Explicitly set the active model instance (e.g. during training/testing).
    """
    global _GLOBAL_MODEL
    _GLOBAL_MODEL = model_wrapper


def is_ml_available():
    """
    Check whether an ML model is active and ready for inference.
    """
    model = get_model()
    return model is not None and model.is_loaded()


def classify_probability_severity(prob):
    if prob >= 0.75:
        return "CRITICAL"
    if prob >= 0.50:
        return "HIGH"
    if prob >= 0.25:
        return "MODERATE"
    return "LOW"


def predict_event(event, user=None, history=None):
    """
    Runs ML prediction on a single telemetry event.

    Returns:
        dict: Structured prediction dictionary with probability, prediction,
              contributing features, and status.
    """
    features_dict = extract_features_dict(event, user, history)
    feature_vec = [features_dict[name] for name in FEATURE_NAMES]

    model = get_model()
    if model is None or not model.is_loaded():
        return {
            "status": "unavailable",
            "message": "Machine learning detection model is not loaded. Deterministic baseline active.",
            "attack_probability": None,
            "prediction": None,
            "severity": None,
            "confidence": None,
            "model_name": None,
            "model_version": None,
            "features": features_dict,
            "contributing_features": [],
        }

    try:
        import numpy as np
        X = np.array([feature_vec])
        proba = float(model.predict_proba(X)[0])
        pred = int(proba >= 0.5)

        # Identify top active contributing features (features with value > 0)
        contributing = []
        for name in FEATURE_NAMES:
            val = features_dict.get(name, 0.0)
            if val > 0:
                contributing.append({
                    "feature": name,
                    "value": val,
                    "importance": round(val, 2),
                })
        contributing.sort(key=lambda x: x["value"], reverse=True)

        return {
            "status": "active",
            "attack_probability": round(proba, 4),
            "prediction": pred,
            "severity": classify_probability_severity(proba),
            "confidence": round(abs(proba - 0.5) * 2.0, 4),  # 0.0 at decision boundary, 1.0 at extremes
            "model_name": model.model_name,
            "model_version": model.version,
            "features": features_dict,
            "contributing_features": contributing,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"ML prediction failed: {str(e)}",
            "attack_probability": None,
            "prediction": None,
            "severity": None,
            "confidence": None,
            "model_name": getattr(model, "model_name", "Unknown"),
            "model_version": getattr(model, "version", "1.0.0"),
            "features": features_dict,
            "contributing_features": [],
        }
