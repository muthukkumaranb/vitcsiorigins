from backend.app import app
from backend.data_loader import store
from backend.processor import calculate_behaviour, calculate_sequence, get_context, get_event, process_event, EventNotFoundError, classify_severity



def test_normal_event_is_low():
    result = process_event("E0412")
    assert result["severity"] == "LOW"
    assert 0 <= result["risk_score"] < 25


def test_behaviour_anomaly_has_explainable_signals():
    result = process_event("E0404")
    names = {signal["signal"] for signal in result["signals"]}
    assert result["behaviour_score"] > 0
    assert {"SENSITIVE_ACCESS", "LARGE_DATA_ACCESS"}.issubset(names)


def test_sequence_detects_insider_chain():
    result = process_event("E0408")
    assert result["sequence_score"] > 0
    assert result["sequence"]["chain_detected"] is True
    assert result["sequence"]["matched_steps"][-1]["step"] == "DATA_EXPORT"


def test_context_matches_user_and_time():
    result = process_event("E0402")
    assert result["context"]["status"] == "found"
    assert result["context_multiplier"] == 0.8


def test_context_outside_window_is_absent():
    result = process_event("E0001")
    assert result["context"]["status"] == "no_context_found"
    assert result["context_multiplier"] == 1.0


def test_context_suppresses_without_zeroing():
    result = process_event("E0402")
    raw = combine_without_context(result["behaviour_score"], result["sequence_score"])
    assert 0 < result["risk_score"] < raw


def combine_without_context(behaviour_score, sequence_score):
    return round(min(100.0, max(0.0, behaviour_score * 0.6 + sequence_score * 0.4)), 2)


def test_risk_is_bounded_and_finite():
    for event_id in ("E0402", "E0404", "E0407", "E0408", "E0412"):
        score = process_event(event_id)["risk_score"]
        assert 0 <= score <= 100
        assert score == score


def test_missing_event_raises_and_api_returns_404():
    try:
        process_event("E999999")
        assert False
    except EventNotFoundError:
        pass
    response = app.test_client().get("/api/events/E999999/risk/")
    assert response.status_code == 404
    assert response.get_json()["error"] == "event_not_found"


def test_no_ground_truth_in_runtime_loader():
    assert "ground_truth" not in store.events_path.lower()
    assert "ground_truth" not in store.users_path.lower()
    assert "ground_truth" not in store.context_path.lower()


def test_required_response_fields_are_deterministic():
    result = process_event("E0408")
    for field in ("event_id", "user_id", "behaviour_score", "sequence_score", "context_multiplier", "risk_score", "severity", "signals", "risk_breakdown", "sequence", "context"):
        assert field in result
    assert isinstance(result["signals"], list)
    assert isinstance(result["risk_breakdown"], dict)


def test_severity_boundaries():
    assert classify_severity(24) == "LOW"

    assert classify_severity(25) == "MODERATE"
    assert classify_severity(49) == "MODERATE"
    assert classify_severity(50) == "HIGH"
    assert classify_severity(74) == "HIGH"
    assert classify_severity(75) == "CRITICAL"
    assert classify_severity(100) == "CRITICAL"


def test_future_events_do_not_affect_current_sequence():
    event = dict(store.events_by_id["E0404"])
    future = dict(store.events_by_id["E0408"])
    future["_parsed_timestamp"] = event["_parsed_timestamp"] + __import__("datetime").timedelta(minutes=1)
    result_without_future = calculate_sequence(event, store.users_by_id[event["user_id"]], [])
    result_with_future = calculate_sequence(event, store.users_by_id[event["user_id"]], [future])
    assert result_with_future == result_without_future


def test_partial_and_wrong_order_sequences_are_not_complete():
    event = dict(store.events_by_id["E0404"])
    user = store.users_by_id[event["user_id"]]
    partial = calculate_sequence(event, user, [store.events_by_id["E0403"]])
    assert partial["sequence_score"] > 0
    assert partial["chain_detected"] is False
    wrong_order = calculate_sequence(event, user, [store.events_by_id["E0405"]])
    assert wrong_order["chain_detected"] is False


def test_collection_endpoints_return_live_data():
    client = app.test_client()
    health = client.get("/api/health").get_json()
    alerts = client.get("/api/alerts").get_json()
    identities = client.get("/api/identities").get_json()
    assert health["events"] == len(store.events_by_id)
    assert health["contexts"] == len(store.contexts)
    assert len(identities) == len(store.users_by_id)
    assert len(alerts) > 0
    assert all(alerts[index]["risk_score"] >= alerts[index + 1]["risk_score"] for index in range(len(alerts) - 1))
