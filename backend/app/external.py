"""External API integrations for OpenWeatherMap weather and air quality."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import OWM_API_KEY

logger = logging.getLogger(__name__)

# ─── City → (lat, lon) for the 29 supported Indian cities ───────────────────
CITY_COORDS: dict[str, tuple[float, float]] = {
    "Ahmedabad": (23.0225, 72.5714),
    "Aizawl": (23.7271, 92.7176),
    "Amaravati": (20.9374, 77.7796),
    "Amritsar": (31.6340, 74.8723),
    "Bengaluru": (12.9716, 77.5946),
    "Bhopal": (23.2599, 77.4126),
    "Brajrajnagar": (21.8167, 83.9167),
    "Chandigarh": (30.7333, 76.7794),
    "Chennai": (13.0827, 80.2707),
    "Coimbatore": (11.0168, 76.9558),
    "Delhi": (28.6139, 77.2090),
    "Ernakulam": (9.9816, 76.2999),
    "Gurugram": (28.4595, 77.0266),
    "Guwahati": (26.1445, 91.7362),
    "Hyderabad": (17.3850, 78.4867),
    "Jaipur": (26.9124, 75.7873),
    "Jorapokhar": (23.6833, 86.4167),
    "Kochi": (9.9312, 76.2673),
    "Kolkata": (22.5726, 88.3639),
    "Lucknow": (26.8467, 80.9462),
    "Mumbai": (19.0760, 72.8777),
    "Nagpur": (21.1458, 79.0882),
    "Patna": (25.5941, 85.1376),
    "Shillong": (25.5788, 91.8933),
    "Srinagar": (34.0837, 74.7973),
    "Talcher": (20.9500, 85.2333),
    "Thiruvananthapuram": (8.5241, 76.9366),
    "Visakhapatnam": (17.6868, 83.2185),
}

_HTTP_TIMEOUT = 8.0  # seconds per external API call


async def _get(client: httpx.AsyncClient, url: str, params: dict) -> dict | None:
    """Make a GET request; return JSON dict or None on any failure."""
    try:
        resp = await client.get(url, params=params, timeout=_HTTP_TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        logger.warning("External API call failed: %s — %s", url, exc)
        return None


async def fetch_weather(city: str) -> dict[str, float | None]:
    """Fetch current weather from OpenWeatherMap for a city.

    Returns dict with keys: temperature, humidity, pressure, wind_speed, rainfall.
    Any field that can't be retrieved is set to None.
    """
    coords = CITY_COORDS.get(city)
    if not coords or not OWM_API_KEY:
        return _empty_weather()

    lat, lon = coords
    async with httpx.AsyncClient() as client:
        data = await _get(
            client,
            "https://api.openweathermap.org/data/2.5/weather",
            {
                "lat": lat,
                "lon": lon,
                "appid": OWM_API_KEY,
                "units": "metric",
            },
        )

    if data is None or data.get("cod") != 200:
        return _empty_weather()

    rain_1h = (data.get("rain") or {}).get("1h", 0.0)
    return {
        "temperature": _safe(data.get("main", {}).get("temp")),
        "humidity": _safe(data.get("main", {}).get("humidity")),
        "pressure": _safe(data.get("main", {}).get("pressure")),
        "wind_speed": _safe(_ms_to_kmh(data.get("wind", {}).get("speed"))),
        "rainfall": _safe(rain_1h),
    }


async def fetch_pollutants(city: str) -> dict[str, Any]:
    """Fetch current air quality from OpenWeatherMap for a city's coordinates.

    Returns dict with:
      - pm25, pm10, no2, so2, co, o3: float | None

    OWM documents all component concentrations in μg/m³, matching the model
    inputs, so values are mapped directly without unit conversion.
    """
    coords = CITY_COORDS.get(city)
    if not coords or not OWM_API_KEY:
        return _empty_pollutants()

    lat, lon = coords
    async with httpx.AsyncClient() as client:
        data = await _get(
            client,
            "https://api.openweathermap.org/data/2.5/air_pollution",
            {"lat": lat, "lon": lon, "appid": OWM_API_KEY},
        )

    entries = (data or {}).get("list") or []
    if not entries:
        return _empty_pollutants()

    components = entries[0].get("components") or {}

    return {
        "pm25": _safe(components.get("pm2_5")),
        "pm10": _safe(components.get("pm10")),
        "no2": _safe(components.get("no2")),
        "so2": _safe(components.get("so2")),
        "co": _safe(components.get("co")),
        "o3": _safe(components.get("o3")),
    }


async def fetch_forecast_weather(city: str) -> list[dict[str, Any]]:
    """Fetch 5-day (free tier) daily weather forecast from OWM.

    Returns list of dicts with keys: date, temperature, humidity, pressure,
    wind_speed, rainfall — aggregated to one value per calendar day.
    """
    coords = CITY_COORDS.get(city)
    if not coords or not OWM_API_KEY:
        return []

    lat, lon = coords
    async with httpx.AsyncClient() as client:
        data = await _get(
            client,
            "https://api.openweathermap.org/data/2.5/forecast",
            {
                "lat": lat,
                "lon": lon,
                "appid": OWM_API_KEY,
                "units": "metric",
                "cnt": 40,  # max 40 × 3h = 120h = 5 days
            },
        )

    if data is None or data.get("cod") != "200":
        return []

    # Aggregate 3-hour slots → per-day means
    from collections import defaultdict

    daily: dict[str, list] = defaultdict(list)
    for item in data.get("list", []):
        date_str = item["dt_txt"].split(" ")[0]  # "YYYY-MM-DD"
        daily[date_str].append(item)

    result = []
    for date_str in sorted(daily.keys()):
        slots = daily[date_str]
        temps = [s["main"]["temp"] for s in slots]
        humids = [s["main"]["humidity"] for s in slots]
        pressures = [s["main"]["pressure"] for s in slots]
        winds = [s["wind"]["speed"] for s in slots]
        rains = [((s.get("rain") or {}).get("3h", 0.0)) for s in slots]
        result.append(
            {
                "date": date_str,
                "temperature": round(sum(temps) / len(temps), 1),
                "humidity": round(sum(humids) / len(humids), 1),
                "pressure": round(sum(pressures) / len(pressures), 1),
                "wind_speed": round(_ms_to_kmh(sum(winds) / len(winds)), 1),
                "rainfall": round(sum(rains), 2),
            }
        )
    return result


# ─── Helpers ────────────────────────────────────────────────────────────────

def _safe(val: Any) -> float | None:
    try:
        f = float(val)
        return f if f == f else None  # NaN check
    except (TypeError, ValueError):
        return None


def _ms_to_kmh(ms: Any) -> float | None:
    v = _safe(ms)
    return round(v * 3.6, 2) if v is not None else None


def _empty_weather() -> dict[str, float | None]:
    return {
        "temperature": None,
        "humidity": None,
        "pressure": None,
        "wind_speed": None,
        "rainfall": None,
    }


def _empty_pollutants() -> dict[str, Any]:
    return {
        "pm25": None,
        "pm10": None,
        "no2": None,
        "so2": None,
        "co": None,
        "o3": None,
    }
