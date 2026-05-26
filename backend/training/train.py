"""Train Random Forest and XGBoost; save best model and preprocessors."""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from evaluate import compare_metrics, evaluate_model
from preprocess import clean_data, fit_preprocessors, load_raw_data, save_preprocessor, transform_features

RANDOM_STATE = 42
TEST_SIZE = 0.2
MAX_TRAIN_ROWS = 200_000


def prepare_xy(df: pd.DataFrame, artifacts: dict) -> tuple[np.ndarray, np.ndarray]:
    transformed = transform_features(df, artifacts)
    X = transformed[artifacts["feature_columns"]].values.astype(np.float32)
    y = transformed["us_aqi"].values.astype(np.float32)
    return X, y


def main() -> None:
    base = Path(__file__).resolve().parent.parent
    data_path = base / "data" / "INDIA_AQI_COMPLETE_20251126.csv"
    model_dir = base / "app" / "model"

    print("Loading data...")
    raw = load_raw_data(data_path)
    print(f"Raw shape: {raw.shape}")

    print("Cleaning data...")
    cleaned = clean_data(raw)
    print(f"Cleaned shape: {cleaned.shape}")

    if len(cleaned) > MAX_TRAIN_ROWS:
        cleaned = cleaned.sample(n=MAX_TRAIN_ROWS, random_state=RANDOM_STATE)
        print(f"Sampled to {MAX_TRAIN_ROWS} rows for training efficiency.")

    print("Fitting preprocessors...")
    processed, artifacts = fit_preprocessors(cleaned)

    X, y = prepare_xy(processed, artifacts)
    assert not np.isnan(X).any(), "NaN values remain in features"
    assert not np.isnan(y).any(), "NaN values remain in target"

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )

    print("Training Random Forest...")
    rf = RandomForestRegressor(
        n_estimators=120,
        max_depth=18,
        min_samples_leaf=5,
        n_jobs=-1,
        random_state=RANDOM_STATE,
    )
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_metrics = evaluate_model(y_test, rf_pred)
    print("Random Forest metrics:", rf_metrics)

    print("Training XGBoost...")
    xgb = XGBRegressor(
        n_estimators=200,
        max_depth=8,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="reg:squarederror",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    xgb.fit(X_train, y_train)
    xgb_pred = xgb.predict(X_test)
    xgb_metrics = evaluate_model(y_test, xgb_pred)
    print("XGBoost metrics:", xgb_metrics)

    winner = compare_metrics(rf_metrics, xgb_metrics)
    best_model = rf if winner == "a" else xgb
    best_name = "RandomForest" if winner == "a" else "XGBoost"
    best_metrics = rf_metrics if winner == "a" else xgb_metrics
    print(f"Selected model: {best_name}")

    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, model_dir / "model.pkl")
    save_preprocessor(artifacts, model_dir / "preprocessor.pkl")
    print(f"Metrics — {best_name}: {best_metrics}")

    sample = {
        "city": "Delhi",
        "state": "Delhi",
        "temperature": 30.0,
        "humidity": 60.0,
        "pressure": 1012.0,
        "wind_speed": 12.0,
        "rainfall": 1.0,
        "pm25": 120.0,
        "pm10": 170.0,
        "no2": 35.0,
        "so2": 10.0,
        "co": 197.0,
        "o3": 40.0,
    }
    row = pd.DataFrame([sample])
    row = transform_features(row, artifacts)
    pred = float(best_model.predict(row[artifacts["feature_columns"]].values)[0])
    print(f"Sanity prediction: {pred:.1f}")
    print("Training complete.")


if __name__ == "__main__":
    main()
