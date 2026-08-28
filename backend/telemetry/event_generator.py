"""
SENTINEL Telemetry Event Generator.

Generates schema-compliant synthetic security events tailored to individual user
baseline profiles, generating both legitimate baseline traffic and coherent
temporal attack chains.
"""

import random
from datetime import datetime, timezone

try:
    from ..data_loader import store
    from .scenarios import SCENARIOS
except ImportError:
    from data_loader import store
    from telemetry.scenarios import SCENARIOS


class EventGenerator:
    """
    Stateful telemetry event generator that tracks active attack scenario progressions
    and generates baseline-compliant normal events.
    """

    def __init__(self):
        self._seq_counter = 1000
        self._active_scenarios = {}

    def _next_event_id(self):
        self._seq_counter += 1
        return f"SIM-{self._seq_counter:06d}"

    def _get_random_user(self):
        users = list(store.users_by_id.values())
        if not users:
            return {"user_id": "U001", "typical_login_hour": "9", "avg_txn_amount": "5000", "home_device": "DEV-01"}
        return random.choice(users)

    def generate_normal_event(self, user=None, timestamp=None):
        """
        Generates a legitimate, baseline-compliant security event for a user.
        """
        user = user or self._get_random_user()
        uid = user.get("user_id", "U001")
        now = timestamp or datetime.now(timezone.utc)

        event_types = ["login", "file_access", "transaction", "logout"]
        etype = random.choice(event_types)

        event_id = self._next_event_id()
        home_dev = user.get("home_device") or f"DEV-{uid}"

        event = {
            "event_id": event_id,
            "user_id": uid,
            "timestamp": now.isoformat(),
            "event_type": etype,
            "resource_id": "",
            "sensitive_resource_flag": "0",
            "records_accessed": "0",
            "device_id": home_dev,
            "new_device_flag": "0",
            "permission_change_flag": "0",
            "new_permission_level": "",
            "beneficiary_id": "",
            "new_beneficiary_flag": "0",
            "transaction_amount": "0",
            "_simulation_id": "SIM-BASELINE",
            "_scenario": "normal_activity",
            "_stage": 0,
        }

        if etype == "file_access":
            event["resource_id"] = f"RES-DOC-{random.randint(100, 999)}"
            event["records_accessed"] = str(random.randint(1, 10))
        elif etype == "transaction":
            avg_txn = float(user.get("avg_txn_amount") or 5000)
            spread = float(user.get("txn_amount_spread") or 1000)
            amount = max(100.0, round(random.gauss(avg_txn, spread * 0.5), 2))
            event["transaction_amount"] = str(amount)
            event["beneficiary_id"] = f"BEN-REGULAR-{random.randint(1, 5)}"

        return event

    def generate_scenario_event(self, scenario_id="privilege_abuse", user=None, timestamp=None):
        """
        Generates the next sequential event in an attack scenario progression for a user.
        """
        scenario = SCENARIOS.get(scenario_id, SCENARIOS["privilege_abuse"])
        stages = scenario.get("stages", [])
        if not stages:
            return self.generate_normal_event(user, timestamp)

        user = user or self._get_random_user()
        uid = user.get("user_id", "U001")
        now = timestamp or datetime.now(timezone.utc)

        if uid not in self._active_scenarios or self._active_scenarios[uid]["scenario_id"] != scenario_id:
            self._active_scenarios[uid] = {
                "scenario_id": scenario_id,
                "stage_idx": 0,
                "sim_id": f"SIM-ATTACK-{random.randint(100, 999)}",
            }

        progress = self._active_scenarios[uid]
        current_stage = stages[progress["stage_idx"]]

        event_id = self._next_event_id()
        etype = current_stage["event_type"]

        event = {
            "event_id": event_id,
            "user_id": uid,
            "timestamp": now.isoformat(),
            "event_type": etype,
            "resource_id": current_stage.get("resource_id", ""),
            "sensitive_resource_flag": "1" if current_stage.get("sensitive_resource") else "0",
            "records_accessed": str(current_stage.get("records_accessed", 0)),
            "device_id": f"DEV-FOREIGN-{random.randint(10, 99)}" if current_stage.get("new_device") else user.get("home_device", "DEV-01"),
            "new_device_flag": "1" if current_stage.get("new_device") else "0",
            "permission_change_flag": "1" if current_stage.get("permission_change") else "0",
            "new_permission_level": current_stage.get("new_permission_level", ""),
            "beneficiary_id": current_stage.get("beneficiary_id", ""),
            "new_beneficiary_flag": "1" if current_stage.get("new_beneficiary") else "0",
            "transaction_amount": "0",
            "_simulation_id": progress["sim_id"],
            "_scenario": scenario_id,
            "_stage": current_stage["stage"],
        }

        if etype == "transaction":
            avg_txn = float(user.get("avg_txn_amount") or 5000)
            mult = current_stage.get("transaction_multiplier", 4.0)
            event["transaction_amount"] = str(round(avg_txn * mult + 10000, 2))
            if current_stage.get("exceeds_limit"):
                event["exceeds_limit_flag"] = "1"

        progress["stage_idx"] += 1
        if progress["stage_idx"] >= len(stages):
            del self._active_scenarios[uid]

        return event

    def generate_next_event(self, mode="mixed", user_id=None):
        """
        Main entry point: Generates either normal or attack traffic based on selected mode.
        """
        user = store.users_by_id.get(user_id) if user_id else None

        if mode == "normal_activity":
            return self.generate_normal_event(user)
        elif mode in SCENARIOS and mode != "mixed":
            return self.generate_scenario_event(mode, user)
        else:
            if random.random() < 0.80 and not any(self._active_scenarios.values()):
                return self.generate_normal_event(user)
            else:
                chosen_scenario = random.choice(["privilege_abuse", "account_takeover", "data_exfiltration"])
                return self.generate_scenario_event(chosen_scenario, user)
