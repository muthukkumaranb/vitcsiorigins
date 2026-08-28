"""
Tests for SENTINEL Machine Learning (ML) Subsystem (M3-M6).
"""

import pytest
from backend.ml.features import extract_features, extract_features_dict, FEATURE_NAMES
from backend.ml.model import SentinelModelWrapper
from backend.ml.predictor import predict_event, is_ml_available, get_model
from backend.ml.fusion import calculate_hybrid_risk, calculate_deterministic_risk, generate_explainability_summary
from backend.processor import process_event


def test_feature_vector_dimensions_and_names():
    sample_event = {
        "event_id": "TEST_001",
        "event_type": "login",
        "timestamp": "2026-03-02T02:00:00",
        "new_device_flag": 1,
        "sensitive_resource_flag": 0,
        "records_accessed": 0,
        "permission_change_flag": 0,
        "new_beneficiary_flag": 0,
        "transaction_amount": 0.0,
    }
    sample_user = {
        "typical_login_hour": 9.0,
        "login_hour_spread": 1.0,
        "avg_txn_amount": 100.0,
        "txn_amount_spread": 50.0,
        "avg_txn_per_day": 1.0,
    }

    vec = extract_features(sample_event, sample_user)
    assert len(vec) == len(FEATURE_NAMES)
    assert len(vec) == 10
    for val in vec:
        assert isinstance(val, (int, float))
        assert 0.0 <= val <= 1.0

    feat_dict = extract_features_dict(sample_event, sample_user)
    assert set(feat_dict.keys()) == set(FEATURE_NAMES)


def test_predictor_response_structure_on_known_event():
    result = process_event("E0408")
    assert "ml_assessment" in result
    assert "hybrid_risk" in result
    assert "explainability_factors" in result

    ml = result["ml_assessment"]
    assert "status" in ml
    assert "features" in ml
    assert len(ml["features"]) == 10

    if ml["status"] == "active":
        assert ml["attack_probability"] is not None
        assert 0.0 <= ml["attack_probability"] <= 1.0
        assert ml["prediction"] in (0, 1)
        assert ml["model_name"] is not None

    hybrid = result["hybrid_risk"]
    assert "hybrid_score" in hybrid
    assert 0.0 <= hybrid["hybrid_score"] <= 100.0
    assert "fusion_mode" in hybrid
    assert "weights" in hybrid


def test_hybrid_risk_formula_bounds_and_weights():
    # When ML prob is 0.80, Behaviour 50, Sequence 50, Context 1.0
    # Hybrid = (50 * 0.45 + 50 * 0.30 + 80 * 0.25) * 1.0 = (22.5 + 15.0 + 20.0) = 57.5
    res = calculate_hybrid_risk(50.0, 50.0, 0.80, 1.0)
    assert res["hybrid_score"] == 57.5
    assert res["fusion_mode"] == "hybrid_fusion_v1"
    assert res["weights"]["ml"] == 0.25

    # Fallback when ML is None
    fallback = calculate_hybrid_risk(50.0, 50.0, None, 1.0)
    assert fallback["hybrid_score"] == 50.0
    assert fallback["fusion_mode"] == "deterministic_fallback"
    assert fallback["weights"]["ml"] == 0.0

    # Bounds check
    over_res = calculate_hybrid_risk(100.0, 100.0, 1.0, 1.5)
    assert over_res["hybrid_score"] == 100.0


def test_explainability_summary_generation():
    signals = [{"signal": "UNUSUAL_LOGIN", "contribution": 15.0, "description": "Login time deviates."}]
    seq = {"chain_detected": True, "matched_steps": [1, 2, 3]}
    context = {"status": "matched"}
    ml = {"status": "active", "attack_probability": 0.85}

    factors = generate_explainability_summary(signals, seq, context, ml)
    assert len(factors) >= 4
    assert any("Login time deviates" in f for f in factors)
    assert any("Attack Chain Detected" in f for f in factors)
    assert any("Approved Operational Context" in f for f in factors)
    assert any("ML Classifier" in f for f in factors)


def test_deterministic_benchmarks_strictly_preserved():
    # E0412 -> 6.67 LOW
    r412 = process_event("E0412")
    assert r412["risk_score"] == 6.67
    assert r412["severity"] == "LOW"

    # E0408 -> 55.0 HIGH
    r408 = process_event("E0408")
    assert r408["risk_score"] == 55.0
    assert r408["severity"] == "HIGH"

    # E0402 -> 22.67 LOW
    r402 = process_event("E0402")
    assert r402["risk_score"] == 22.67
    assert r402["severity"] == "LOW"
