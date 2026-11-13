"""Conservative, rule-based extraction for English farmer narratives.

This module extracts only values explicitly present in text; it never infers
soil measurements or weather from vague descriptions.
"""

from __future__ import annotations

import re
from typing import Any

from nltk.tokenize import wordpunct_tokenize

NUMERIC_FIELDS = ("nitrogen", "phosphorus", "potassium", "temperature", "humidity", "ph", "rainfall")
FIELD_ALIASES = {
    "nitrogen": (r"nitrogen", r"\bn\b"),
    "phosphorus": (r"phosphorus", r"phosphate", r"\bp\b"),
    "potassium": (r"potassium", r"potash", r"\bk\b"),
    "temperature": (r"temperature", r"temp\.?"),
    "humidity": (r"humidity", r"relative humidity"),
    "ph": (r"\bp\s*h\b", r"acidity"),
    "rainfall": (r"rainfall", r"rain\s*(?:fall)?"),
}
RANGES = {
    "nitrogen": (0, 300),
    "phosphorus": (0, 300),
    "potassium": (0, 300),
    "temperature": (-10, 60),
    "humidity": (0, 100),
    "ph": (0, 14),
    "rainfall": (0, 5000),
}


def clean_text(text: str) -> str:
    """Normalize whitespace and tokenize without requiring downloaded models."""
    tokens = wordpunct_tokenize(text.lower())
    return " ".join(tokens)


def _extract_number(text: str, aliases: tuple[str, ...]) -> float | None:
    number = r"(-?\d+(?:\.\d+)?)"
    for alias in aliases:
        patterns = (
            rf"(?:{alias})\s*(?:is|of|=|:)?\s*{number}",
            rf"{number}\s*(?:mg/kg|kg/ha|°?c|%|mm)?\s*(?:for|of)?\s*(?:{alias})",
        )
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                value = float(match.group(1))
                if RANGES[_field_for_alias(aliases)][0] <= value <= RANGES[_field_for_alias(aliases)][1]:
                    return value
    return None


def _field_for_alias(aliases: tuple[str, ...]) -> str:
    for field, candidates in FIELD_ALIASES.items():
        if candidates is aliases or candidates == aliases:
            return field
    raise ValueError("Unknown numeric field aliases")


def _extract_category(text: str, choices: dict[str, tuple[str, ...]]) -> str | None:
    for value, keywords in choices.items():
        if any(re.search(rf"\b{re.escape(keyword)}\b", text, flags=re.IGNORECASE) for keyword in keywords):
            return value
    return None


def analyze_description(description: str) -> dict[str, Any]:
    """Return explicitly found fields plus missing model inputs."""
    cleaned = clean_text(description)
    extracted: dict[str, Any] = {
        field: _extract_number(description, aliases)
        for field, aliases in FIELD_ALIASES.items()
    }
    extracted.update({
        "soil_type": _extract_category(description, {
            "sandy": ("sandy",), "clay": ("clay", "clayey"),
            "loamy": ("loamy", "loam"), "silt": ("silt", "silty"),
            "black": ("black soil",), "red": ("red soil",),
        }),
        "water_availability": _extract_category(description, {
            "low": ("low water", "limited water", "water scarce", "scarce water"),
            "medium": ("moderate water", "medium water"),
            "high": ("abundant water", "plenty of water", "high water"),
        }),
        "rainfall_level": _extract_category(description, {
            "low": ("low rainfall", "less rain", "little rain"),
            "medium": ("moderate rainfall", "medium rainfall"),
            "high": ("high rainfall", "heavy rainfall", "heavy rain"),
        }),
        "season": _extract_category(description, {
            "kharif": ("kharif",), "rabi": ("rabi",),
            "summer": ("summer",), "monsoon": ("monsoon",),
        }),
    })
    missing = [field for field in NUMERIC_FIELDS if extracted[field] is None]
    return {
        "extracted": extracted,
        "missing_fields": missing,
        "cleaned_text": cleaned,
        "language_support": "English extraction only. Telugu interface translation is available, but Telugu narrative extraction is not implemented.",
    }
