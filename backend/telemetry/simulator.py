"""
SENTINEL Live Telemetry Simulator Engine.

Provides an asynchronous background worker that generates synthetic security
events and pipes them into the single ingestion pipeline.
"""

import threading
import time
from datetime import datetime

try:
    from .event_generator import EventGenerator
    from .scenarios import SCENARIOS
    from ..processor import ingest_and_process_event
    from ..data_loader import store
except ImportError:
    from telemetry.event_generator import EventGenerator
    from telemetry.scenarios import SCENARIOS
    from processor import ingest_and_process_event
    from data_loader import store


class TelemetrySimulator:
    """
    Thread-safe live telemetry simulator with start/pause/stop/reset state management.
    States: 'idle', 'starting', 'running', 'paused', 'stopping', 'error'
    """

    def __init__(self):
        self.generator = EventGenerator()
        self.state = "idle"
        self.mode = "mixed"
        self.interval_ms = 2000
        self.events_generated = 0
        self.alerts_triggered = 0
        self.last_event_timestamp = None
        self.last_event_id = None
        self._thread = None
        self._lock = threading.Lock()
        self._step_lock = threading.Lock()

    def get_status(self):
        with self._lock:
            return {
                "state": self.state,
                "enabled": self.state == "running",
                "mode": self.mode,
                "interval_ms": self.interval_ms,
                "events_generated": self.events_generated,
                "alerts_triggered": self.alerts_triggered,
                "last_event_id": self.last_event_id,
                "last_event_timestamp": self.last_event_timestamp,
                "available_modes": list(SCENARIOS.keys()),
                "total_stored_events": len(store.get_all_event_ids()),
            }

    def start(self, mode="mixed", interval_ms=2000):
        with self._lock:
            self.mode = mode if mode in SCENARIOS else "mixed"
            self.interval_ms = max(500, min(10000, int(interval_ms)))

            if self.state in {"idle", "paused"}:
                self.state = "starting"
                if self._thread is None or not self._thread.is_alive():
                    self._thread = threading.Thread(target=self._run_loop, daemon=True)
                    self._thread.start()
                else:
                    self.state = "running"

        return self.get_status()

    def pause(self):
        with self._lock:
            if self.state == "running":
                self.state = "paused"
        return self.get_status()

    def stop(self):
        with self._lock:
            self.state = "idle"
        return self.get_status()

    def reset(self):
        with self._lock:
            self.state = "idle"
            self.events_generated = 0
            self.alerts_triggered = 0
            self.last_event_id = None
            self.last_event_timestamp = None
            self.generator = EventGenerator()
            store.reset_live_events()
        return self.get_status()

    def step(self, mode=None):
        """
        Manually executes a single simulation step (thread-safe, protected from double-clicks).
        """
        if not self._step_lock.acquire(blocking=False):
            return {"success": False, "message": "Step already in progress"}

        try:
            chosen_mode = mode or self.mode
            raw_event = self.generator.generate_next_event(mode=chosen_mode)

            # Pipe through the real ingestion and detection engine
            ingest_result = ingest_and_process_event(raw_event)

            with self._lock:
                self.events_generated += 1
                self.last_event_id = raw_event.get("event_id")
                self.last_event_timestamp = raw_event.get("timestamp")
                if ingest_result.get("is_alert"):
                    self.alerts_triggered += 1

            return ingest_result
        finally:
            self._step_lock.release()

    def _run_loop(self):
        with self._lock:
            self.state = "running"

        while True:
            with self._lock:
                current_state = self.state
                interval = self.interval_ms

            if current_state == "idle":
                break

            if current_state == "running":
                try:
                    self.step()
                except Exception:
                    pass

            sleep_sec = max(0.5, interval / 1000.0)
            time.sleep(sleep_sec)


# Global Simulator Singleton
simulator = TelemetrySimulator()
