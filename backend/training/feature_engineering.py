"""Time and season feature engineering shared by training and inference."""

from __future__ import annotations

import pandas as pd

SEASON_MAP = {
    "Winter": 0,
    "Spring": 1,
    "Summer": 2,
    "Monsoon": 3,
    "Autumn": 4,
}


def add_time_features(df: pd.DataFrame, datetime_col: str = "Datetime") -> pd.DataFrame:
    """Extract hour, month, weekday, day, weekend, and season from datetime."""
    out = df.copy()
    if datetime_col not in out.columns:
        now = pd.Timestamp.utcnow()
        out["hour"] = now.hour
        out["month"] = now.month
        out["weekday"] = now.weekday()
        out["day"] = now.day
        out["weekend"] = int(now.weekday() >= 5)
        out["season_code"] = SEASON_MAP.get("Summer", 2)
        return out

    dt = pd.to_datetime(out[datetime_col], errors="coerce")
    out["hour"] = dt.dt.hour
    out["month"] = dt.dt.month
    out["weekday"] = dt.dt.dayofweek
    out["day"] = dt.dt.day
    out["weekend"] = (dt.dt.dayofweek >= 5).astype(int)

    if "Season" in out.columns:
        out["season_code"] = out["Season"].map(SEASON_MAP).fillna(2).astype(int)
    else:
        month = out["month"]
        out["season_code"] = month.map(
            lambda m: 0
            if m in (12, 1, 2)
            else 1
            if m in (3, 4, 5)
            else 2
            if m in (6, 7, 8)
            else 3
            if m in (9, 10)
            else 4
        ).astype(int)

    return out


def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Map raw CSV columns to canonical feature names."""
    rename = {
        "City": "city",
        "State": "state",
        "Temp_2m_C": "temperature",
        "Humidity_Percent": "humidity",
        "Pressure_MSL_hPa": "pressure",
        "Wind_Speed_10m_kmh": "wind_speed",
        "Rain_mm": "rainfall",
        "PM2_5_ugm3": "pm25",
        "PM10_ugm3": "pm10",
        "NO2_ugm3": "no2",
        "SO2_ugm3": "so2",
        "CO_ugm3": "co",
        "O3_ugm3": "o3",
        "US_AQI": "us_aqi",
    }
    existing = {k: v for k, v in rename.items() if k in df.columns}
    return df.rename(columns=existing)
