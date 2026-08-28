import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from response_workflow import (
    APPROVED,
    EXECUTED,
    FAILED,
    REJECTED,
    InvalidTransitionError,
    ResponseWorkflow,
    recommend_response,
    workflow,
)


@pytest.fixture(autouse=True)
def reset_workflow():
    workflow.clear()
    yield
    workflow.clear()


def test_recommendations_cover_all_existing_severities():
    expected = {
        "LOW": "MONITOR",
        "MODERATE": "INCREASE_MONITORING",
        "HIGH": "RECOMMEND_SESSION_TERMINATION",
        "CRITICAL": "RECOMMEND_ACCOUNT_SESSION_CONTAINMENT",
    }
    for severity, action in expected.items():
        result = recommend_response({"severity": severity, "risk_score": 10})
        assert result["recommended_action"] == action
        assert result["severity"] == severity
        assert result["risk_score"] == 10


def test_get_creates_low_recommendation():
    response = app.test_client().get("/api/events/E0412/response/")
    body = response.get_json()
    assert response.status_code == 200
    assert body["recommended_action"] == "MONITOR"
    assert body["state"] == "RECOMMENDED"
    assert body["execution_mode"] == "SIMULATED"


def test_high_event_recommends_session_controls():
    body = app.test_client().get("/api/events/E0408/response/").get_json()
    assert body["severity"] == "HIGH"
    assert body["recommended_action"] == "RECOMMEND_SESSION_TERMINATION"
    assert "RECOMMEND_TEMPORARY_ACCESS_RESTRICTION" in body["recommended_actions"]


def test_approval_records_actor_and_timestamp():
    response = app.test_client().post("/api/events/E0408/response/", json={"decision": "APPROVE"})
    body = response.get_json()
    assert response.status_code == 200
    assert body["state"] == APPROVED
    assert body["actor"] == "mvp-analyst"
    assert body["decided_at"]


def test_rejection_cannot_execute():
    client = app.test_client()
    client.post("/api/events/E0412/response/", json={"decision": "REJECT"})
    response = client.post("/api/events/E0412/response/", json={"decision": "EXECUTE"})
    assert response.status_code == 409
    assert response.get_json()["error"] == "invalid_transition"
    assert workflow.get_or_create("E0412").state == REJECTED


def test_approved_response_executes_once():
    client = app.test_client()
    client.post("/api/events/E0412/response/", json={"decision": "APPROVE"})
    response = client.post("/api/events/E0412/response/", json={"decision": "EXECUTE"})
    assert response.status_code == 200
    assert response.get_json()["state"] == EXECUTED
    assert client.post("/api/events/E0412/response/", json={"decision": "APPROVE"}).status_code == 409
    assert client.post("/api/events/E0412/response/", json={"decision": "EXECUTE"}).status_code == 409


def test_failed_execution_is_recorded():
    failed_workflow = ResponseWorkflow(executor=lambda record: False)
    record = failed_workflow.decide("E0412", "APPROVE")
    assert record.state == APPROVED
    record = failed_workflow.execute("E0412")
    assert record.state == FAILED
    assert record.execution_status == "SIMULATED_FAILURE"


def test_audit_sink_receives_workflow_events():
    audit_events = []
    sink = type("Sink", (), {"record": lambda self, name, response: audit_events.append(name)})()
    audited_workflow = ResponseWorkflow(audit_sink=sink)
    audited_workflow.decide("E0412", "APPROVE")
    audited_workflow.execute("E0412")
    assert audit_events == ["RESPONSE_RECOMMENDED", "RESPONSE_APPROVED", "RESPONSE_EXECUTED"]


def test_invalid_requests_and_unknown_events():
    client = app.test_client()
    assert client.get("/api/events/E999999/response/").status_code == 404
    assert client.post("/api/events/E0412/response/", json={}).status_code == 400
    assert client.post("/api/events/E0412/response/", json={"decision": "EXECUTED"}).status_code == 400
    assert client.post("/api/events/E0412/response/", data="not-json", content_type="application/json").status_code == 400


def test_repeated_get_returns_same_response_record():
    client = app.test_client()
    first = client.get("/api/events/E0412/response/").get_json()
    second = client.get("/api/events/E0412/response/").get_json()
    assert first["response_id"] == second["response_id"]
    assert first["created_at"] == second["created_at"]


def test_invalid_transition_is_rejected_by_service():
    record = workflow.decide("E0412", "APPROVE")
    with pytest.raises(InvalidTransitionError):
        workflow.decide(record.event_id, "APPROVE")
