import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.external import fetch_forecast_weather, fetch_pollutants, fetch_weather
from app.predict import get_cities, is_model_loaded, load_artifacts, predict_aqi
from app.schemas import (
    AutofillResponse,
    CitiesResponse,
    ForecastDay,
    ForecastResponse,
    HealthResponse,
    PredictRequest,
    PredictResponse,
    SHAPContribution,
)
from app.utils import aqi_result


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_artifacts()
    yield


app = FastAPI(title="AQI Forecast API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="running", model_loaded=is_model_loaded())


@app.get("/cities", response_model=CitiesResponse)
def cities() -> CitiesResponse:
    if not is_model_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded.")
    return CitiesResponse(cities=get_cities())


@app.post("/predict", response_model=PredictResponse)
def predict(body: PredictRequest) -> PredictResponse:
    if not is_model_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded.")

    try:
        score, shap_contributions = predict_aqi(body.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    predicted = int(round(score))
    category, advice = aqi_result(predicted)
    return PredictResponse(
        predicted_aqi=predicted,
        category=category,
        health_advice=advice,
        shap_top=[SHAPContribution(**c) for c in shap_contributions],
    )


@app.get("/autofill", response_model=AutofillResponse)
async def autofill(city: str = Query(..., min_length=1)) -> AutofillResponse:
    """Fetch live weather + pollutant data for a city.

    Both API calls run concurrently. Partial failures return None for those fields.
    """
    weather_task = fetch_weather(city)
    pollutants_task = fetch_pollutants(city)
    weather, pollutants = await asyncio.gather(weather_task, pollutants_task)

    # Determine source quality
    weather_ok = any(v is not None for v in weather.values())
    air_ok = any(v is not None for v in {k: pollutants[k] for k in list(pollutants.keys()) if k != "live_aqi"}.values())

    if weather_ok and air_ok:
        source = "full"
    elif weather_ok or air_ok:
        source = "partial"
    else:
        source = "none"

    return AutofillResponse(
        temperature=weather.get("temperature"),
        humidity=weather.get("humidity"),
        pressure=weather.get("pressure"),
        wind_speed=weather.get("wind_speed"),
        rainfall=weather.get("rainfall"),
        pm25=pollutants.get("pm25"),
        pm10=pollutants.get("pm10"),
        no2=pollutants.get("no2"),
        so2=pollutants.get("so2"),
        co=pollutants.get("co"),
        o3=pollutants.get("o3"),
        live_aqi=pollutants.get("live_aqi"),
        source=source,
    )


@app.get("/forecast", response_model=ForecastResponse)
async def forecast(city: str = Query(..., min_length=1)) -> ForecastResponse:
    """Return a 5-day AQI forecast for a city.

    Uses OWM daily weather forecast + most recent WAQI pollutant levels,
    passed through the existing XGBoost model. OWM free tier supports 5 days.
    """
    if not is_model_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded.")

    forecast_task = fetch_forecast_weather(city)
    pollutants_task = fetch_pollutants(city)
    daily_weather, pollutants = await asyncio.gather(forecast_task, pollutants_task)

    if not daily_weather:
        raise HTTPException(
            status_code=503,
            detail="Weather forecast unavailable. Check OWM_API_KEY configuration.",
        )

    # Use live pollutant values, fall back to safe defaults for any None
    _defaults = {"pm25": 50.0, "pm10": 80.0, "no2": 20.0, "so2": 10.0, "co": 100.0, "o3": 30.0}
    pol = {k: (pollutants.get(k) if pollutants.get(k) is not None else _defaults[k])
           for k in _defaults}

    days: list[ForecastDay] = []
    for slot in daily_weather:
        payload = {
            "city": city,
            "temperature": slot["temperature"],
            "humidity": slot["humidity"],
            "pressure": slot["pressure"],
            "wind_speed": slot["wind_speed"],
            "rainfall": slot["rainfall"],
            **pol,
        }
        try:
            score, _ = predict_aqi(payload)
            aqi_int = int(round(score))
            cat, _ = aqi_result(aqi_int)
            days.append(ForecastDay(date=slot["date"], predicted_aqi=aqi_int, category=cat))
        except Exception:
            continue

    return ForecastResponse(city=city, days=days)
