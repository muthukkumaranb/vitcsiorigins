"""
test_processor.py

Run with:  python -m pytest tests/ -v
(or:       python tests/test_processor.py   to run standalone)

Uses real IDs from the provided datasets:
  - E000001 : valid event, user U006, no matching context (outside the
              one known context window) -> Test 1
  - E000664 : valid event, user U002, timestamp 2026-03-11T02:19:00 falls
              inside CTX_SCEN_SUPPRESSED_01's window
              (2026-03-11T01:43:00 - 2026-03-11T04:13:00) -> context match
  - E000684 : same user U002, later the same day, OUTSIDE the context
              window -> confirms context matching isn't just "any event
              from that user"
  - E999999 : does not exist -> Test 2
  - Test 3 (user profile missing) is simulated by injecting a synthetic
    event into the in-memory store, since every real event in the
    provided dataset happens to reference a valid user.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_loader import store
from processor import process_event, get_event, get_user_profile, get_context, EventNotFoundError


def test_1_valid_event_no_context():
    result = process_event("E000001")
    assert result["event_id"] == "E000001"
    assert result["user_id"] == "U006"
    assert result["user_status"] == "found"
    assert result["context_status"] == "no_context_found"
    assert result["risk_score"] == 0.0
    assert result["severity"] == "LOW"
    print("Test 1 PASSED:", result)


def test_1b_valid_event_with_matching_context():
    result = process_event("E000664")
    assert result["user_id"] == "U002"
    assert result["context_status"] == "found"
    assert result["_debug"]["context"]["context_id"] == "CTX_SCEN_SUPPRESSED_01"
    print("Test 1b PASSED (context matched):", result["_debug"]["context"])


def test_1c_same_user_outside_context_window():
    result = process_event("E000684")
    assert result["user_id"] == "U002"
    assert result["context_status"] == "no_context_found"
    print("Test 1c PASSED (context correctly NOT matched outside window)")


def test_2_invalid_event_id():
    try:
        process_event("E999999")
        raise AssertionError("Expected EventNotFoundError")
    except EventNotFoundError as e:
        assert e.event_id == "E999999"
        print("Test 2 PASSED: EventNotFoundError raised as expected")


def test_3_event_with_missing_user():
    # Inject a synthetic event referencing a user that does not exist,
    # to prove the backend handles this without crashing. Cleaned up
    # afterwards so it doesn't pollute other tests.
    fake_id = "E_TEST_MISSING_USER"
    store.events_by_id[fake_id] = {
        "event_id": fake_id,
        "user_id": "U_DOES_NOT_EXIST",
        "timestamp": "2026-03-02T01:05:00",
        "event_type": "login",
        "_parsed_timestamp": None,
    }
    try:
        result = process_event(fake_id)
        assert result["user_status"] == "not_found"
        assert result["user_id"] == "U_DOES_NOT_EXIST"
        print("Test 3 PASSED:", result)
    finally:
        del store.events_by_id[fake_id]


def test_get_functions_directly():
    event = get_event("E000001")
    assert event is not None
    user = get_user_profile(event["user_id"])
    assert user is not None
    context = get_context(event)
    assert context is None  # E000001 has no matching context
    print("Direct get_* function tests PASSED")


if __name__ == "__main__":
    test_1_valid_event_no_context()
    test_1b_valid_event_with_matching_context()
    test_1c_same_user_outside_context_window()
    test_2_invalid_event_id()
    test_3_event_with_missing_user()
    test_get_functions_directly()
    print("\nAll tests passed.")
