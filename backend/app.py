"""
app.py

Minimal Flask API exposing:

    GET /api/events/<event_id>/risk/

No database, no auth, no queues — a thin HTTP layer over processor.py.
"""

from flask import Flask, jsonify

from processor import process_event, EventNotFoundError

app = Flask(__name__)


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
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
