from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.predict import get_cities, is_model_loaded, load_artifacts, predict_aqi
from app.schemas import CitiesResponse, HealthResponse, PredictRequest, PredictResponse
from app.utils import aqi_result


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_artifacts()
    yield


app = FastAPI(title="AQI Forecast API", version="1.0.0", lifespan=lifespan)

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
        score = predict_aqi(body.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    predicted = int(round(score))
    category, advice = aqi_result(predicted)
    return PredictResponse(
        predicted_aqi=predicted,
        category=category,
        health_advice=advice,
    )
