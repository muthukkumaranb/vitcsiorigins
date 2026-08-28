"""
Tests for SENTINEL Live Telemetry Simulation and Unified Ingestion (Plane A).
"""

import pytest
from backend.telemetry.event_generator import EventGenerator
from backend.telemetry.scenarios import SCENARIOS
from backend.telemetry.simulator import TelemetrySimulator
from backend.processor import ingest_and_process_event, process_event
from backend.data_loader import store


def test_event_generator_creates_valid_schema():
    gen = EventGenerator()
    normal_evt = gen.generate_normal_event()

    required_keys = [
        "event_id",
        "user_id",
        "timestamp",
        "event_type",
        "sensitive_resource_flag",
        "records_accessed",
        "new_device_flag",
        "permission_change_flag",
        "new_beneficiary_flag",
        "transaction_amount",
    ]
    for key in required_keys:
        assert key in normal_evt, f"Missing required key '{key}'"

    assert normal_evt["event_id"].startswith("SIM-")
    assert normal_evt["event_type"] in ["login", "file_access", "transaction", "logout"]


def test_scenario_progression_advances_stages():
    gen = EventGenerator()
    # Execute 5 stages of privilege abuse
    stages_seen = []
    for _ in range(5):
        evt = gen.generate_scenario_event("privilege_abuse", user={"user_id": "U_TEST", "avg_txn_amount": "5000"})
        stages_seen.append(evt.get("_stage"))

    assert stages_seen == [1, 2, 3, 4, 5]


def test_unified_ingest_and_process_event():
    gen = EventGenerator()
    test_evt = gen.generate_normal_event()

    result = ingest_and_process_event(test_evt)
    assert result["success"] is True
    assert result["event_id"] == test_evt["event_id"]
    assert "assessment" in result
    assert result["assessment"]["event_id"] == test_evt["event_id"]
    assert 0.0 <= result["assessment"]["risk_score"] <= 100.0


def test_simulator_lifecycle_and_state_management():
    sim = TelemetrySimulator()
    status = sim.get_status()
    assert status["state"] in {"idle", "stopped"}
    assert status["enabled"] is False

    # Start simulation
    sim.start(mode="normal_activity", interval_ms=1000)
    assert sim.get_status()["state"] in {"starting", "running"}

    # Step simulation manually
    step_res = sim.step()
    assert step_res["success"] is True
    assert sim.get_status()["events_generated"] >= 1

    # Pause simulation
    sim.pause()
    assert sim.get_status()["state"] == "paused"

    # Reset simulation
    sim.reset()
    assert sim.get_status()["state"] in {"idle", "stopped"}
    assert sim.get_status()["events_generated"] == 0

