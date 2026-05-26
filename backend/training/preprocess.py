"""Data cleaning and preprocessing pipeline."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

from feature_engineering import add_time_features, normalize_column_names

NUMERIC_FEATURES = [
    "temperature",
    "humidity",
    "pressure",
    "wind_speed",
    "rainfall",
    "pm25",
    "pm10",
    "no2",
    "so2",
    "co",
    "o3",
    "hour",
    "month",
    "weekday",
    "day",
    "weekend",
    "season_code",
]

CATEGORICAL_FEATURES = ["city", "state"]

MIN_AQI = 0
MAX_AQI = 500


def load_raw_data(data_path: Path) -> pd.DataFrame:
    return pd.read_csv(data_path)


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Remove duplicates, invalid AQI, fix dtypes, handle outliers."""
    out = normalize_column_names(df)
    out = out.drop_duplicates()

    if "us_aqi" in out.columns:
        out["us_aqi"] = pd.to_numeric(out["us_aqi"], errors="coerce")
        out = out.dropna(subset=["us_aqi"])
        out = out[(out["us_aqi"] >= MIN_AQI) & (out["us_aqi"] <= MAX_AQI)]

    if "Datetime" in df.columns:
        out["Datetime"] = pd.to_datetime(df["Datetime"], errors="coerce")

    out = add_time_features(out, datetime_col="Datetime" if "Datetime" in out.columns else "")

    for col in NUMERIC_FEATURES:
        if col in out.columns:
            out[col] = pd.to_numeric(out[col], errors="coerce")

    for col in CATEGORICAL_FEATURES:
        if col in out.columns:
            out[col] = out[col].astype(str).str.strip()
            out[col] = out[col].replace({"": np.nan, "nan": np.nan})

    pollutant_cols = ["pm25", "pm10", "no2", "so2", "co", "o3"]
    for col in pollutant_cols:
        if col in out.columns:
            out[col] = out[col].clip(lower=0)
            q1, q99 = out[col].quantile(0.01), out[col].quantile(0.99)
            out[col] = out[col].clip(lower=q1, upper=q99)

    return out


def fit_preprocessors(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Impute missing values and encode categoricals; return artifacts."""
    out = df.copy()
    artifacts: dict[str, Any] = {
        "numeric_features": NUMERIC_FEATURES.copy(),
        "categorical_features": CATEGORICAL_FEATURES.copy(),
        "medians": {},
        "label_encoders": {},
        "cities": [],
    }

    for col in NUMERIC_FEATURES:
        if col not in out.columns:
            out[col] = 0.0
        median_val = float(out[col].median())
        if np.isnan(median_val):
            median_val = 0.0
        artifacts["medians"][col] = median_val
        out[col] = out[col].fillna(median_val)

    for col in CATEGORICAL_FEATURES:
        if col not in out.columns:
            out[col] = "Unknown"
        out[col] = out[col].fillna("Unknown").astype(str)
        le = LabelEncoder()
        le.fit(out[col].astype(str))
        artifacts["label_encoders"][col] = le
        out[f"{col}_encoded"] = le.transform(out[col].astype(str))

    artifacts["cities"] = sorted(out["city"].unique().tolist()) if "city" in out.columns else []
    if "city" in out.columns and "state" in out.columns:
        artifacts["city_to_state"] = (
            out.groupby("city")["state"]
            .agg(lambda s: s.mode().iloc[0] if len(s.mode()) else s.iloc[0])
            .to_dict()
        )
    else:
        artifacts["city_to_state"] = {}
    artifacts["feature_columns"] = NUMERIC_FEATURES + [f"{c}_encoded" for c in CATEGORICAL_FEATURES]

    for col in artifacts["feature_columns"]:
        if col not in out.columns:
            out[col] = 0.0

    return out, artifacts


def transform_features(df: pd.DataFrame, artifacts: dict[str, Any]) -> pd.DataFrame:
    """Apply saved preprocessing to new data."""
    out = normalize_column_names(df) if "city" not in df.columns and "City" in df.columns else df.copy()
    out = add_time_features(
        out,
        datetime_col="Datetime" if "Datetime" in out.columns else "",
    )

    for col in artifacts["numeric_features"]:
        if col not in out.columns:
            out[col] = artifacts["medians"].get(col, 0.0)
        out[col] = pd.to_numeric(out[col], errors="coerce")
        out[col] = out[col].fillna(artifacts["medians"].get(col, 0.0))

    for col in artifacts["categorical_features"]:
        if col not in out.columns:
            out[col] = "Unknown"
        out[col] = out[col].fillna("Unknown").astype(str)
        le: LabelEncoder = artifacts["label_encoders"][col]
        known = set(le.classes_)
        out[col] = out[col].apply(lambda x: x if x in known else le.classes_[0])
        out[f"{col}_encoded"] = le.transform(out[col].astype(str))

    for col in artifacts["feature_columns"]:
        if col not in out.columns:
            out[col] = 0.0

    return out


def save_preprocessor(artifacts: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifacts, path)
