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
_explainer = None  # shap.TreeExplainer — cached at startup

_TRAINING_DIR = Path(__file__).resolve().parent.parent / "training"

# Human-readable labels for the 18 model feature columns
_FEATURE_LABELS: dict[str, str] = {
    "temperature": "Temperature",
    "humidity": "Humidity",
    "pressure": "Pressure",
    "wind_speed": "Wind Speed",
    "rainfall": "Rainfall",
    "pm25": "PM2.5",
    "pm10": "PM10",
    "no2": "NO2",
    "so2": "SO2",
    "co": "CO",
    "o3": "O3",
    "hour": "Hour of Day",
    "month": "Month",
    "weekday": "Weekday",
    "day": "Day",
    "weekend": "Weekend",
    "season_code": "Season",
    "city_encoded": "City",
    "state_encoded": "State",
}


def _transform(df: pd.DataFrame, artifacts: dict[str, Any]) -> pd.DataFrame:
    if str(_TRAINING_DIR) not in sys.path:
        sys.path.insert(0, str(_TRAINING_DIR))
    from preprocess import transform_features

    return transform_features(df, artifacts)


def load_artifacts() -> bool:
    global _model, _preprocessor, _explainer
    if not MODEL_PATH.exists() or not PREPROCESSOR_PATH.exists():
        _model = None
        _preprocessor = None
        _explainer = None
        return False
    try:
        _model = joblib.load(MODEL_PATH)
        _preprocessor = joblib.load(PREPROCESSOR_PATH)

        # Cache the SHAP explainer at startup — TreeExplainer is fast for XGBoost
        try:
            import shap
            _explainer = shap.TreeExplainer(_model)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning(
                "SHAP explainer init failed (SHAP may not be installed): %s", exc
            )
            _explainer = None

        return True
    except Exception:
        _model = None
        _preprocessor = None
        _explainer = None
        return False


def is_model_loaded() -> bool:
    return _model is not None and _preprocessor is not None


def get_cities() -> list[str]:
    return list((_preprocessor or {}).get("cities", []))


def predict_aqi(payload: dict[str, Any]) -> tuple[float, list[dict]]:
    """Return (predicted_aqi_float, shap_contributions).

    shap_contributions is a list of dicts:
      [{"feature": str, "impact": float, "percent": float}, ...]
    sorted by absolute impact, top 4.
    Returns empty list if SHAP explainer is unavailable.
    """
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
    aqi = float(np.clip(value, 0, 500))

    # ── SHAP contributions ───────────────────────────────────────────────────
    shap_contributions: list[dict] = []
    if _explainer is not None:
        try:
            shap_vals = _explainer.shap_values(X)  # shape (1, n_features)
            vals = shap_vals[0]  # 1-D array, one value per feature
            abs_vals = np.abs(vals)
            total = float(abs_vals.sum()) or 1.0

            # Sort by absolute impact, take top 4
            top_idx = np.argsort(abs_vals)[::-1][:4]
            for idx in top_idx:
                feat_name = features[idx]
                impact = float(vals[idx])
                pct = round(float(abs_vals[idx]) / total * 100, 1)
                shap_contributions.append(
                    {
                        "feature": _FEATURE_LABELS.get(feat_name, feat_name),
                        "impact": round(impact, 3),
                        "percent": pct,
                    }
                )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("SHAP computation failed: %s", exc)

    return aqi, shap_contributions
