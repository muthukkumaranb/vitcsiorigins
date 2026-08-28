"""
Unit tests for SENTINEL AI Investigation Copilot (Ollama LLM Client & Integration).
Ensures fail-closed robustness, grounding prompt sanitization, endpoint caching, and error resilience.
"""

import json
from unittest.mock import patch, MagicMock
import pytest
import requests

from backend.app import app, _NARRATIVE_CACHE
from backend.processor import process_event
from backend.incident_correlation import get_all_incidents
from backend.llm.prompts import sanitize_payload, build_user_prompt, SYSTEM_PROMPT
from backend.llm.ollama_client import generate_narrative


def test_sanitize_payload_strips_private_fields():
    dirty_payload = {
        "event_id": "E0408",
        "_parsed_timestamp": "2026-08-28 10:00:00",
        "user_id": "U0042",
        "nested": {
            "_internal_id": 1234,
            "signal": "NEW_DEVICE",
            "_matching_context_ids": ["CTX-01"]
        },
        "items": [
            {"name": "test", "_hidden": True},
            {"clean": "value"}
        ]
    }

    clean = sanitize_payload(dirty_payload)
    assert "_parsed_timestamp" not in clean
    assert clean["event_id"] == "E0408"
    assert "_internal_id" not in clean["nested"]
    assert "_matching_context_ids" not in clean["nested"]
    assert clean["nested"]["signal"] == "NEW_DEVICE"
    assert "_hidden" not in clean["items"][0]
    assert clean["items"][0]["name"] == "test"
    assert clean["items"][1]["clean"] == "value"


def test_build_user_prompt_structure():
    payload = {"event_id": "E0408", "severity": "HIGH", "_secret": "hide_me"}
    prompt_str = build_user_prompt(payload, kind="event")
    parsed = json.loads(prompt_str)

    assert parsed["kind"] == "event"
    assert parsed["data"]["event_id"] == "E0408"
    assert parsed["data"]["severity"] == "HIGH"
    assert "_secret" not in parsed["data"]


@patch("backend.llm.ollama_client.requests.post")
def test_generate_narrative_success(mock_post):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "message": {
            "role": "assistant",
            "content": "User U0042 triggered multiple high-risk behavioural signals.\n\nRecommended next checks:\n• Check device logs\n• Review supervisor approval"
        }
    }
    mock_post.return_value = mock_resp

    payload = {"event_id": "E0408", "severity": "HIGH"}
    res = generate_narrative(payload, kind="event")

    assert res["narrative_status"] == "ok"
    assert "User U0042" in res["narrative"]
    assert res["model"] == "llama3.1:8b"
    assert res["error"] is None


@patch("backend.llm.ollama_client.requests.post")
def test_generate_narrative_connection_error_fail_closed(mock_post):
    mock_post.side_effect = requests.exceptions.ConnectionError("Connection refused to localhost:11434")

    payload = {"event_id": "E0408", "severity": "HIGH"}
    res = generate_narrative(payload, kind="event")

    assert res["narrative_status"] == "unavailable"
    assert res["narrative"] is None
    assert "Connection refused" in res["error"]


@patch("backend.llm.ollama_client.requests.post")
def test_generate_narrative_timeout_fail_closed(mock_post):
    mock_post.side_effect = requests.exceptions.Timeout("Request timed out after 3.0s")

    payload = {"event_id": "E0408", "severity": "HIGH"}
    res = generate_narrative(payload, kind="event")

    assert res["narrative_status"] == "unavailable"
    assert res["narrative"] is None
    assert "timed out" in res["error"]


@patch("backend.llm.ollama_client.requests.post")
def test_generate_narrative_malformed_json_fail_closed(mock_post):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.side_effect = ValueError("Invalid JSON")
    mock_post.return_value = mock_resp

    payload = {"event_id": "E0408", "severity": "HIGH"}
    res = generate_narrative(payload, kind="event")

    assert res["narrative_status"] == "unavailable"
    assert res["narrative"] is None


@patch("backend.llm.ollama_client.requests.post")
def test_generate_narrative_http_500_fail_closed(mock_post):
    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error in Ollama engine"
    mock_post.return_value = mock_resp

    payload = {"event_id": "E0408", "severity": "HIGH"}
    res = generate_narrative(payload, kind="event")

    assert res["narrative_status"] == "unavailable"
    assert res["narrative"] is None
    assert "HTTP 500" in res["error"]


def test_event_narrative_endpoint_404_for_missing_event():
    client = app.test_client()
    resp = client.get("/api/events/E999999/narrative")
    assert resp.status_code == 404
    data = resp.get_json()
    assert data["error"] == "event_not_found"


@patch("backend.app.generate_narrative")
def test_event_narrative_endpoint_with_cache(mock_generate):
    _NARRATIVE_CACHE.clear()
    mock_generate.return_value = {
        "narrative_status": "ok",
        "narrative": "Synthesized benchmark investigation summary.",
        "model": "llama3.1:8b",
        "error": None
    }

    client = app.test_client()
    resp1 = client.get("/api/events/E0408/narrative")
    assert resp1.status_code == 200
    data1 = resp1.get_json()
    assert data1["narrative_status"] == "ok"
    assert data1["cached"] is False
    assert mock_generate.call_count == 1

    # Second call should hit the in-memory cache
    resp2 = client.get("/api/events/E0408/narrative")
    assert resp2.status_code == 200
    data2 = resp2.get_json()
    assert data2["narrative_status"] == "ok"
    assert data2["cached"] is True
    assert mock_generate.call_count == 1  # Not called again


@patch("backend.app.generate_narrative")
def test_incident_narrative_endpoint(mock_generate):
    _NARRATIVE_CACHE.clear()
    incidents = get_all_incidents()
    if not incidents:
        pytest.skip("No incidents generated in test dataset")

    test_inc = incidents[0]
    inc_id = test_inc["incident_id"]

    mock_generate.return_value = {
        "narrative_status": "ok",
        "narrative": f"Incident {inc_id} involves multi-stage progression across security stages.",
        "model": "llama3.1:8b",
        "error": None
    }

    client = app.test_client()
    resp = client.get(f"/api/incidents/{inc_id}/narrative")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["narrative_status"] == "ok"
    assert inc_id in data["narrative"]


@patch("backend.processor.generate_narrative")
def test_process_event_with_narrative_flag(mock_generate):
    mock_generate.return_value = {
        "narrative_status": "ok",
        "narrative": "Inline narrative generated on demand.",
        "model": "llama3.1:8b"
    }

    # Fast default scoring: no LLM call
    res_fast = process_event("E0408", with_narrative=False)
    assert mock_generate.call_count == 0
    assert "narrative" not in res_fast

    # On-demand opt-in: calls LLM
    res_with_nar = process_event("E0408", with_narrative=True)
    assert mock_generate.call_count == 1
    assert res_with_nar["narrative_status"] == "ok"
    assert res_with_nar["narrative"] == "Inline narrative generated on demand."
