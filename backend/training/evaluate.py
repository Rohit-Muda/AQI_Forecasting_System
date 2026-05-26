"""Model evaluation metrics."""

from __future__ import annotations

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    return {"mae": mae, "rmse": rmse, "r2": r2}


def compare_metrics(metrics_a: dict[str, float], metrics_b: dict[str, float]) -> str:
    """Return name of better model using RMSE then MAE then R2."""
    if metrics_a["rmse"] < metrics_b["rmse"]:
        return "a"
    if metrics_b["rmse"] < metrics_a["rmse"]:
        return "b"
    if metrics_a["mae"] < metrics_b["mae"]:
        return "a"
    if metrics_b["mae"] < metrics_a["mae"]:
        return "b"
    return "a" if metrics_a["r2"] >= metrics_b["r2"] else "b"
