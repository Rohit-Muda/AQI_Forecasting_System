from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.config import MODEL_PATH, PREPROCESSOR_PATH

_model = None
_preprocessor: dict[str, Any] | None = None

_TRAINING_DIR = Path(__file__).resolve().parent.parent / "training"


def _transform(df: pd.DataFrame, artifacts: dict[str, Any]) -> pd.DataFrame:
    if str(_TRAINING_DIR) not in sys.path:
        sys.path.insert(0, str(_TRAINING_DIR))
    from preprocess import transform_features

    return transform_features(df, artifacts)


def load_artifacts() -> bool:
    global _model, _preprocessor
    if not MODEL_PATH.exists() or not PREPROCESSOR_PATH.exists():
        _model = None
        _preprocessor = None
        return False
    try:
        _model = joblib.load(MODEL_PATH)
        _preprocessor = joblib.load(PREPROCESSOR_PATH)
        return True
    except Exception:
        _model = None
        _preprocessor = None
        return False


def is_model_loaded() -> bool:
    return _model is not None and _preprocessor is not None


def get_cities() -> list[str]:
    return list((_preprocessor or {}).get("cities", []))


def predict_aqi(payload: dict[str, Any]) -> float:
    if not is_model_loaded():
        raise RuntimeError("Model is not loaded.")

    city = payload["city"]
    state = (_preprocessor or {}).get("city_to_state", {}).get(city, "Unknown")

    row = pd.DataFrame([{**payload, "state": state}])
    features = _preprocessor["feature_columns"]
    X = _transform(row, _preprocessor)[features].to_numpy(dtype=np.float32)

    if np.isnan(X).any():
        raise ValueError("Invalid input values.")

    value = float(_model.predict(X)[0])
    return float(np.clip(value, 0, 500))
