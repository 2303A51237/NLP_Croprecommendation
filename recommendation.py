"""Load a trained artifact and rank crop classes for confirmed measurements."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = ROOT / "models" / "crop_recommendation.joblib"
FEATURES = ["nitrogen", "phosphorus", "potassium", "temperature", "humidity", "ph", "rainfall"]
BOUNDS = {
    "nitrogen": (0, 300), "phosphorus": (0, 300), "potassium": (0, 300),
    "temperature": (-10, 60), "humidity": (0, 100), "ph": (0, 14), "rainfall": (0, 5000),
}


class ModelUnavailableError(RuntimeError):
    pass


def validate_values(values: Any) -> dict[str, float]:
    if not isinstance(values, dict):
        raise ValueError("'values' must be an object containing the seven measurements.")
    cleaned: dict[str, float] = {}
    for field in FEATURES:
        raw = values.get(field)
        if raw is None or isinstance(raw, bool):
            raise ValueError(f"'{field}' is required; enter a measured value before requesting recommendations.")
        try:
            number = float(raw)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"'{field}' must be a number.") from exc
        if not pd.notna(number):
            raise ValueError(f"'{field}' must be a finite number.")
        low, high = BOUNDS[field]
        if not low <= number <= high:
            raise ValueError(f"'{field}' must be between {low} and {high}.")
        cleaned[field] = number
    return cleaned


def recommend(values: dict[str, float], model_path: Path = DEFAULT_MODEL, limit: int = 3) -> dict[str, Any]:
    if not model_path.is_file():
        raise ModelUnavailableError(
            "The crop model has not been trained. Supply the real crop dataset and run backend/train_model.py first."
        )
    artifact = joblib.load(model_path)
    model = artifact.get("model")
    if model is None or not hasattr(model, "predict_proba"):
        raise ModelUnavailableError("The saved model artifact is invalid. Retrain it using backend/train_model.py.")
    ordered = {field: values[field] for field in FEATURES}
    probabilities = model.predict_proba(pd.DataFrame([ordered], columns=FEATURES))[0]
    ranked = sorted(zip(model.classes_, probabilities), key=lambda item: float(item[1]), reverse=True)[:limit]
    return {
        "recommendations": [
            {"crop": str(crop), "vote_share": round(float(score) * 100, 2)}
            for crop, score in ranked
        ],
        "confidence_note": (
            "Vote share is the fraction of Random Forest trees voting for a crop, not a calibrated probability "
            "or a guarantee of yield. Confirm local agronomic suitability."
        ),
        "model_evaluation": {
            "holdout_accuracy": artifact.get("test_accuracy"),
            "holdout_rows": artifact.get("test_rows"),
            "source_dataset": artifact.get("source_dataset"),
        },
        "explanation": "Ranking uses the confirmed soil nutrient, temperature, humidity, pH, and rainfall values against the supplied training dataset.",
    }
