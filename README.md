# Air Quality Index Forecasting System

A machine learning web application that predicts Air Quality Index (AQI) from pollutant concentrations, weather conditions, and city location using historical data from Indian cities.

**Repository:** https://github.com/Rohit-Muda/AQI_Forecasting_System

---

## What Is This Project

The AQI Forecasting System is a full-stack application that takes real-world environmental inputs, pollutant levels, weather conditions and uses a trained machine learning model to instantly predict how dangerous the air quality is in a given Indian city.

Rather than requiring users to interpret raw scientific measurements, the system outputs a single AQI score, a health category, and a plain-language recommendation. The entire pipeline from data input to prediction runs in real time through a REST API connected to a React frontend.

---

## Why AQI Matters

Raw pollutant readings such as PM2.5 = 87 µg/m³ or NO2 = 45 µg/m³ carry no intuitive meaning for the average person. The EPA Air Quality Index solves this by converting multiple pollutant concentrations into one standardized number on a 0–500 scale. That number maps directly to a health category ranging from Good to Hazardous, making it immediately actionable for anyone regardless of their scientific background.

---

## Where This Is Useful

**Public Health Awareness**
Citizens, parents, and patients with respiratory conditions can check predicted AQI before going outdoors, exercising, or sending children to school. A single number with a health label is far more actionable than a table of pollutant readings.

**Urban Planning and Government Bodies**
Municipal corporations, environment departments, and smart city initiatives can use AQI predictions to make data-driven decisions around traffic regulation, construction activity scheduling, and public alerts during high-pollution periods.

**Healthcare Institutions**
Hospitals and clinics can correlate predicted AQI levels with respiratory patient admissions and proactively advise vulnerable patients such as those with asthma, COPD, or cardiovascular conditions.

**Research and Environmental Studies**
Researchers studying pollution trends across Indian cities can use the model and API to batch-process historical inputs and analyze how seasonal changes, weather patterns, and city-specific factors influence AQI outcomes.

**Industrial Compliance**
Factories and industrial units near residential zones can monitor predicted AQI based on their emission inputs and take corrective action before regulatory thresholds are crossed.

**Mobile and IoT Applications**
The REST API can be integrated into third-party air quality monitors, smart home devices, or mobile applications that need AQI predictions without running their own ML infrastructure.

---

## How It Works

User fills a form
↓
React Frontend sends the data via HTTP request
↓
FastAPI Backend receives, validates, and preprocesses inputs
↓
Same preprocessing pipeline used during training is applied
↓
XGBoost model runs inference on the transformed inputs
↓
User receives: AQI Score + Health Category + Health Advice

---

## Inputs and Output

The system accepts 12 inputs split across three categories.

| Category   | Inputs                                                        |
|------------|---------------------------------------------------------------|
| Location   | City — one of 29 supported Indian cities                      |
| Weather    | Temperature, Humidity, Pressure, Wind Speed, Rainfall         |
| Pollutants | PM2.5, PM10, NO2, SO2, CO, O3                                 |

Weather conditions are included because temperature, humidity, and wind speed directly influence how pollutants disperse, concentrate, or react in the atmosphere. City is included because pollution patterns vary significantly by geography, population density, and industrial activity.

**Output:**

| Field            | Description                                                       |
|------------------|-------------------------------------------------------------------|
| AQI Score        | A number between 0 and 500                                        |
| Health Category  | One of six EPA categories from Good to Hazardous                  |
| Health Advice    | A plain-language recommendation based on the predicted category   |

---

## Machine Learning Pipeline

Each step in the pipeline has a specific purpose and feeds directly into the next.

**Step 1 — Data Collection**
Training data comes from INDIA_AQI_COMPLETE_20251126.csv, a ~270 MB dataset of historical AQI readings from Indian cities. It contains timestamped records of pollutant concentrations, weather conditions, city names, and corresponding AQI values recorded over time.

**Step 2 — Data Cleaning**
Duplicate rows are removed. Records with invalid or missing AQI values are dropped. Outliers in pollutant columns are handled to prevent the model from learning from erroneous sensor readings. This step ensures the model trains on clean, representative data.

**Step 3 — Feature Engineering**
Raw timestamps are broken into time-based features: hour of the day, month, season, and whether the day is a weekday or weekend. These features matter because pollution patterns vary by time — rush hour produces more vehicle emissions, winter traps pollutants closer to ground level, and weekends have different industrial activity. City names are encoded numerically so the model can treat location as a learnable feature.

**Step 4 — Model Training**
Two models are trained on an 80/20 train-test split with a fixed random seed for reproducibility. Random Forest builds an ensemble of decision trees and averages their predictions. XGBoost uses gradient boosting, building trees sequentially where each tree corrects the errors of the previous one. Both are evaluated on the held-out 20% test set.

**Step 5 — Model Evaluation and Automatic Selection**

| Metric   | XGBoost (Selected)                           |
|----------|----------------------------------------------|
| MAE      | ~10.4 — average prediction error of ~10 AQI points |
| RMSE     | ~15.0 — penalizes larger errors more heavily |
| R² Score | ~0.90 — model explains 90% of AQI variation  |

The model with the best evaluation score is automatically saved. No manual selection is required.

**Step 6 — Saved Artifacts**
Two files are serialized using joblib and committed to the repository.

- `model.pkl` — the trained XGBoost model used for inference
- `preprocessor.pkl` — the exact same transformation pipeline applied during training

