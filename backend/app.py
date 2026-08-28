"""
app.py

Minimal Flask API exposing:

    GET /api/events/<event_id>/risk/

No database, no auth, no queues — a thin HTTP layer over processor.py.
"""

from datetime import datetime
from flask import Flask, jsonify, request

from .data_loader import store
from .processor import process_event, ingest_and_process_event, EventNotFoundError
from .analyzer import get_security_analysis, get_analytics_data
from .incident_correlation import get_all_incidents, get_incident_by_id
from .ml import is_ml_available, get_model, FEATURE_NAMES
from .telemetry import simulator
from .ml.registry.model_registry import model_registry
from .ml.dataset_builder import feedback_builder
from .ml.trainer import train_candidate_model
from .llm import generate_narrative



app = Flask(__name__)

_NARRATIVE_CACHE = {}


@app.route("/", methods=["GET"])
def service_root():
    return jsonify({"service": "sentinel", "status": "ok", "health": "/api/health"}), 200


@app.after_request
def allow_frontend_origin(response):
    origin = request.headers.get("Origin")
    if origin in {"http://localhost:3000", "http://127.0.0.1:3000"}:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response



@app.route("/api/events/<event_id>/risk/", methods=["GET"])
def get_event_risk(event_id):
    with_narrative = request.args.get("narrative", "").lower() in ("true", "1")
    try:
        result = process_event(event_id, with_narrative=with_narrative)
    except EventNotFoundError:
        return jsonify({
            "error": "event_not_found",
            "message": f"Event '{event_id}' does not exist.",
            "event_id": event_id,
        }), 404

    return jsonify(result), 200


@app.route("/api/events/<event_id>/narrative", methods=["GET"])
@app.route("/events/<event_id>/narrative", methods=["GET"])
def get_event_narrative_endpoint(event_id):
    refresh = request.args.get("refresh", "").lower() in ("true", "1")
    try:
        result = process_event(event_id)
    except EventNotFoundError:
        return jsonify({
            "error": "event_not_found",
            "message": f"Event '{event_id}' does not exist.",
            "event_id": event_id,
        }), 404

    cache_key = f"event:{event_id}:{result.get('risk_score')}:{result.get('severity')}"
    if not refresh and cache_key in _NARRATIVE_CACHE:
        cached_entry = _NARRATIVE_CACHE[cache_key]
        return jsonify({
            "event_id": event_id,
            "narrative": cached_entry.get("narrative"),
            "narrative_status": cached_entry.get("narrative_status", "ok"),
            "model": cached_entry.get("model"),
            "cached": True,
        }), 200

    if generate_narrative:
        narrative_res = generate_narrative(result, kind="event")
    else:
        narrative_res = {"narrative_status": "unavailable", "narrative": None, "error": "LLM client unavailable"}

    if narrative_res.get("narrative_status") == "ok":
        _NARRATIVE_CACHE[cache_key] = narrative_res

    return jsonify({
        "event_id": event_id,
        "narrative": narrative_res.get("narrative"),
        "narrative_status": narrative_res.get("narrative_status", "unavailable"),
        "model": narrative_res.get("model"),
        "cached": False,
        "error": narrative_res.get("error"),
    }), 200


@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "events": len(store.events_by_id), "users": len(store.users_by_id), "contexts": len(store.contexts)}), 200


@app.route("/api/security-analysis", methods=["GET"])
@app.route("/security-analysis", methods=["GET"])
@app.route("/api/dashboard", methods=["GET"])
@app.route("/dashboard", methods=["GET"])
def security_analysis_endpoint():
    return jsonify(get_security_analysis()), 200


@app.route("/api/analytics", methods=["GET"])
@app.route("/analytics", methods=["GET"])
def analytics_endpoint():
    return jsonify(get_analytics_data()), 200


@app.route("/api/events", methods=["GET"])
@app.route("/events", methods=["GET"])
def events_endpoint():
    user_id = request.args.get("user_id")
    analysis = get_security_analysis()
    events = analysis.get("live_stream", [])
    if user_id:
        events = [e for e in events if e.get("user_id", "").lower() == user_id.lower()]
    return jsonify(events), 200


@app.route("/identities", methods=["GET"])
@app.route("/api/identities", methods=["GET"])
def identities():
    analysis = get_security_analysis()
    return jsonify(analysis.get("top_identities", [])), 200


