# Air Quality Index Forecasting System

Machine learning web application that predicts Air Quality Index (AQI) from pollutant concentrations, weather conditions, and city location using historical data from Indian cities.

**Repository:** https://github.com/Rohit-Muda/AQI_Forecasting_System

---

## Problem

Air pollution varies by location, season, weather, and emission sources. Raw pollutant readings (PM2.5, NO₂, etc.) are not easy for the public to interpret. An AQI score and category translate those readings into a single health-relevant scale.

## Solution

A regression model learns relationships between inputs and US AQI from a large labeled dataset. Users submit current readings through a web form; the system returns predicted AQI, EPA category, and short health guidance.

---

## Features

- AQI prediction from city, weather, and six pollutants
- Trained on India AQI dataset; supports 29 cities in the model
- Automatic model selection between Random Forest and XGBoost
- REST API with input validation (FastAPI)
- React frontend with forecast form, results, and AQI reference guide
- Light and dark theme

---

## Tech Stack

| Layer        | Tools                                      |
|-------------|---------------------------------------------|
| Machine learning | Python, pandas, scikit-learn, XGBoost, joblib |
| Backend     | FastAPI, Uvicorn, Pydantic                   |
| Frontend    | React, Vite, Axios, CSS                     |
| Deployment  | Vercel (UI), Render (API)                   |

---

## System Overview

```
User  →  React UI  →  FastAPI  →  Preprocessing  →  XGBoost model  →  AQI + category + advice
```

**Inputs:** city, temperature, humidity, pressure, wind speed, rainfall, PM2.5, PM10, NO₂, SO₂, CO, O₃  

**Output:** predicted US AQI (0–500), category (Good to Hazardous), health recommendation

---

## Machine Learning Pipeline

1. **Data cleaning** — remove duplicates, invalid AQI, handle missing values and outliers  
2. **Feature engineering** — time features (hour, month, season, weekend) and location encoding  
3. **Training** — Random Forest and XGBoost; 80/20 split, fixed random seed  
4. **Evaluation** — MAE, RMSE, R²; best model saved automatically  
5. **Inference** — same preprocessing as training, loaded from saved artifacts  

**Selected model (test set):** XGBoost — MAE ~10.4, RMSE ~15.0, R² ~0.90  

Artifacts: `backend/app/model/model.pkl`, `preprocessor.pkl`

---

## Project Structure

```
aqi-forecast-system/
├── backend/
│   ├── app/              API and saved model
│   ├── training/         Train, preprocess, evaluate
│   └── data/             Dataset (local only, not on GitHub)
├── frontend/             React application
├── render.yaml           Backend deploy config
├── DEPLOY.md             Deployment steps
└── README.md
```

---

## Run Locally

**Requirements:** Python 3.11+, Node.js 18+, dataset CSV in `backend/data/` for training only

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd training && python train.py && cd ..
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
```

Set `VITE_API_URL=http://localhost:8000` in `frontend/.env`, then:

```bash
npm run dev
```

| Service  | URL                          |
|----------|------------------------------|
| App      | http://localhost:5173        |
| API docs | http://localhost:8000/docs   |

---

## API Endpoints

| Method | Endpoint   | Description              |
|--------|------------|--------------------------|
| GET    | `/`        | Health check             |
| GET    | `/cities`  | List supported cities    |
| POST   | `/predict` | Return predicted AQI     |

---

## AQI Categories (US EPA)

| Range   | Category                          |
|---------|-----------------------------------|
| 0–50    | Good                              |
| 51–100  | Moderate                          |
| 101–150 | Unhealthy for Sensitive Groups    |
| 151–200 | Unhealthy                         |
| 201–300 | Very Unhealthy                    |
| 301+    | Hazardous                         |

---

## Deployment

| Component | Platform |
|-----------|----------|
| Frontend  | Vercel — root directory `frontend` |
| Backend   | Render — root directory `backend` |

Set `VITE_API_URL` on Vercel to the Render API URL. Set `CORS_ORIGINS` on Render to the Vercel app URL.

Details: [DEPLOY.md](./DEPLOY.md)

---

## Dataset Note

Training uses `INDIA_AQI_COMPLETE_20251126.csv` (~270 MB), stored locally only. The repository includes the trained model files required for deployment without the CSV.

---

## License

MIT
