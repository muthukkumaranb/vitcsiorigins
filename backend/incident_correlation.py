"""
SENTINEL Incident Correlation Engine (M7).

Correlates security telemetry events into multi-stage incident timelines,
classifying attack progression across SOC stages and assigning incident IDs.
"""

from datetime import datetime, timedelta

from .data_loader import store
from .processor import process_event
from .ml.fusion import classify_severity



STAGE_DEFINITIONS = [
    {
        "stage_id": "STAGE_1",
        "name": "Ingress & Credential Usage",
        "types": ["login", "unusual_login"],
        "signals": ["UNUSUAL_LOGIN", "AFTER_HOURS", "NEW_DEVICE"],
    },
    {
        "stage_id": "STAGE_2",
        "name": "Privilege Escalation",
        "types": ["permission_change", "role_change"],
        "signals": ["PRIVILEGE_CHANGE", "PRIVILEGE_ESCALATION"],
    },
    {
        "stage_id": "STAGE_3",
        "name": "Discovery & Sensitive Access",
        "types": ["file_access", "sensitive_access", "database_query"],
        "signals": ["SENSITIVE_ACCESS", "LARGE_DATA_ACCESS"],
    },
    {
        "stage_id": "STAGE_4",
        "name": "Exfiltration & Financial Impact",
        "types": ["beneficiary_change", "transaction", "large_transaction", "data_export", "bulk_download"],
        "signals": ["NEW_BENEFICIARY", "LARGE_TRANSACTION", "DATA_EXPORT", "HIGH_TRANSACTION_FREQUENCY"],
    },
]


def _classify_event_stage(event_type, signals):
    etype = (event_type or "").lower()
    sig_set = set(s.get("signal") for s in (signals or []))

    for stage in reversed(STAGE_DEFINITIONS):
        if etype in stage["types"] or any(sig in stage["signals"] for sig in sig_set):
            return stage["stage_id"], stage["name"]

    return "STAGE_1", "Ingress & Credential Usage"


def correlate_incidents(lookback_window_minutes=120):
    """
    Scans all loaded telemetry and groups suspicious sequences into correlated incidents.
    """
    # Group events by user_id
    user_events = {}
    for event in store.get_all_events():
        eid = event.get("event_id")
        uid = event.get("user_id")
        if not uid or not eid:
            continue
        if uid not in user_events:
            user_events[uid] = []
        user_events[uid].append((eid, event))


    incidents = []
    inc_counter = 1

    for uid, evts in user_events.items():
        # Sort chronologically
        evts.sort(key=lambda x: str(x[1].get("timestamp", "")))

        # Process risk for all events of this user
        evaluated_events = []
        for eid, raw_evt in evts:
            try:
                res = process_event(eid)
                evaluated_events.append(res)
            except Exception:
                continue

        # Find high-risk clusters (events with high risk or detected sequence chains)
        clusters = []
        current_cluster = []

        for item in evaluated_events:
            is_suspicious = (
                item.get("risk_score", 0) >= 40
                or item.get("sequence", {}).get("chain_detected")
                or len(item.get("signals", [])) >= 2
            )
            if is_suspicious:
                current_cluster.append(item)
            else:
                if len(current_cluster) >= 2 or (current_cluster and current_cluster[0].get("risk_score", 0) >= 50):
                    clusters.append(current_cluster)
                current_cluster = []

        if len(current_cluster) >= 2 or (current_cluster and current_cluster[0].get("risk_score", 0) >= 50):
            clusters.append(current_cluster)

        # Build Incident objects for each cluster
        for cluster in clusters:
            start_ts_str = cluster[0]["event"].get("timestamp")
            end_ts_str = cluster[-1]["event"].get("timestamp")

            max_risk = max(c["risk_score"] for c in cluster)
            severity = classify_severity(max_risk)

            # Categorize events by attack stage
            stages_map = {s["stage_id"]: {"stage_id": s["stage_id"], "name": s["name"], "events": []} for s in STAGE_DEFINITIONS}
            all_signals = set()

            for item in cluster:
                etype = item["event"].get("event_type")
                stage_id, _ = _classify_event_stage(etype, item.get("signals"))
                stages_map[stage_id]["events"].append({
                    "event_id": item["event_id"],
                    "timestamp": item["event"].get("timestamp"),
                    "event_type": etype,
                    "risk_score": item["risk_score"],
                    "severity": item["severity"],
                })
                for s in item.get("signals", []):
                    all_signals.add(s.get("signal"))

            active_stages = [s for s in stages_map.values() if len(s["events"]) > 0]

            incident_id = f"INC-{inc_counter:03d}"
            inc_counter += 1

            priority = "P1 — Immediate" if severity == "CRITICAL" else "P2 — High" if severity == "HIGH" else "P3 — Standard"

            incidents.append({
                "incident_id": incident_id,
                "user_id": uid,
                "title": f"Correlated Multi-Stage Activity ({uid})",
                "start_time": start_ts_str,
                "end_time": end_ts_str,
                "event_count": len(cluster),
                "max_risk_score": round(max_risk, 1),
                "severity": severity,
                "investigation_priority": priority,
                "status": "OPEN",
                "stages": active_stages,
                "events": [c["event_id"] for c in cluster],
                "primary_indicators": list(all_signals),
                "top_event_id": max(cluster, key=lambda c: c["risk_score"])["event_id"],
            })

    # Sort incidents by max_risk_score desc
    incidents.sort(key=lambda x: x["max_risk_score"], reverse=True)
    return incidents


_CACHED_INCIDENTS = None


def get_all_incidents(refresh=False):
    global _CACHED_INCIDENTS
    if _CACHED_INCIDENTS is None or refresh:
        _CACHED_INCIDENTS = correlate_incidents()
    return _CACHED_INCIDENTS


def get_incident_by_id(incident_id):
    incidents = get_all_incidents()
    for inc in incidents:
        if inc["incident_id"].lower() == str(incident_id).lower():
            return inc
    return None
