"""
Tests for SENTINEL Controlled Learning Plane (Plane B).
"""

import pytest
import os
from backend.ml.dataset_builder import FeedbackDatasetBuilder
from backend.ml.registry.model_registry import ModelRegistry
from backend.ml.trainer import train_candidate_model



def test_analyst_feedback_recording(tmp_path):
    fb_path = os.path.join(tmp_path, "test_feedback.json")
    builder = FeedbackDatasetBuilder(feedback_filepath=fb_path)

    entry1 = builder.record_feedback(
        event_id="E0408",
        user_id="U001",
        decision="CONFIRM_THREAT",
        analyst="Senior SOC Analyst",
        comment="Confirmed multi-stage attack chain.",
    )
    assert entry1["label"] == 1
    assert entry1["is_verified_label"] is True

    entry2 = builder.record_feedback(
        event_id="E0412",
        user_id="U001",
        decision="FALSE_POSITIVE",
        comment="Routine authorized admin task.",
    )
    assert entry2["label"] == 0
    assert entry2["is_verified_label"] is True

    entry3 = builder.record_feedback(
        event_id="E0402",
        user_id="U001",
        decision="NEEDS_REVIEW",
    )
    assert entry3["label"] is None
    assert entry3["is_verified_label"] is False

    # Check verified samples
    X, y, meta = builder.get_verified_training_samples()
    assert len(X) == 2
    assert len(y) == 2
    assert y == [1, 0]


def test_model_registry_lifecycle_and_promotion_gate(tmp_path):
    reg_path = os.path.join(tmp_path, "test_registry.json")
    registry = ModelRegistry(registry_filepath=reg_path)

    assert registry.get_active_version() == "v1.0.0"

    # Register candidate that meets criteria
    pass_metrics = {
        "accuracy": 0.98,
        "precision": 0.96,
        "recall": 0.95,
        "f1_score": 0.955,
        "false_positive_rate": 0.02,
        "false_negative_rate": 0.05,
    }
    registry.register_candidate(
        version="v1.1.0-candidate",
        model_name="RandomForestClassifier",
        metrics=pass_metrics,
        artifact_path="/tmp/fake_model.pkl",
    )

    can_promote, reason = registry.evaluate_promotion_criteria("v1.1.0-candidate")
    assert can_promote is True

    # Promote candidate
    prom_res = registry.promote_candidate("v1.1.0-candidate")
    assert prom_res["success"] is True
    assert registry.get_active_version() == "v1.1.0-candidate"

    # Rollback
    rb_res = registry.rollback()
    assert rb_res["success"] is True
    assert registry.get_active_version() == "v1.0.0"


def test_model_registry_rejects_substandard_candidate(tmp_path):
    reg_path = os.path.join(tmp_path, "test_registry_reject.json")
    registry = ModelRegistry(registry_filepath=reg_path)

    # Substandard candidate with poor recall (misses attacks)
    fail_metrics = {
        "accuracy": 0.99,
        "precision": 0.99,
        "recall": 0.60,  # Below 0.85
        "f1_score": 0.75,
        "false_positive_rate": 0.01,
    }
    registry.register_candidate(
        version="v1.2.0-candidate",
        model_name="RandomForestClassifier",
        metrics=fail_metrics,
        artifact_path="/tmp/fake_model.pkl",
    )

    can_promote, reason = registry.evaluate_promotion_criteria("v1.2.0-candidate")
    assert can_promote is False
    assert "Recall" in reason

    # Attempt promotion without override
    prom_res = registry.promote_candidate("v1.2.0-candidate")
    assert prom_res["success"] is False
    assert registry.get_active_version() == "v1.0.0"
