"""
app.py

Minimal Flask API exposing:

    GET /api/events/<event_id>/risk/

No database, no auth, no queues — a thin HTTP layer over processor.py.
"""

from flask import Flask, jsonify, request

try:
    from .data_loader import store
    from .processor import process_event, EventNotFoundError
    from .response_workflow import InvalidTransitionError, workflow
except ImportError:
    from data_loader import store
    from processor import process_event, EventNotFoundError
    from response_workflow import InvalidTransitionError, workflow

app = Flask(__name__)
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
    try:
        result = process_event(event_id)
    except EventNotFoundError:
        return jsonify({
            "error": "event_not_found",
            "message": f"Event '{event_id}' does not exist.",
            "event_id": event_id,
        }), 404

    return jsonify(result), 200


@app.route("/api/events/<event_id>/response/", methods=["GET", "POST"])
def event_response(event_id):
    try:
        if request.method == "GET":
            return jsonify(workflow.get_or_create(event_id).to_public()), 200

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict) or not isinstance(payload.get("decision"), str):
            return jsonify({"error": "invalid_request", "message": "A decision of APPROVE, REJECT, or EXECUTE is required."}), 400

        record = workflow.decide(event_id, payload["decision"].upper())
        return jsonify(record.to_public()), 200
    except EventNotFoundError:
        return jsonify({
            "error": "event_not_found",
            "message": f"Event '{event_id}' does not exist.",
            "event_id": event_id,
        }), 404
    except ValueError as error:
        return jsonify({"error": "invalid_request", "message": str(error)}), 400
    except InvalidTransitionError as error:
        return jsonify({"error": "invalid_transition", "message": str(error), "event_id": event_id}), 409


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


if __name__ == "__main__":
    app.run(debug=False, port=5000)
