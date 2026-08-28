from backend.app import app
from backend.data_loader import store
from backend.processor import process_event



def test_audit_endpoint_returns_200_and_expected_schema():
    client = app.test_client()
    response = client.get("/api/audit")
    assert response.status_code == 200
    data = response.get_json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert isinstance(data["total"], int)
    assert data["total"] == len(store.events_by_id)
    assert len(data["items"]) == len(store.events_by_id)


def test_audit_items_have_required_fields_and_no_private_keys():
    client = app.test_client()
    response = client.get("/api/audit?limit=10")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data["items"]) == 10

    required_fields = {
        "event_id",
        "timestamp",
        "user_id",
        "event_type",
        "risk_score",
        "severity",
        "behaviour_score",
        "sequence_score",
        "context",
        "sequence",
        "signals",
        "event",
    }

    for item in data["items"]:
        assert required_fields.issubset(item.keys())
        assert 0 <= item["risk_score"] <= 100
        assert item["risk_score"] == item["risk_score"]  # Not NaN
        assert item["severity"] in {"LOW", "MODERATE", "MEDIUM", "HIGH", "CRITICAL"}
        assert "chain_detected" in item["sequence"]
        assert "status" in item["context"]
        # Ensure no private internal fields leaked
        for key in item.keys():
            assert not key.startswith("_"), f"Private key '{key}' leaked in audit item"
        for key in item["event"].keys():
            assert not key.startswith("_"), f"Private key '{key}' leaked in event object"


def test_audit_results_chronologically_ordered_by_default():
    client = app.test_client()
    response = client.get("/api/audit")
    data = response.get_json()
    items = data["items"]
    # Check descending timestamp ordering (newest first)
    for i in range(len(items) - 1):
        t1 = items[i]["timestamp"]
        t2 = items[i + 1]["timestamp"]
        assert t1 >= t2, f"Expected descending order: {t1} >= {t2}"


def test_audit_filter_by_user_id():
    client = app.test_client()
    user_id = "U023"
    response = client.get(f"/api/audit?user_id={user_id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] > 0
    for item in data["items"]:
        assert item["user_id"] == user_id


def test_audit_filter_by_severity():
    client = app.test_client()
    response = client.get("/api/audit?severity=HIGH")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] > 0
    for item in data["items"]:
        assert item["severity"] == "HIGH"


def test_audit_filter_by_event_type():
    client = app.test_client()
    response = client.get("/api/audit?event_type=login")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] > 0
    for item in data["items"]:
        assert item["event_type"] == "login"


def test_audit_pagination():
    client = app.test_client()
    response = client.get("/api/audit?limit=5&offset=10")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data["items"]) == 5
    assert data["total"] == len(store.events_by_id)


def test_audit_empty_results_on_no_match():
    client = app.test_client()
    response = client.get("/api/audit?user_id=NON_EXISTENT_USER_XYZ")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] == 0
    assert data["items"] == []


def test_audit_unknown_filters_behave_safely():
    client = app.test_client()
    response = client.get("/api/audit?unknown_foo=bar&random_param=123")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] == len(store.events_by_id)


def test_known_event_risk_and_severity_consistency():
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
