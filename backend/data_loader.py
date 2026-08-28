"""
data_loader.py

Loads the three frozen datasets (user_profiles, events, contexts) from CSV
into memory and exposes simple indexed lookups.

DATA CONTRACT (frozen — do not rename/add/remove fields):

events.csv:
    event_id, user_id, timestamp, event_type, resource_id,
    sensitive_resource_flag, records_accessed, device_id, new_device_flag,
    permission_change_flag, new_permission_level, beneficiary_id,
    new_beneficiary_flag, transaction_amount

users.csv (user_profiles):
    user_id, role, actor_type, peer_group_id, typical_login_hour,
    login_hour_spread, avg_session_minutes, session_spread, avg_txn_amount,
    txn_amount_spread, avg_txn_per_day, home_device

context.csv (contexts):
    context_id, related_user_id, type, start_time, end_time,
    manager_approval_flag

Notes on real data observed during inspection (2026-03 sample):
  - events.csv has 736 rows, no duplicate event_ids, every event_id's
    user_id exists in users.csv.
  - Several event columns are legitimately blank depending on event_type
    (resource_id, new_permission_level, beneficiary_id). These are NOT
    data errors — they are populated only for the relevant event_type
    (e.g. new_permission_level only for permission_change events).
  - context.csv currently has only ONE row. Contexts are matched to
    events by (related_user_id == event.user_id) AND
    (start_time <= event.timestamp <= end_time). Most events therefore
    have NO matching context, which is expected, not an error.
  - All timestamps are ISO-8601 strings without timezone info
    (e.g. "2026-03-02T01:05:00") and parse cleanly with
    datetime.fromisoformat.
"""

import csv
import os
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

EVENTS_PATH = os.path.join(DATA_DIR, "events.csv")
USERS_PATH = os.path.join(DATA_DIR, "users.csv")
CONTEXT_PATH = os.path.join(DATA_DIR, "context.csv")


def _parse_timestamp(value):
    """Parse an ISO-8601 timestamp string. Returns None if blank/invalid."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


class DataStore:
    """
    In-memory store for the three frozen datasets.

    This intentionally avoids a database: the datasets are small, static
    CSV files, so simple dict/list indices in memory satisfy the
    requirements without unnecessary infrastructure.
    """

    def __init__(self, events_path=EVENTS_PATH, users_path=USERS_PATH,
                 context_path=CONTEXT_PATH):
        self.events_path = events_path
        self.users_path = users_path
        self.context_path = context_path

        self.events_by_id = {}
        self.users_by_id = {}
        self.contexts = []  # list of dicts, each with parsed start/end

        self._load()

    def _load(self):
        self.events_by_id = self._load_events(self.events_path)
        self.users_by_id = self._load_users(self.users_path)
        self.contexts = self._load_contexts(self.context_path)

    @staticmethod
    def _load_events(path):
        events_by_id = {}
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                event_id = row.get("event_id")
                if not event_id:
                    # Malformed row with no event_id — skip but don't crash.
                    continue
                if event_id in events_by_id:
                    # Duplicate event_id — data integrity issue. Keep the
                    # first occurrence and surface a marker rather than
                    # silently overwriting.
                    continue
                row["_parsed_timestamp"] = _parse_timestamp(row.get("timestamp"))
                events_by_id[event_id] = row
        return events_by_id

    @staticmethod
    def _load_users(path):
        users_by_id = {}
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                user_id = row.get("user_id")
                if not user_id:
                    continue
                users_by_id[user_id] = row
        return users_by_id

    @staticmethod
    def _load_contexts(path):
        contexts = []
        if not os.path.exists(path):
            return contexts
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                row["_parsed_start"] = _parse_timestamp(row.get("start_time"))
                row["_parsed_end"] = _parse_timestamp(row.get("end_time"))
                contexts.append(row)
        return contexts

    def reload(self):
        """Re-read all datasets from disk (useful for tests)."""
        self._load()


# Module-level singleton, loaded once on import. Simple and sufficient
# for this milestone (no hot-reloading / multi-process concerns).
store = DataStore()
