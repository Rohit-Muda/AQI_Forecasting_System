# India AQI Forecasting System

A web app that estimates the US Air Quality Index (AQI) for supported Indian cities from weather, pollutant, and city inputs. A trained XGBoost regressor returns an AQI score, health category, health advice, and (when available) the top feature contributions.

## How It Works

1. Select a city. Live autofill loads current weather and pollutant readings from OpenWeatherMap.
2. Review or edit the five weather values and six pollutant concentrations, then request a prediction.
3. The backend applies the saved preprocessing artifacts and XGBoost model. SHAP contributions explain the strongest factors behind the result when the explainer is available.

The model accepts 12 inputs: city; temperature, humidity, pressure, wind speed, and rainfall; and PM2.5, PM10, NO2, SO2, CO, and O3. Pollutants are measured in μg/m³. This is a model estimate on the US EPA AQI scale, not an official monitoring-station report.

The selected city also loads an AQI trend. The current implementation returns up to five days of predictions from forecast weather; it does not provide a seven-day forecast.

## Why AQI Matters

Individual pollutant measurements can be difficult to interpret. AQI summarizes air quality in a scale with health-risk categories to help people understand potential impact and choose precautions.

## Where This Is Useful

- **Public health:** Help residents consider air quality before outdoor activity.
- **Urban planning and research:** Explore how weather, pollutants, and city relate to predicted AQI.
- **Healthcare and other applications:** Use the prediction API in prototypes and analysis tools.
- **Mobile and IoT projects:** Integrate the API into other applications.

This project is informational and is not a replacement for official government alerts or certified monitoring.

## Model and Data

Training uses `INDIA_AQI_COMPLETE_20251126.csv` (842,160 rows, 71 columns, 282,627,634 bytes; timestamps from 2022-08-05 through 2025-11-26). Training cleans the data, samples up to 200,000 rows, compares Random Forest and XGBoost using a seeded 80/20 split, and saves the selected model and preprocessor under `backend/app/model/`.

The committed artifact is XGBoost. Its reproduced seed-42 holdout evaluation is MAE 10.384, RMSE 15.022, and R² 0.897. These are evaluation results for the current artifact, not a guarantee of future performance.

## API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/` | Service status and model-loaded state |
| `GET` | `/cities` | Supported city names |
| `POST` | `/predict` | Predict AQI, category, advice, and SHAP contributions from 12 inputs |
| `GET` | `/autofill?city=Hyderabad` | Current weather and pollutant values with a full/partial/none status |
| `GET` | `/forecast?city=Hyderabad` | Daily AQI predictions for available forecast weather, up to five days |

FastAPI provides interactive API documentation at `/docs`.

## Tech Stack

- **ML:** Python, pandas, NumPy, scikit-learn, XGBoost, SHAP, joblib
- **Backend:** FastAPI, Pydantic, Uvicorn, HTTPX, python-dotenv
- **Frontend:** React, Vite, Axios, CSS
- **Live data:** OpenWeatherMap weather, air-pollution, and 5-day/3-hour forecast endpoints
- **Hosting:** Render backend and Vercel frontend

## AQI Reference

| US AQI | Category |
|---:|---|
| 0–50 | Good |
| 51–100 | Moderate |
| 101–150 | Unhealthy for Sensitive Groups |
| 151–200 | Unhealthy |
| 201–300 | Very Unhealthy |
| 301–500 | Hazardous |

## Run Locally

Requirements: Python 3.11.9 and Node.js. The CSV is needed only to retrain; committed model artifacts are sufficient to run the app.

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Set `OWM_API_KEY` in `backend/.env` for live autofill. For the frontend:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend example points to `http://localhost:8000`. To retrain, place the CSV at `backend/data/INDIA_AQI_COMPLETE_20251126.csv` and run `python train.py` from `backend/training`.

## Deployment

Vercel serves `frontend/`; Render runs the backend from `backend/` using `render.yaml`. Configure `VITE_API_URL` in Vercel and `CORS_ORIGINS` plus `OWM_API_KEY` in Render settings. Keep real credentials in environment settings or ignored `.env` files, never in committed files. Placeholder examples are in `backend/.env.example` and `frontend/.env.example`; deployment steps are in [DEPLOY.md](DEPLOY.md).

The training CSV is excluded from Git because of its size. The saved model and preprocessor artifacts are committed so deployment does not require the CSV.