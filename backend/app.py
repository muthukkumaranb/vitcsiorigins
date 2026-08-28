"""
app.py

Minimal Flask API exposing:

    GET /api/events/<event_id>/risk/

No database, no auth, no queues — a thin HTTP layer over processor.py.
"""

from datetime import datetime
from flask import Flask, jsonify, request

try:
    from .data_loader import store
    from .processor import process_event, EventNotFoundError
except ImportError:
    from data_loader import store
    from processor import process_event, EventNotFoundError

app = Flask(__name__)


@app.route("/", methods=["GET"])
def service_root():
    return jsonify({"service": "sentinel", "status": "ok", "health": "/api/health"}), 200


@app.after_request
def allow_frontend_origin(response):
    origin = request.headers.get("Origin")
    if origin in {"http://localhost:3000", "http://127.0.0.1:3000"}:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    return response


@app.route("/api/events/<event_id>/risk/", methods=["GET"])
def get_event_risk(event_id):
    try:
        result = process_event(event_id)
    except EventNotFoundError:
        return jsonify({
            "error": "event_not_found",
            "message": f"Event '{event_id}' does not exist.",
            "event_id": event_id,
        }), 404

    return jsonify(result), 200


@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "events": len(store.events_by_id), "users": len(store.users_by_id), "contexts": len(store.contexts)}), 200


@app.route("/api/identities", methods=["GET"])
def identities():
    return jsonify(list(store.users_by_id.values())), 200


@app.route("/api/alerts", methods=["GET"])
def alerts():
    results = []
    for event_id in store.events_by_id:
        result = process_event(event_id)
        if result["severity"] in {"HIGH", "CRITICAL"}:
            results.append({
                "alert_id": f"ALT-{event_id}",
                "event_id": event_id,
                "user_id": result["user_id"],
                "risk_score": result["risk_score"],
                "severity": result["severity"],
                "timestamp": result["event"].get("timestamp"),
                "signals": result["signals"],
                "chain_detected": result["sequence"]["chain_detected"],
            })
    return jsonify(sorted(results, key=lambda item: item["risk_score"], reverse=True)), 200


@app.route("/audit", methods=["GET"])
@app.route("/api/audit", methods=["GET"])
def audit():
    severity_param = request.args.get("severity")
    user_id_param = request.args.get("user_id")
    event_type_param = request.args.get("event_type")
    start_param = request.args.get("start")
    end_param = request.args.get("end")
    limit_param = request.args.get("limit")
    offset_param = request.args.get("offset")
    sort_by = request.args.get("sort_by", "timestamp")
    order = request.args.get("order", "desc").lower()

    start_dt = None
    if start_param:
        try:
            start_dt = datetime.fromisoformat(start_param)
        except ValueError:
            pass

    end_dt = None
    if end_param:
        try:
            end_dt = datetime.fromisoformat(end_param)
        except ValueError:
            pass

    results = []
    for event_id, raw_event in store.events_by_id.items():
        if user_id_param and raw_event.get("user_id", "").lower() != user_id_param.lower():
            continue
        if event_type_param and raw_event.get("event_type", "").lower() != event_type_param.lower():
            continue
        event_dt = raw_event.get("_parsed_timestamp")
        if start_dt and event_dt and event_dt < start_dt:
            continue
        if end_dt and event_dt and event_dt > end_dt:
            continue

        result = process_event(event_id)

        if severity_param:
            sev = severity_param.upper()
            result_sev = result["severity"].upper()
            if sev in ("MEDIUM", "MODERATE"):
                if result_sev not in ("MEDIUM", "MODERATE"):
                    continue
            elif result_sev != sev:
                continue

        item = {
            "event_id": result["event_id"],
            "timestamp": result["event"].get("timestamp") or "",
            "user_id": result["user_id"],
            "event_type": result["event"].get("event_type") or "",
            "risk_score": result["risk_score"],
            "severity": result["severity"],
            "behaviour_score": result["behaviour_score"],
            "sequence_score": result["sequence_score"],
            "context": {
                "status": result["context"]["status"],
                "multiplier": result["context_multiplier"],
                "info": result["context"]["info"],
            },
            "sequence": {
                "chain_detected": result["sequence"]["chain_detected"],
                "matched_steps": result["sequence"]["matched_steps"],
            },
            "signals": result["signals"],
            "event": result["event"],
        }
        results.append(item)

    reverse = (order == "desc")
    if sort_by == "risk_score":
        results.sort(key=lambda x: x["risk_score"], reverse=reverse)
    elif sort_by == "severity":
        sev_rank = {"CRITICAL": 4, "HIGH": 3, "MODERATE": 2, "MEDIUM": 2, "LOW": 1}
        results.sort(key=lambda x: sev_rank.get(x["severity"], 0), reverse=reverse)
    elif sort_by == "event_id":
        results.sort(key=lambda x: x["event_id"], reverse=reverse)
    else:
        results.sort(key=lambda x: x["timestamp"] or "", reverse=reverse)

    total = len(results)

    if offset_param is not None:
        try:
            offset = max(0, int(offset_param))
            results = results[offset:]
        except ValueError:
            pass

    if limit_param is not None:
        try:
            limit = max(1, int(limit_param))
            results = results[:limit]
        except ValueError:
            pass

    return jsonify({
        "items": results,
        "total": total
    }), 200


if __name__ == "__main__":
    app.run(debug=False, port=5000)