@app.route("/identities/<user_id>", methods=["GET"])
@app.route("/api/identities/<user_id>", methods=["GET"])
def identity_detail(user_id):
    analysis = get_security_analysis()
    for ident in analysis.get("top_identities", []):
        if ident.get("user_id", "").lower() == user_id.lower():
            return jsonify(ident), 200
    return jsonify({"error": "identity_not_found", "user_id": user_id}), 404


@app.route("/api/alerts", methods=["GET"])
def alerts():
    results = []
    for event_id in store.get_all_event_ids():
        try:
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
        except Exception:
            continue
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
    for raw_event in store.get_all_events():
        event_id = raw_event.get("event_id")
        if not event_id:
            continue
        if user_id_param and raw_event.get("user_id", "").lower() != user_id_param.lower():
            continue
        if event_type_param and raw_event.get("event_type", "").lower() != event_type_param.lower():
            continue
        event_dt = raw_event.get("_parsed_timestamp")
        if start_dt and event_dt and event_dt < start_dt:
            continue
        if end_dt and event_dt and event_dt > end_dt:
            continue

        try:
            result = process_event(event_id)
        except Exception:
            continue

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


@app.route("/api/ml/status", methods=["GET"])
@app.route("/ml/status", methods=["GET"])
def ml_status():
    available = is_ml_available()
    model = get_model()
    return jsonify({
        "available": available,
        "status": "loaded" if available else "unavailable",
        "model_name": getattr(model, "model_name", "RandomForestClassifier") if model else None,
        "model_version": getattr(model, "version", "1.0.0") if model else None,
        "trained_at": getattr(model, "trained_at", None) if model else None,
        "features": FEATURE_NAMES,
        "training_metadata": getattr(model, "training_metadata", {}) if model else {},
    }), 200


@app.route("/api/incidents", methods=["GET"])
@app.route("/incidents", methods=["GET"])
def incidents_list():
    incidents = get_all_incidents()
    return jsonify(incidents), 200


@app.route("/api/incidents/<incident_id>", methods=["GET"])
@app.route("/incidents/<incident_id>", methods=["GET"])
def incident_detail(incident_id):
    inc = get_incident_by_id(incident_id)
    if inc is None:
        return jsonify({"error": "incident_not_found", "incident_id": incident_id}), 404
    return jsonify(inc), 200


@app.route("/api/incidents/<incident_id>/narrative", methods=["GET"])
@app.route("/incidents/<incident_id>/narrative", methods=["GET"])
def get_incident_narrative_endpoint(incident_id):
    refresh = request.args.get("refresh", "").lower() in ("true", "1")
    inc = get_incident_by_id(incident_id)
    if inc is None:
        return jsonify({"error": "incident_not_found", "incident_id": incident_id}), 404

    cache_key = f"incident:{incident_id}:{inc.get('max_risk_score')}:{inc.get('event_count')}"
    if not refresh and cache_key in _NARRATIVE_CACHE:
        cached_entry = _NARRATIVE_CACHE[cache_key]
        return jsonify({
            "incident_id": incident_id,
            "narrative": cached_entry.get("narrative"),
            "narrative_status": cached_entry.get("narrative_status", "ok"),
            "model": cached_entry.get("model"),
            "cached": True,
        }), 200

    if generate_narrative:
        narrative_res = generate_narrative(inc, kind="incident")
    else:
        narrative_res = {"narrative_status": "unavailable", "narrative": None, "error": "LLM client unavailable"}

    if narrative_res.get("narrative_status") == "ok":
        _NARRATIVE_CACHE[cache_key] = narrative_res

    return jsonify({
        "incident_id": incident_id,
        "narrative": narrative_res.get("narrative"),
        "narrative_status": narrative_res.get("narrative_status", "unavailable"),
        "model": narrative_res.get("model"),
        "cached": False,
        "error": narrative_res.get("error"),
    }), 200


# =========================================================================
# PLANE A: LIVE INGESTION & TELEMETRY SIMULATION ENDPOINTS
# =========================================================================

@app.route("/api/events", methods=["POST"])
@app.route("/events", methods=["POST"])
def ingest_event():
    payload = request.get_json(silent=True)
    if not payload or not isinstance(payload, dict):
        return jsonify({"error": "invalid_payload", "message": "Expected JSON event object."}), 400

    try:
        res = ingest_and_process_event(payload)
        return jsonify(res), 201
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "processing_error", "message": str(e)}), 500


