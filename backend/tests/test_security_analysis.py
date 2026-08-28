import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from data_loader import store
from analyzer import get_security_analysis, get_analytics_data
from processor import process_event


def test_security_analysis_endpoint_returns_200_and_expected_schema():
    client = app.test_client()
    response = client.get("/api/security-analysis")
    assert response.status_code == 200
    data = response.get_json()

    required_keys = {
        "behavioural_trust_score",
        "active_threats",
        "privileged_identities",
        "events_analyzed",
        "threat_severity_counts",
        "trust_landscape",
        "live_stream",
        "top_identities",
    }
    assert required_keys.issubset(data.keys())
    assert data["events_analyzed"] == len(store.events_by_id)
    assert 0 <= data["behavioural_trust_score"] <= 100


def test_trust_over_time_structure_and_bounds():
    analysis = get_security_analysis()
    landscape = analysis["trust_landscape"]
    assert len(landscape) > 0

    for pt in landscape:
        assert "timestamp" in pt
        assert "trust_score" in pt
        assert "anomaly_count" in pt
        assert 0 <= pt["trust_score"] <= 100
        assert pt["trust_score"] == pt["trust_score"]  # Not NaN
        assert pt["anomaly_count"] >= 0

    # Verify chronological ordering
    timestamps = [pt["timestamp"] for pt in landscape]
    assert timestamps == sorted(timestamps)


def test_live_behaviour_stream_structure():
    analysis = get_security_analysis()
    stream = analysis["live_stream"]
    assert len(stream) > 0

    for item in stream:
        assert "event_id" in item
        assert "user_id" in item
        assert "timestamp" in item
        assert "event_type" in item
        assert "risk_level" in item
        assert "risk_score" in item
        assert 0 <= item["risk_score"] <= 100
        assert item["risk_level"] in {"LOW", "MODERATE", "MEDIUM", "HIGH", "CRITICAL"}
        for k in item.keys():
            assert not k.startswith("_"), f"Internal key {k} exposed in live stream"


def test_identities_ranking_and_metrics():
    analysis = get_security_analysis()
    identities = analysis["top_identities"]
    assert len(identities) == len(store.users_by_id)

    # Top identity should have highest risk
    for i in range(len(identities) - 1):
        assert identities[i]["risk_score"] >= identities[i + 1]["risk_score"]

    for ident in identities:
        assert 0 <= ident["risk_score"] <= 100
        assert 0 <= ident["trust_score"] <= 100
        assert ident["event_count"] >= 0
        assert ident["high_risk_events"] >= 0
        for k in ident.keys():
            assert not k.startswith("_"), f"Internal key {k} exposed in identity"


def test_analytics_endpoint_returns_200_and_valid_data():
    client = app.test_client()
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.get_json()

    assert "events_analyzed" in data
    assert "anomalies_detected" in data
    assert "risk_by_role" in data
    assert "risk_by_account_type" in data
    assert "anomalies_trend" in data
    assert "model_stats" in data
    assert data["events_analyzed"] == len(store.events_by_id)


def test_events_endpoint():
    client = app.test_client()
    response = client.get("/api/events")
    assert response.status_code == 200
    events = response.get_json()
    assert isinstance(events, list)
    assert len(events) > 0


def test_no_ground_truth_in_security_analysis():
    analysis = get_security_analysis()
    raw_str = str(analysis)
    assert "ground_truth" not in raw_str.lower()
    assert "is_attack" not in raw_str.lower()
    assert "scenario_id" not in raw_str.lower()


def test_existing_benchmark_scores_preserved():
    # E0412 -> 6.67 LOW
    # E0408 -> 55.0 HIGH
    # E0402 -> 22.67 LOW
    e0412 = process_event("E0412")
    assert e0412["risk_score"] == 6.67
    assert e0412["severity"] == "LOW"

    e0408 = process_event("E0408")
    assert e0408["risk_score"] == 55.0
    assert e0408["severity"] == "HIGH"

    e0402 = process_event("E0402")
    assert e0402["risk_score"] == 22.67
    assert e0402["severity"] == "LOW"

    client = app.test_client()
    res_404 = client.get("/api/events/E999999/risk/")
    assert res_404.status_code == 404
