"""
data_loader.py

Loads the three frozen datasets (user_profiles, events, contexts) from CSV
into memory and exposes simple indexed lookups with thread-safe concurrency.
"""

import csv
import os
import threading
from collections import deque
from datetime import datetime, timezone

REPOSITORY_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(REPOSITORY_ROOT, "output")

EVENTS_PATH = os.path.join(DATA_DIR, "events.csv")
USERS_PATH = os.path.join(DATA_DIR, "users.csv")
CONTEXT_PATH = os.path.join(DATA_DIR, "context.csv")

MAX_LIVE_EVENTS = 500


def _parse_timestamp(value):
    """Parse an ISO-8601 timestamp string. Returns naive UTC datetime or None."""
    if not value:
        return None
    try:
        val_str = str(value).strip().replace(" ", "T")
        if val_str.endswith("Z"):
            val_str = val_str[:-1] + "+00:00"
        dt = datetime.fromisoformat(val_str)
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    except (ValueError, TypeError):
        return None



class DataStore:
    """
    Thread-safe in-memory store for the three frozen datasets and bounded live telemetry buffer.
    """

    def __init__(self, events_path=EVENTS_PATH, users_path=USERS_PATH,
                 context_path=CONTEXT_PATH, max_live_events=MAX_LIVE_EVENTS):
        self.events_path = events_path
        self.users_path = users_path
        self.context_path = context_path
        self.max_live_events = max_live_events
        self._lock = threading.RLock()

        self.events_by_id = {}
        self._baseline_event_ids = set()
        self._live_event_ids = deque(maxlen=self.max_live_events)
        self.users_by_id = {}
        self.contexts = []

        self._load()

    def _load(self):
        with self._lock:
            self.events_by_id = self._load_events(self.events_path)
            self._baseline_event_ids = set(self.events_by_id.keys())
            self._live_event_ids.clear()
            self.users_by_id = self._load_users(self.users_path)
            self.contexts = self._load_contexts(self.context_path)

    @staticmethod
    def _load_events(path):
        events_by_id = {}
        if not os.path.exists(path):
            return events_by_id
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                event_id = row.get("event_id")
                if not event_id or event_id in events_by_id:
                    continue
                row["_parsed_timestamp"] = _parse_timestamp(row.get("timestamp"))
                events_by_id[event_id] = row
        return events_by_id

    @staticmethod
    def _load_users(path):
        users_by_id = {}
        if not os.path.exists(path):
            return users_by_id
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

    def get_event(self, event_id):
        with self._lock:
            return self.events_by_id.get(event_id)

    def get_all_event_ids(self):
        with self._lock:
            return list(self.events_by_id.keys())

    def get_all_events(self):
        with self._lock:
            return [dict(e) for e in self.events_by_id.values()]

    def add_event(self, event_dict):
        """
        Dynamically ingest a single validated event into the bounded live buffer (thread-safe).
        """
        if not isinstance(event_dict, dict):
            raise ValueError("Event must be a dictionary")
        event_id = event_dict.get("event_id")
        if not event_id:
            raise ValueError("Event must contain a non-empty 'event_id'")

        item = dict(event_dict)
        if "_parsed_timestamp" not in item or item["_parsed_timestamp"] is None:
            item["_parsed_timestamp"] = _parse_timestamp(item.get("timestamp"))

        with self._lock:
            # Manage bounded buffer: evict oldest live event if limit reached
            if len(self._live_event_ids) >= self.max_live_events and event_id not in self.events_by_id:
                oldest_id = self._live_event_ids.popleft()
                if oldest_id not in self._baseline_event_ids and oldest_id in self.events_by_id:
                    del self.events_by_id[oldest_id]

            self.events_by_id[event_id] = item
            if event_id not in self._baseline_event_ids:
                self._live_event_ids.append(event_id)

        return item

    def reset_live_events(self):
        """
        Clears all dynamic live/simulated events, restoring the clean frozen baseline.
        """
        with self._lock:
            for eid in list(self._live_event_ids):
                if eid not in self._baseline_event_ids and eid in self.events_by_id:
                    del self.events_by_id[eid]
            self._live_event_ids.clear()

    def reload(self):
        """Re-read all datasets from disk (useful for tests)."""
        self._load()


# Module-level singleton
store = DataStore()
