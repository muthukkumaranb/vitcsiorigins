"""
PS9 — Privileged Access Misuse & Insider Threat Detection
Synthetic Dataset Generator (MVP — 3 deterministic scenarios)

Per the committee blueprint: don't generate an enormous dataset. Generate
just enough normal background traffic to establish per-user/per-role
baselines, then construct exactly three deterministic, hand-authored
scenarios:

  Scenario 1 — Normal user
      LOGIN -> FILE ACCESS -> NORMAL TRANSACTION -> LOGOUT
      Expected: stays LOW throughout.

  Scenario 2 — Insider attack (hero scenario)
      LOGIN (unusual device) -> sensitive FILE ACCESS -> PERMISSION CHANGE
      -> NEW BENEFICIARY -> large TRANSACTION -> DATA EXPORT
      Expected risk climbs step by step: LOW -> MODERATE -> HIGH -> CRITICAL.

  Scenario 3 — False positive (context suppression)
      Unusual LOGIN -> sensitive ACCESS, but under an active approved
      incident / maintenance window.
      Expected: would-be HIGH is suppressed to MODERATE by the context
      multiplier -- proves the system doesn't just scream "anomaly".

Roles kept identical to the frozen blueprint (§8-§10): analyst, manager,
admin, finance_officer, plus service_account / automated_system actor
types. No new roles added -- see chat for why.

Outputs (--outdir, default ./output):
  users.csv         - static identity/peer-baseline table (small population)
  events.csv        - background baseline events + the 3 scenario chains
                       (NO ground-truth columns -- kept out of the pipeline)
  context.csv        - the one active_incident window for Scenario 3
  ground_truth.csv   - event_id -> is_attack, scenario_id, expected_risk_raw,
                        expected_risk_final (evaluation/grading only)

Usage:
  python generate_dataset_v2.py --n-users 15 --n-baseline-days 5 --seed 42 --outdir output
"""

import argparse
import csv
import os
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta

ROLES = ["analyst", "manager", "admin", "finance_officer"]
DEVICE_POOL = [f"DEV-{i:03d}" for i in range(1, 20)]
RESOURCE_POOL = [f"RES-{i:03d}" for i in range(1, 25)]
SENSITIVE_RESOURCES = set(f"RES-{i:03d}" for i in range(1, 6))
BENEFICIARY_POOL = [f"BEN-{i:03d}" for i in range(1, 15)]

TXN_LIMIT_BY_ROLE = {
    "finance_officer": 5000.0,
    "admin": 3000.0,
    "manager": 1500.0,
    "analyst": 800.0,
}

DEMO_START = datetime(2026, 3, 2, 0, 0, 0)  # fixed epoch -> deterministic, replayable


@dataclass
class User:
    user_id: str
    role: str
    actor_type: str
    peer_group_id: str
    typical_login_hour: float
    login_hour_spread: float
    avg_session_minutes: float
    avg_txn_amount: float
    txn_amount_spread: float
    transaction_limit: float
    home_device: str


@dataclass
class Event:
    event_id: str
    user_id: str
    timestamp: datetime
    event_type: str  # login, file_access, transaction, logout, permission_change,
                      # beneficiary_change, data_export
    resource_id: str = ""
    sensitive_resource_flag: int = 0
    records_accessed: int = 0
    device_id: str = ""
    new_device_flag: int = 0
    permission_change_flag: int = 0
    new_permission_level: str = ""
    beneficiary_id: str = ""
    new_beneficiary_flag: int = 0
    transaction_amount: float = 0.0
    exceeds_limit_flag: int = 0
    session_duration_minutes: float = 0.0
    # hidden -- written only to ground_truth.csv, never events.csv
    is_attack: int = field(default=0, repr=False)
    scenario_id: str = field(default="", repr=False)
    expected_risk_raw: str = field(default="", repr=False)
    expected_risk_final: str = field(default="", repr=False)


