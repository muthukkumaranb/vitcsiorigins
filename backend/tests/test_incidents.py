"""
Tests for SENTINEL Incident Correlation Engine (M7).
"""

import pytest
from backend.incident_correlation import get_all_incidents, get_incident_by_id, correlate_incidents


def test_incident_correlation_produces_valid_structure():
    incidents = get_all_incidents(refresh=True)
    assert isinstance(incidents, list)
    assert len(incidents) > 0

    first = incidents[0]
    required_keys = [
        "incident_id",
        "user_id",
        "title",
        "start_time",
        "end_time",
        "event_count",
        "max_risk_score",
        "severity",
        "investigation_priority",
        "status",
        "stages",
        "events",
        "primary_indicators",
        "top_event_id",
    ]
    for k in required_keys:
        assert k in first, f"Missing required key '{k}' in incident"

    assert first["incident_id"].startswith("INC-")
    assert first["event_count"] >= 1
    assert 0.0 <= first["max_risk_score"] <= 100.0
    assert first["severity"] in ("CRITICAL", "HIGH", "MODERATE", "MEDIUM", "LOW")


def test_incident_stages_classification():
    incidents = get_all_incidents()
    for inc in incidents:
        assert len(inc["stages"]) > 0
        for stage in inc["stages"]:
            assert "stage_id" in stage
            assert "name" in stage
            assert "events" in stage
            assert len(stage["events"]) > 0


def test_get_incident_by_id():
    incidents = get_all_incidents()
    target_id = incidents[0]["incident_id"]

    found = get_incident_by_id(target_id)
    assert found is not None
    assert found["incident_id"] == target_id

    # Nonexistent incident
    assert get_incident_by_id("INC-999999") is None
