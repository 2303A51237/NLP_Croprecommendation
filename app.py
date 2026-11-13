"""Flask REST API for narrative analysis and crop recommendation."""

from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS

from nlp_processor import analyze_description
from recommendation import ModelUnavailableError, recommend, validate_values

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "AgriNLP API"})


@app.post("/api/analyze")
def analyze():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400
    description = body.get("description")
    if not isinstance(description, str) or not description.strip():
        return jsonify({"error": "A non-empty 'description' is required."}), 400
    if len(description) > 5000:
        return jsonify({"error": "Description must be 5,000 characters or fewer."}), 400
    return jsonify(analyze_description(description.strip()))


@app.post("/api/recommend")
def crop_recommendation():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400
    try:
        values = validate_values(body.get("values"))
        result = recommend(values)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except ModelUnavailableError as exc:
        return jsonify({"error": str(exc), "code": "model_unavailable"}), 503
    except (OSError, KeyError, TypeError) as exc:
        app.logger.exception("Unable to use the trained model")
        return jsonify({"error": "The model artifact could not be loaded. Retrain the model and try again."}), 500
    return jsonify(result)


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"error": "Request is too large."}), 413


@app.errorhandler(500)
def internal_error(_error):
    return jsonify({"error": "Unexpected server error."}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