Saving the preprocessor alongside the model is critical. If the preprocessing at inference time differs even slightly from training, predictions become unreliable. Using the saved preprocessor guarantees consistency.

---

## Tech Stack

Each technology was chosen for a specific reason.

| Layer            | Technology                                    | Purpose                                          |
|------------------|-----------------------------------------------|--------------------------------------------------|
| Machine Learning | Python, pandas, scikit-learn, XGBoost, joblib | Data processing, model training, serialization   |
| Backend API      | FastAPI, Uvicorn, Pydantic                    | REST API with automatic validation and documentation |
| Frontend         | React, Vite, Axios, CSS                       | Fast, interactive single-page application        |
| Deployment       | Vercel, Render                                | Free-tier cloud hosting for frontend and backend |

**FastAPI** was chosen over Flask or Django because it provides automatic request validation via Pydantic models, generates interactive API documentation at `/docs` without extra setup, and handles asynchronous requests efficiently.

**XGBoost** was chosen because it consistently outperforms standard tree-based models on tabular datasets, handles missing values natively, and is computationally efficient at inference time.

**Vite** was chosen over Create React App because it provides significantly faster development server startup and hot module replacement, improving the development experience.

---

## Project Structure

aqi-forecast-system/
├── backend/
│   ├── app/              FastAPI application, routes, and saved model artifacts (.pkl files)
│   ├── training/         Scripts for preprocessing, training, and evaluating the model
│   └── data/             Dataset stored locally only, not committed to GitHub
├── frontend/             React application built with Vite
├── render.yaml           Render deployment configuration for the backend
├── DEPLOY.md             Step-by-step deployment instructions
└── README.md             Project documentation

The backend and frontend are fully decoupled. The backend exposes a REST API and knows nothing about the frontend. The frontend is a static application that communicates with the backend exclusively through HTTP requests. This separation means either side can be replaced, scaled, or redeployed independently.

---

## API Endpoints

| Method | Endpoint   | Description                                              |
|--------|------------|----------------------------------------------------------|
| GET    | /          | Health check — confirms the API server is running        |
| GET    | /cities    | Returns the list of 29 supported Indian cities           |
| POST   | /predict   | Accepts 12 input fields, returns AQI prediction and category |

Full interactive documentation with request and response schemas is available at `/docs` via Swagger UI. This is auto-generated by FastAPI and requires no additional configuration.

---

## AQI Reference Scale

The US EPA defines six AQI categories. The model predicts a value on this scale and the backend maps it to the appropriate category and health message.

| AQI Range | Category                       | Health Implication                                          |
|-----------|--------------------------------|-------------------------------------------------------------|
| 0–50      | Good                           | Air quality is satisfactory with little to no risk          |
| 51–100    | Moderate                       | Acceptable quality; minor risk for unusually sensitive people |
| 101–150   | Unhealthy for Sensitive Groups | Children, elderly, and those with respiratory conditions at risk |
| 151–200   | Unhealthy                      | Everyone may begin to experience adverse health effects     |
| 201–300   | Very Unhealthy                 | Health alert — serious risk for the entire population       |
| 301+      | Hazardous                      | Emergency conditions — significant harm to entire population |

---

## Deployment

The frontend and backend are deployed on separate platforms and communicate over HTTPS.

| Component         | Platform | Root Directory |
|-------------------|----------|----------------|
| Frontend (React)  | Vercel   | frontend       |
| Backend (FastAPI) | Render   | backend        |

**Environment variables required:**

- `VITE_API_URL` on Vercel — set to the full Render backend URL so the React app knows where to send prediction requests
- `CORS_ORIGINS` on Render — set to the Vercel app URL so the backend accepts cross-origin requests from the frontend

Vercel handles static asset hosting and CDN distribution for the frontend. Render runs the Uvicorn server for the FastAPI backend. Both platforms support automatic deployment from GitHub on every push to the main branch.

---

## Running Locally

**Requirements:** Python 3.11 or higher, Node.js 18 or higher, dataset CSV placed in `backend/data/` for training only.

**Backend setup:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd training && python train.py && cd ..
uvicorn app.main:app --reload --port 8000
```

`train.py` runs the full pipeline — cleaning, feature engineering, training both models, evaluating them, and saving the best model artifacts to `backend/app/model/`.

**Frontend setup:**

```bash
cd frontend
npm install
```

Create a file at `frontend/.env` and add:

VITE_API_URL=http://localhost:8000

Then start the development server:

```bash
npm run dev
```

| Service  | URL                        |
|----------|----------------------------|
| App      | http://localhost:5173      |
| API Docs | http://localhost:8000/docs |

---

## Key Highlights

- End-to-end ML pipeline from raw historical CSV to a live, deployed prediction API
- 90% R² accuracy on a real-world Indian AQI dataset with ~270 MB of training data
- Automatic model selection between Random Forest and XGBoost based on test set performance
- Preprocessing pipeline saved alongside the model to guarantee consistent inference
- Fully decoupled frontend and backend deployable and scalable independently
- Auto-generated API documentation with no additional configuration required
- Light and dark theme support on the frontend interface

---

## Dataset Note

Training uses `INDIA_AQI_COMPLETE_20251126.csv` (~270 MB), stored locally only and not committed to the repository due to file size. The repository includes pre-trained model artifacts so the application can be deployed and run without access to the original dataset.
