from pydantic import BaseModel, Field, field_validator


class PredictRequest(BaseModel):
    city: str = Field(..., min_length=1, max_length=100)
    temperature: float = Field(..., ge=-50, le=60)
    humidity: float = Field(..., ge=0, le=100)
    pressure: float = Field(..., ge=800, le=1100)
    wind_speed: float = Field(..., ge=0, le=200)
    rainfall: float = Field(..., ge=0, le=500)
    pm25: float = Field(..., ge=0, le=1000)
    pm10: float = Field(..., ge=0, le=1500)
    no2: float = Field(..., ge=0, le=500)
    so2: float = Field(..., ge=0, le=500)
    co: float = Field(..., ge=0, le=5000)
    o3: float = Field(..., ge=0, le=500)

    @field_validator("city")
    @classmethod
    def city_not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("City is required.")
        return cleaned


class PredictResponse(BaseModel):
    predicted_aqi: int
    category: str
    health_advice: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class CitiesResponse(BaseModel):
    cities: list[str]
