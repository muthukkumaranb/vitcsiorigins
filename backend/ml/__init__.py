"""
SENTINEL Machine Learning (ML) Package.
"""

from .features import extract_features, extract_features_dict, FEATURE_NAMES
from .model import SentinelModelWrapper, DEFAULT_MODEL_PATH
from .predictor import predict_event, is_ml_available, get_model, set_model
from .fusion import (
    calculate_hybrid_risk,
    calculate_deterministic_risk,
    classify_severity,
    generate_explainability_summary,
)

__all__ = [
    "extract_features",
    "extract_features_dict",
    "FEATURE_NAMES",
    "SentinelModelWrapper",
    "DEFAULT_MODEL_PATH",
    "predict_event",
    "is_ml_available",
    "get_model",
    "set_model",
    "calculate_hybrid_risk",
    "calculate_deterministic_risk",
    "classify_severity",
    "generate_explainability_summary",
]