def make_users(n_users: int, rng: random.Random) -> list[User]:
    users = []
    n_peer_groups = max(2, n_users // 4)
    for i in range(n_users):
        role = ROLES[i % len(ROLES)]
        # last two slots are the non-human actor types, on top of the 4 roles
        if i >= n_users - 2:
            actor_type = "service_account" if i == n_users - 2 else "automated_system"
            typical_hour, spread = rng.choice([2.0, 3.0, 14.0]), 0.5
        else:
            actor_type = "employee"
            typical_hour, spread = rng.uniform(8.0, 10.5), rng.uniform(0.5, 1.2)
        users.append(User(
            user_id=f"U{i+1:03d}",
            role=role,
            actor_type=actor_type,
            peer_group_id=f"PG{(i % n_peer_groups) + 1}",
            typical_login_hour=typical_hour,
            login_hour_spread=spread,
            avg_session_minutes=rng.uniform(20, 60),
            avg_txn_amount=rng.uniform(100, 0.5 * TXN_LIMIT_BY_ROLE[role]),
            txn_amount_spread=rng.uniform(30, 150),
            transaction_limit=TXN_LIMIT_BY_ROLE[role],
            home_device=rng.choice(DEVICE_POOL),
        ))
    return users


def gclip(rng, mean, spread, lo, hi):
    return max(lo, min(hi, rng.gauss(mean, spread)))


def baseline_events_for_user(user: User, day_offset: int, rng: random.Random) -> list[Event]:
    """One ordinary login->file_access->(maybe transaction)->logout day, for baseline history."""
    day = DEMO_START + timedelta(days=day_offset)
    hour = gclip(rng, user.typical_login_hour, user.login_hour_spread, 0, 23)
    login_ts = day.replace(hour=int(hour), minute=rng.randint(0, 59))
    events = [Event(event_id="", user_id=user.user_id, timestamp=login_ts,
                     event_type="login", device_id=user.home_device,
                     expected_risk_raw="LOW", expected_risk_final="LOW")]

    fa_ts = login_ts + timedelta(minutes=rng.randint(5, 60))
    res = rng.choice([r for r in RESOURCE_POOL if r not in SENSITIVE_RESOURCES])
    events.append(Event(event_id="", user_id=user.user_id, timestamp=fa_ts,
                         event_type="file_access", resource_id=res,
                         sensitive_resource_flag=0, records_accessed=rng.randint(1, 15),
                         device_id=user.home_device,
                         expected_risk_raw="LOW", expected_risk_final="LOW"))

    if rng.random() < 0.5:
        txn_ts = fa_ts + timedelta(minutes=rng.randint(5, 60))
        amt = gclip(rng, user.avg_txn_amount, user.txn_amount_spread, 0, user.transaction_limit)
        events.append(Event(event_id="", user_id=user.user_id, timestamp=txn_ts,
                             event_type="transaction", beneficiary_id=rng.choice(BENEFICIARY_POOL),
                             transaction_amount=round(amt, 2), exceeds_limit_flag=0,
                             device_id=user.home_device,
                             expected_risk_raw="LOW", expected_risk_final="LOW"))

    logout_ts = events[-1].timestamp + timedelta(minutes=rng.randint(10, int(user.avg_session_minutes) + 10))
    events.append(Event(event_id="", user_id=user.user_id, timestamp=logout_ts,
                         event_type="logout", device_id=user.home_device,
                         session_duration_minutes=round((logout_ts - login_ts).total_seconds() / 60, 1),
                         expected_risk_raw="LOW", expected_risk_final="LOW"))
    return events


def scenario_1_normal(user: User, day_offset: int, rng: random.Random) -> list[Event]:
    """LOGIN -> FILE ACCESS -> NORMAL TRANSACTION -> LOGOUT. Expected: LOW throughout."""
    sid = "SCEN_1_NORMAL"
    day = DEMO_START + timedelta(days=day_offset)
    t0 = day.replace(hour=int(user.typical_login_hour), minute=0)

    login = Event(event_id="", user_id=user.user_id, timestamp=t0, event_type="login",
                   device_id=user.home_device, scenario_id=sid,
                   expected_risk_raw="LOW", expected_risk_final="LOW")
    fa = Event(event_id="", user_id=user.user_id, timestamp=t0 + timedelta(minutes=8),
               event_type="file_access", resource_id=rng.choice(
                   [r for r in RESOURCE_POOL if r not in SENSITIVE_RESOURCES]),
               sensitive_resource_flag=0, records_accessed=rng.randint(1, 10),
               device_id=user.home_device, scenario_id=sid,
               expected_risk_raw="LOW", expected_risk_final="LOW")
    txn = Event(event_id="", user_id=user.user_id, timestamp=t0 + timedelta(minutes=16),
                event_type="transaction", beneficiary_id=rng.choice(BENEFICIARY_POOL),
                transaction_amount=round(user.avg_txn_amount, 2), exceeds_limit_flag=0,
                device_id=user.home_device, scenario_id=sid,
                expected_risk_raw="LOW", expected_risk_final="LOW")
    logout = Event(event_id="", user_id=user.user_id, timestamp=t0 + timedelta(minutes=45),
                    event_type="logout", device_id=user.home_device,
                    session_duration_minutes=45.0, scenario_id=sid,
                    expected_risk_raw="LOW", expected_risk_final="LOW")
    return [login, fa, txn, logout]


def scenario_2_attack(user: User, day_offset: int, rng: random.Random) -> list[Event]:
    """
    Hero scenario. 6-step chain, progressive risk:
      login(unusual device)      -> LOW
      sensitive file_access      -> MODERATE
      permission_change          -> HIGH
      beneficiary_change         -> HIGH
      transaction (breach)       -> CRITICAL
      data_export                -> CRITICAL
    """
    sid = "SCEN_2_ATTACK"
    day = DEMO_START + timedelta(days=day_offset)
    t0 = day.replace(hour=2, minute=13)  # after-hours, matches demo script beat 2
    new_device = rng.choice([d for d in DEVICE_POOL if d != user.home_device])
    sensitive_res = rng.choice(sorted(SENSITIVE_RESOURCES))
    new_beneficiary = rng.choice(BENEFICIARY_POOL)

    events = [
        Event(event_id="", user_id=user.user_id, timestamp=t0, event_type="login",
              device_id=new_device, new_device_flag=1,
              is_attack=1, scenario_id=sid,
              expected_risk_raw="LOW", expected_risk_final="LOW"),
        Event(event_id="", user_id=user.user_id, timestamp=t0 + timedelta(minutes=6),
              event_type="file_access", resource_id=sensitive_res, sensitive_resource_flag=1,
              records_accessed=rng.randint(400, 900), device_id=new_device,
              is_attack=1, scenario_id=sid,
              expected_risk_raw="MODERATE", expected_risk_final="MODERATE"),
        Event(event_id="", user_id=user.user_id, timestamp=t0 + timedelta(minutes=12),
              event_type="permission_change", permission_change_flag=1,
              new_permission_level="elevated", device_id=new_device,
              is_attack=1, scenario_id=sid,
              expected_risk_raw="HIGH", expected_risk_final="HIGH"),
        Event(event_id="", user_id=user.user_id, timestamp=t0 + timedelta(minutes=18),
              event_type="beneficiary_change", beneficiary_id=new_beneficiary,
              new_beneficiary_flag=1, device_id=new_device,
              is_attack=1, scenario_id=sid,
              expected_risk_raw="HIGH", expected_risk_final="HIGH"),
        Event(event_id="", user_id=user.user_id, timestamp=t0 + timedelta(minutes=24),
              event_type="transaction", beneficiary_id=new_beneficiary, new_beneficiary_flag=1,
              transaction_amount=round(user.transaction_limit * rng.uniform(1.8, 3.0), 2),
              exceeds_limit_flag=1, device_id=new_device,
              is_attack=1, scenario_id=sid,
              expected_risk_raw="CRITICAL", expected_risk_final="CRITICAL"),
        Event(event_id="", user_id=user.user_id, timestamp=t0 + timedelta(minutes=30),
              event_type="data_export", resource_id=sensitive_res, sensitive_resource_flag=1,
              records_accessed=rng.randint(2000, 5000), device_id=new_device,
              is_attack=1, scenario_id=sid,
              expected_risk_raw="CRITICAL", expected_risk_final="CRITICAL"),
    ]
    return events


def scenario_3_false_positive(user: User, day_offset: int, rng: random.Random):
    """
    Unusual login -> sensitive access, under an approved incident/maintenance
    window. Raw score would be HIGH; context multiplier suppresses it to
    MODERATE. Not a real attack (is_attack=0) -- legitimate, unusual, approved.
    """
    sid = "SCEN_3_FALSE_POSITIVE"
    day = DEMO_START + timedelta(days=day_offset)
    t0 = day.replace(hour=1, minute=45)
    new_device = rng.choice([d for d in DEVICE_POOL if d != user.home_device])
    sensitive_res = rng.choice(sorted(SENSITIVE_RESOURCES))

    login = Event(event_id="", user_id=user.user_id, timestamp=t0, event_type="login",
                   device_id=new_device, new_device_flag=1,
                   is_attack=0, scenario_id=sid,
                   expected_risk_raw="LOW", expected_risk_final="LOW")
    access = Event(event_id="", user_id=user.user_id, timestamp=t0 + timedelta(minutes=7),
                    event_type="file_access", resource_id=sensitive_res, sensitive_resource_flag=1,
                    records_accessed=rng.randint(200, 500), device_id=new_device,
                    is_attack=0, scenario_id=sid,
                    expected_risk_raw="HIGH", expected_risk_final="MODERATE")

    context_row = {
        "context_id": f"CTX_{sid}",
        "related_user_id": user.user_id,
        "type": "active_incident",
        "start_time": (t0 - timedelta(minutes=15)).isoformat(),
        "end_time": (t0 + timedelta(hours=1)).isoformat(),
        "manager_approval_flag": 1,
    }
    return [login, access], [context_row]


def assign_ids(events: list[Event]) -> None:
    events.sort(key=lambda e: e.timestamp)
    for i, e in enumerate(events, start=1):
        e.event_id = f"E{i:04d}"


def write_csv(path, fieldnames, rows):
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def generate(n_users: int, n_baseline_days: int, seed: int, outdir: str):
    rng = random.Random(seed)
    users = make_users(n_users, rng)

    all_events: list[Event] = []
    for u in users:
        for d in range(n_baseline_days):
            if u.actor_type == "employee" and rng.random() < 0.1:
                continue  # occasional day off, keeps it from being suspiciously perfect
            all_events.extend(baseline_events_for_user(u, d, rng))

    # pick three distinct users for the three named scenarios
    normal_user = users[0]
    privileged = [u for u in users if u.role in ("admin", "finance_officer") and u.actor_type == "employee"]
    attacker = privileged[0]
    lookalike_user = privileged[1] if len(privileged) > 1 else privileged[0]

    scen_day = n_baseline_days  # the day right after the baseline window

    all_events.extend(scenario_1_normal(normal_user, scen_day, rng))
    all_events.extend(scenario_2_attack(attacker, scen_day, rng))
    fp_events, context_rows = scenario_3_false_positive(lookalike_user, scen_day, rng)
    all_events.extend(fp_events)

    assign_ids(all_events)
    os.makedirs(outdir, exist_ok=True)

    write_csv(
        f"{outdir}/users.csv",
        ["user_id", "role", "actor_type", "peer_group_id", "typical_login_hour",
         "login_hour_spread", "avg_session_minutes", "avg_txn_amount",
         "txn_amount_spread", "transaction_limit", "home_device"],
        [u.__dict__ for u in users],
    )

    event_fields = ["event_id", "user_id", "timestamp", "event_type", "resource_id",
                     "sensitive_resource_flag", "records_accessed", "device_id",
                     "new_device_flag", "permission_change_flag", "new_permission_level",
                     "beneficiary_id", "new_beneficiary_flag", "transaction_amount",
                     "exceeds_limit_flag", "session_duration_minutes"]
    write_csv(
        f"{outdir}/events.csv",
        event_fields,
        [{k: (getattr(e, k).isoformat() if k == "timestamp" else getattr(e, k)) for k in event_fields}
         for e in all_events],
    )

    write_csv(
        f"{outdir}/context.csv",
        ["context_id", "related_user_id", "type", "start_time", "end_time", "manager_approval_flag"],
        context_rows,
    )

    write_csv(
        f"{outdir}/ground_truth.csv",
        ["event_id", "is_attack", "scenario_id", "expected_risk_raw", "expected_risk_final"],
        [{"event_id": e.event_id, "is_attack": e.is_attack, "scenario_id": e.scenario_id,
          "expected_risk_raw": e.expected_risk_raw, "expected_risk_final": e.expected_risk_final}
         for e in all_events],
    )

    print(f"users:           {len(users)} (roles: {ROLES} + service_account/automated_system)")
    print(f"baseline events: {len(all_events) - 12}")
    print(f"scenario 1 (normal):         user={normal_user.user_id}, day={scen_day} -> expect LOW throughout")
    print(f"scenario 2 (attack, hero):   user={attacker.user_id}, day={scen_day} -> expect LOW->MODERATE->HIGH->CRITICAL")
    print(f"scenario 3 (false positive): user={lookalike_user.user_id}, day={scen_day} -> expect HIGH suppressed to MODERATE")
    print(f"written to: {outdir}/")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Generate PS9 MVP synthetic dataset (3 scenarios)")
    ap.add_argument("--n-users", type=int, default=25, help="15-25 per blueprint §8")
    ap.add_argument("--n-baseline-days", type=int, default=5, help="days of normal history per user")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--outdir", type=str, default="output")
    args = ap.parse_args()
    generate(args.n_users, args.n_baseline_days, args.seed, args.outdir)
