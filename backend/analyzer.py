"""
analyzer.py

Aggregates runtime events and profiles into high-level security analysis,
trust landscape metrics, behavioural streams, and identity rankings.
Uses only runtime CSV data and existing deterministic scoring functions.
Does NOT access ground_truth.csv.
"""

from collections import defaultdict
from datetime import datetime

from .data_loader import store
from .processor import process_event



def get_all_scored_events():
    """Evaluate and return scored event records sorted chronologically."""
    scored = []
    for event_id in store.get_all_event_ids():
        try:
            result = process_event(event_id)
            scored.append(result)
        except Exception:
            continue

    # Sort chronologically by timestamp
    scored.sort(key=lambda item: item["event"].get("timestamp") or "")
    return scored



def get_security_analysis():
    """
    Computes security posture metrics, behavioural trust over time,
    live behaviour stream, and ranked identities from runtime data.
    """
    scored_events = get_all_scored_events()
    total_events = len(scored_events)

    if total_events == 0:
        return {
            "behavioural_trust_score": 100,
            "behavioural_trust_trend": 0,
            "active_threats": 0,
            "active_threats_trend": 0,
            "privileged_identities": len(store.users_by_id),
            "privileged_identities_trend": 0,
            "events_analyzed": 0,
            "events_analyzed_trend": 0,
            "threat_severity_counts": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "trust_landscape": [],
            "trust_over_time": [],
            "live_stream": [],
            "top_identities": [],
        }

    # 1. Threat severity counts & active threats
    critical_count = 0
    high_count = 0
    moderate_count = 0
    low_count = 0
    total_risk = 0.0

    # Group events by hour bucket for trust landscape
    time_buckets = defaultdict(list)

    # Group events by user for identity ranking
    user_events = defaultdict(list)

    for item in scored_events:
        risk = item["risk_score"]
        sev = item["severity"]
        total_risk += risk

        if sev == "CRITICAL":
            critical_count += 1
        elif sev == "HIGH":
            high_count += 1
        elif sev in ("MODERATE", "MEDIUM"):
            moderate_count += 1
        else:
            low_count += 1

        # Time bucket grouping (e.g. "06:00", "07:00")
        raw_ts = item["event"].get("timestamp") or ""
        bucket_key = "00:00"
        if "T" in raw_ts:
            time_part = raw_ts.split("T")[1]
            hour = time_part.split(":")[0]
            bucket_key = f"{hour}:00"
        elif ":" in raw_ts:
            hour = raw_ts.split(":")[0].strip()
            bucket_key = f"{hour.zfill(2)}:00"

        time_buckets[bucket_key].append(item)

        user_id = item["user_id"]
        if user_id:
            user_events[user_id].append(item)

    active_threats = critical_count + high_count
    avg_risk = total_risk / max(1, total_events)
    enterprise_trust = round(max(0.0, min(100.0, 100.0 - avg_risk)), 1)

    # 2. Build Trust Landscape / Trust Over Time series
    trust_landscape = []
    for bucket_key in sorted(time_buckets.keys()):
        bucket_items = time_buckets[bucket_key]
        b_count = len(bucket_items)
        b_risk_sum = sum(i["risk_score"] for i in bucket_items)
        b_avg_risk = b_risk_sum / max(1, b_count)
        b_trust = round(max(0.0, min(100.0, 100.0 - b_avg_risk)), 1)
        b_anomalies = sum(1 for i in bucket_items if i["risk_score"] >= 25 or i["severity"] in ("HIGH", "CRITICAL"))

        point = {
            "timestamp": bucket_key,
            "trust_score": b_trust,
            "risk_score": round(b_avg_risk, 1),
            "anomaly_count": b_anomalies,
            "event_count": b_count,
        }
        trust_landscape.append(point)

    # 3. Build Live Behaviour Stream (most recent events first)
    live_stream = []
    # Reverse chronological
    recent_scored = list(reversed(scored_events))
    for item in recent_scored[:30]:
        evt = item["event"]
        raw_ts = evt.get("timestamp") or ""
        display_ts = raw_ts
        if "T" in raw_ts:
            display_ts = raw_ts.split("T")[1]

        # Generate clear description from signals or event action
        signals = item.get("signals") or []
        if signals:
            description = "; ".join(s.get("description") or s.get("signal") for s in signals[:2])
        else:
            event_type = evt.get("event_type", "action")
            res = evt.get("resource_id")
            description = f"Standard {event_type.replace('_', ' ')} recorded" + (f" on {res}" if res else "")

        amount_val = float(evt.get("transaction_amount") or 0)
        amount_str = f"₹{amount_val:,.2f}" if amount_val > 0 else "-"

        stream_entry = {
            "event_id": item["event_id"],
            "user_id": item["user_id"],
            "user_name": item["user_id"],
            "timestamp": display_ts,
            "event_type": (evt.get("event_type") or "EVENT").upper().replace("_", " "),
            "risk_level": "MEDIUM" if item["severity"] == "MODERATE" else item["severity"],
            "risk_score": item["risk_score"],
            "description": description,
            "amount": amount_str,
            "location": evt.get("device_id") or "DEV-CORP",
            "device": evt.get("device_id") or "-",
        }
        live_stream.append(stream_entry)

    # 4. Build Ranked Identities / Privileged Identities
    ranked_identities = []
    for user_id, u_profile in store.users_by_id.items():
        u_items = user_events.get(user_id, [])
        e_count = len(u_items)
        max_risk = max((i["risk_score"] for i in u_items), default=0.0)
        high_risk_events = sum(1 for i in u_items if i["severity"] in ("HIGH", "CRITICAL"))
        latest_ts = max((i["event"].get("timestamp") or "" for i in u_items), default="-")

        role = u_profile.get("role") or "Standard User"
        actor_type = u_profile.get("actor_type") or "employee"

        account_type = (
            "Service Account" if actor_type == "service_account"
            else "Automated System" if actor_type == "automated_system"
            else "Administrator" if "admin" in role.lower()
            else "Employee"
        )

        privilege_level = (
            "SYSTEM_ADMIN" if "admin" in role.lower()
            else "HIGH" if role in ("Finance Operations", "Core Banking Admin", "DevOps & Cloud Infra")
            else "MEDIUM"
        )

        top_evt = max(u_items, key=lambda i: i["risk_score"], default=None)
        top_event_id = top_evt["event_id"] if top_evt else None

        identity_entry = {
            "user_id": user_id,
            "name": user_id,
            "role": role,
            "account_type": account_type,
            "department": u_profile.get("peer_group_id") or "General Staff",
            "peer_group": u_profile.get("peer_group_id") or "General Staff",
            "privilege_level": privilege_level,
            "top_event_id": top_event_id,
            "risk_score": round(max_risk, 1),
            "trust_score": round(max(0.0, 100.0 - max_risk), 1),
            "event_count": e_count,
            "high_risk_events": high_risk_events,
            "severity": (
                "CRITICAL" if max_risk >= 75
                else "HIGH" if max_risk >= 50
                else "MODERATE" if max_risk >= 25
                else "LOW"
            ),
            "status": (
                "UNDER_INVESTIGATION" if high_risk_events > 0
                else "MONITORED" if max_risk >= 25
                else "ACTIVE"
            ),
            "last_activity": latest_ts,
            "normal_hours": f"{u_profile.get('typical_login_hour', '09')}:00 IST",
            "normal_location": u_profile.get("home_device") or "-",
        }
        ranked_identities.append(identity_entry)


    # Sort identities by risk_score desc, then high_risk_events desc, then event_count desc
    ranked_identities.sort(key=lambda u: (u["risk_score"], u["high_risk_events"], u["event_count"]), reverse=True)

    return {
        "behavioural_trust_score": enterprise_trust,
        "behavioural_trust_trend": 0,
        "active_threats": active_threats,
        "active_threats_trend": 0,
        "privileged_identities": len(store.users_by_id),
        "privileged_identities_trend": 0,
        "events_analyzed": total_events,
        "events_analyzed_trend": 0,
        "threat_severity_counts": {
            "critical": critical_count,
            "high": high_count,
            "medium": moderate_count,
            "low": low_count,
        },
        "trust_landscape": trust_landscape,
        "trust_over_time": trust_landscape,
        "live_stream": live_stream,
        "top_identities": ranked_identities,
    }


