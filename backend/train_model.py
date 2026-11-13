"""Train and evaluate the crop classifier from the supplied source CSV."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET = ROOT / "datasets" / "crop_recommendation.csv"
DEFAULT_MODEL = ROOT / "models" / "crop_recommendation.joblib"
FEATURES = ["nitrogen", "phosphorus", "potassium", "temperature", "humidity", "ph", "rainfall"]
ALIASES = {
    "nitrogen": {"nitrogen", "n"}, "phosphorus": {"phosphorus", "phosphorous", "p"},
    "potassium": {"potassium", "k"}, "temperature": {"temperature", "temp"},
    "humidity": {"humidity"}, "ph": {"ph", "soilph"},
    "rainfall": {"rainfall", "rain"}, "label": {"label", "crop", "cropname", "target"},
}


def normalize_column(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(name).strip().lower())


def resolve_columns(columns: list[str]) -> dict[str, str]:
    normalized = {normalize_column(column): column for column in columns}
    resolved: dict[str, str] = {}
    for target, aliases in ALIASES.items():
        match = next((normalized[alias] for alias in aliases if alias in normalized), None)
        if match is None:
            raise ValueError(
                f"Could not identify the '{target}' column. Actual CSV columns: {columns}. "
                f"Accepted names: {sorted(aliases)}"
            )
        resolved[target] = match
    return resolved


def train(dataset_path: Path = DEFAULT_DATASET, model_path: Path = DEFAULT_MODEL) -> dict[str, object]:
    if not dataset_path.is_file():
        raise FileNotFoundError(
            f"Dataset not found: {dataset_path}. Add the genuine crop_recommendation.csv; "
            "the project intentionally does not generate synthetic crop labels."
        )
    try:
        frame = pd.read_csv(dataset_path)
    except pd.errors.EmptyDataError as exc:
        raise ValueError(
            f"Dataset is empty: {dataset_path}. Add the supplied crop data before training."
        ) from exc
    if frame.empty:
        raise ValueError("The crop dataset contains headers but no data rows.")
    mapping = resolve_columns(list(frame.columns))
    data = frame[[mapping[field] for field in FEATURES] + [mapping["label"]]].copy()
    data.columns = FEATURES + ["label"]
    for feature in FEATURES:
        data[feature] = pd.to_numeric(data[feature], errors="coerce")
    data["label"] = data["label"].astype("string").str.strip()
    data = data.dropna(subset=FEATURES + ["label"])
    data = data[data["label"] != ""]
    if data.empty:
        raise ValueError("No valid complete rows remain after numeric and missing-value validation.")
    class_counts = data["label"].value_counts()
    if len(class_counts) < 2:
        raise ValueError("At least two crop classes are required for classification.")
    can_stratify = class_counts.min() >= 2 and len(data) >= 10
    x_train, x_test, y_train, y_test = train_test_split(
        data[FEATURES], data["label"], test_size=0.2, random_state=42,
        stratify=data["label"] if can_stratify else None,
    )
    model = RandomForestClassifier(n_estimators=300, random_state=42, class_weight="balanced")
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    accuracy = float(accuracy_score(y_test, predictions))
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({
        "model": model,
        "features": FEATURES,
        "classes": [str(label) for label in model.classes_],
        "source_dataset": dataset_path.name,
        "test_accuracy": accuracy,
        "test_rows": int(len(y_test)),
        "training_rows": int(len(y_train)),
        "source_columns": list(frame.columns),
    }, model_path)
    print(f"Rows used: {len(data)} (training={len(y_train)}, test={len(y_test)})")
    print(f"Holdout accuracy: {accuracy:.4f} (measured on this dataset split)")
    print(classification_report(y_test, predictions, zero_division=0))
    print(f"Saved model: {model_path}")
    return {"accuracy": accuracy, "rows": len(data), "model_path": str(model_path)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    args = parser.parse_args()
    train(args.dataset, args.model)