@app.route("/api/events/live", methods=["GET"])
@app.route("/events/live", methods=["GET"])
def live_events():
    limit_param = request.args.get("limit", "50")
    try:
        limit = max(1, min(200, int(limit_param)))
    except ValueError:
        limit = 50

    analysis = get_security_analysis()
    events = analysis.get("live_stream", [])[:limit]
    return jsonify({"events": events, "count": len(events)}), 200


@app.route("/api/simulation/status", methods=["GET"])
@app.route("/simulation/status", methods=["GET"])
def simulation_status():
    return jsonify(simulator.get_status()), 200


@app.route("/api/simulation/start", methods=["POST"])
@app.route("/simulation/start", methods=["POST"])
def simulation_start():
    data = request.get_json(silent=True) or {}
    mode = data.get("mode", "mixed")
    interval = data.get("interval_ms", 2000)
    status = simulator.start(mode=mode, interval_ms=interval)
    return jsonify(status), 200


@app.route("/api/simulation/pause", methods=["POST"])
@app.route("/simulation/pause", methods=["POST"])
def simulation_pause():
    return jsonify(simulator.pause()), 200


@app.route("/api/simulation/stop", methods=["POST"])
@app.route("/simulation/stop", methods=["POST"])
def simulation_stop():
    return jsonify(simulator.stop()), 200


@app.route("/api/simulation/reset", methods=["POST"])
@app.route("/simulation/reset", methods=["POST"])
def simulation_reset():
    return jsonify(simulator.reset()), 200


@app.route("/api/simulation/step", methods=["POST"])
@app.route("/simulation/step", methods=["POST"])
def simulation_step():
    data = request.get_json(silent=True) or {}
    mode = data.get("mode")
    try:
        result = simulator.step(mode=mode)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "step_failed", "message": str(e)}), 500


# =========================================================================
# PLANE B: CONTROLLED LEARNING & MODEL REGISTRY ENDPOINTS
# =========================================================================

@app.route("/api/feedback", methods=["POST"])
@app.route("/feedback", methods=["POST"])
def record_analyst_feedback():
    payload = request.get_json(silent=True) or {}
    event_id = payload.get("event_id") or payload.get("identity_id") or payload.get("user_id")
    user_id = payload.get("user_id", "U001")
    decision = payload.get("decision", "CONFIRM_THREAT")
    analyst = payload.get("analyst", "SOC Analyst")
    comment = payload.get("comment", "")

    if not event_id:
        return jsonify({"error": "missing_event_id", "message": "event_id or user_id required."}), 400

    try:
        entry = feedback_builder.record_feedback(
            event_id=event_id,
            user_id=user_id,
            decision=decision,
            analyst=analyst,
            comment=comment,
        )
        return jsonify({
            "success": True,
            "message": f"Feedback '{decision}' recorded successfully for {event_id}.",
            "feedback_entry": entry,
        }), 201
    except ValueError as e:
        return jsonify({"error": "invalid_feedback", "message": str(e)}), 400


@app.route("/api/ml/registry", methods=["GET"])
@app.route("/ml/registry", methods=["GET"])
def get_ml_registry():
    return jsonify({
        "active_version": model_registry.get_active_version(),
        "previous_version": model_registry._data.get("previous_version"),
        "versions": model_registry.get_all_versions(),
    }), 200


@app.route("/api/ml/train-candidate", methods=["POST"])
@app.route("/ml/train-candidate", methods=["POST"])
def train_candidate():
    payload = request.get_json(silent=True) or {}
    version = payload.get("version")
    description = payload.get("description", "")

    try:
        res = train_candidate_model(version=version, description=description)
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": "training_failed", "message": str(e)}), 500


@app.route("/api/ml/promote", methods=["POST"])
@app.route("/ml/promote", methods=["POST"])
def promote_model():
    payload = request.get_json(silent=True) or {}
    version = payload.get("version")
    override = bool(payload.get("override", False))

    if not version:
        return jsonify({"error": "missing_version", "message": "version is required."}), 400

    res = model_registry.promote_candidate(version, override=override)
    status_code = 200 if res.get("success") else 400
    return jsonify(res), status_code


@app.route("/api/ml/rollback", methods=["POST"])
@app.route("/ml/rollback", methods=["POST"])
def rollback_model():
    res = model_registry.rollback()
    status_code = 200 if res.get("success") else 400
    return jsonify(res), status_code


if __name__ == "__main__":
    app.run(debug=False, port=5000)