def get_analytics_data():
    """Computes high-level analytics aggregation from runtime data."""
    analysis = get_security_analysis()
    scored_events = get_all_scored_events()

    # Risk by role aggregation
    role_risks = defaultdict(list)
    acct_risks = defaultdict(list)

    for ident in analysis["top_identities"]:
        role = ident["role"]
        acct = ident["account_type"]
        risk = ident["risk_score"]
        role_risks[role].append(risk)
        acct_risks[acct].append(risk)

    risk_by_role = [
        {"role": role, "avg_risk": round(sum(vals) / len(vals), 1), "count": len(vals)}
        for role, vals in role_risks.items()
    ]
    risk_by_role.sort(key=lambda x: x["avg_risk"], reverse=True)

    risk_by_account_type = [
        {"account_type": acct, "avg_risk": round(sum(vals) / len(vals), 1), "count": len(vals)}
        for acct, vals in acct_risks.items()
    ]
    risk_by_account_type.sort(key=lambda x: x["avg_risk"], reverse=True)

    anomalies_trend = [
        {"date": pt["timestamp"], "anomalies": pt["anomaly_count"], "events": pt["event_count"]}
        for pt in analysis["trust_landscape"]
    ]

    anomalies_detected = sum(1 for e in scored_events if e["risk_score"] >= 25)
    at_risk_identities = sum(1 for i in analysis["top_identities"] if i["risk_score"] >= 50)

    return {
        "events_analyzed": analysis["events_analyzed"],
        "anomalies_detected": anomalies_detected,
        "at_risk_identities": at_risk_identities,
        "confirmed_incidents": analysis["active_threats"],
        "false_positive_rate": 0.0,
        "risk_by_role": risk_by_role,
        "risk_by_account_type": risk_by_account_type,
        "anomalies_trend": anomalies_trend,
        "model_stats": {
            "model_name": "Deterministic Behaviour & Sequence Engine",
            "version": "v2.4-runtime",
            "events_scored": analysis["events_analyzed"],
            "anomalies_detected": anomalies_detected,
            "anomaly_rate": round(anomalies_detected / max(1, analysis["events_analyzed"]) * 100, 2),
            "last_updated": "Runtime Live",
        },
    }
