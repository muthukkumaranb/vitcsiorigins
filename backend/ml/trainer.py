"""
SENTINEL Candidate Model Trainer (Plane B).

Trains candidate models incorporating baseline telemetry and verified analyst feedback,
evaluates comparative performance, and registers candidate versions in the registry.
"""

import os
import numpy as np
from datetime import datetime

try:
    from .model import SentinelModelWrapper, MODEL_DIR
    from .features import FEATURE_NAMES
    from .training import load_dataset, build_feature_matrix
    from .dataset_builder import feedback_builder
    from .registry.model_registry import model_registry
    from .evaluator import evaluate_model_performance
except ImportError:
    from ml.model import SentinelModelWrapper, MODEL_DIR
    from ml.features import FEATURE_NAMES
    from ml.training import load_dataset, build_feature_matrix
    from ml.dataset_builder import feedback_builder
    from ml.registry.model_registry import model_registry
    from ml.evaluator import evaluate_model_performance


def train_candidate_model(version=None, description=""):
    """
    Trains a new candidate model version combining baseline dataset and verified analyst feedback.
    """
    events, users, ground_truth = load_dataset()
    X_base, y_base, _, _ = build_feature_matrix(events, users, ground_truth)

    # Ingest verified analyst feedback
    X_fbk, y_fbk, fbk_meta = feedback_builder.get_verified_training_samples()

    if len(X_fbk) > 0:
        X_combined = np.vstack([X_base, np.array(X_fbk)])
        y_combined = np.concatenate([y_base, np.array(y_fbk)])
    else:
        X_combined = X_base
        y_combined = y_base

    # Generate version identifier if not provided
    all_versions = model_registry.get_all_versions()
    if not version:
        version_num = len(all_versions) + 1
        version = f"v1.{version_num}.0-candidate"

    # Stratified split
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X_combined, y_combined, test_size=0.30, stratify=y_combined, random_state=42
    )

    # Train model wrapper
    model = SentinelModelWrapper(model_name="RandomForestClassifier", version=version)
    metadata = {
        "dataset_samples": len(X_combined),
        "feedback_samples_used": len(X_fbk),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "split_method": "stratified_70_30_feedback_augmented",
    }
    model.fit(X_train, y_train, feature_names=FEATURE_NAMES, metadata=metadata)

    # Save candidate artifact
    artifact_path = os.path.join(MODEL_DIR, f"sentinel_rf_{version.replace('.', '_').replace('-', '_')}.pkl")
    model.save(artifact_path)

    # Evaluate candidate performance
    metrics = evaluate_model_performance(model, X_test, y_test)

    # Register candidate in Model Registry
    reg_entry = model_registry.register_candidate(
        version=version,
        model_name="RandomForestClassifier",
        metrics=metrics,
        artifact_path=artifact_path,
        description=description or f"Candidate version {version} augmented with {len(X_fbk)} verified feedback records.",
    )

    # Check promotion eligibility
    can_promote, gate_reason = model_registry.evaluate_promotion_criteria(version)

    return {
        "success": True,
        "version": version,
        "metrics": metrics,
        "can_promote": can_promote,
        "gate_reason": gate_reason,
        "artifact_path": artifact_path,
        "feedback_samples_used": len(X_fbk),
        "registered_entry": reg_entry,
    }


if __name__ == "__main__":
    train_candidate_model()
