# Air Quality Index Forecasting System

Predict **US AQI** from pollutant and weather inputs using XGBoost / Random Forest, with a FastAPI backend and React frontend.

## Tech stack

- **ML:** Python, pandas, scikit-learn, XGBoost, joblib  
- **API:** FastAPI, Uvicorn, Pydantic  
- **UI:** React, Vite, Axios, CSS  

## Project structure

```
aqi-forecast-system/
├── backend/
│   ├── app/           # API
│   ├── training/      # Train & evaluate models
│   └── data/          # CSV dataset
└── frontend/          # React app (deploy to Vercel)
```

## Run locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

cd training
python train.py                # creates app/model/*.pkl

cd ..
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
```

`frontend/.env`:

```
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

App: http://localhost:5173

### Backend `.env` (optional)

```
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Deploy (production)

| Part | Platform |
|------|----------|
| Frontend | **Vercel** (`frontend` folder) |
| Backend API | **Render** free tier (`backend` folder) |

**Full step-by-step:** see **[DEPLOY.md](./DEPLOY.md)**

Quick summary:

1. Push repo to GitHub (include `backend/app/model/*.pkl`).
2. Deploy backend on Render → copy API URL.
3. Deploy frontend on Vercel with Root Directory = `frontend` and `VITE_API_URL=https://your-api.onrender.com`.
4. Set Render `CORS_ORIGINS` to your Vercel URL and redeploy Vercel if needed.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health + `model_loaded` |
| GET | `/cities` | Supported cities |
| POST | `/predict` | AQI prediction |

**Example body** (`co` in µg/m³):

```json
{
  "city": "Delhi",
  "temperature": 30,
  "humidity": 60,
  "pressure": 1012,
  "wind_speed": 12,
  "rainfall": 1,
  "pm25": 120,
  "pm10": 170,
  "no2": 35,
  "so2": 10,
  "co": 197,
  "o3": 40
}
```

## License

MIT
