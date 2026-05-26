# Deployment guide

This app has **two parts**:

| Part | Host | Why |
|------|------|-----|
| **Frontend** (React) | [Vercel](https://vercel.com) | Static Vite build |
| **Backend** (FastAPI + ML model) | [Render](https://render.com) free tier | Python API with `model.pkl` (~3 MB) |

Vercel does not run this FastAPI + XGBoost server well; use Render (or Railway) for the API.

---

## Before you deploy

1. **Train the model** (if `backend/app/model/model.pkl` is missing):

   ```bash
   cd backend/training
   python train.py
   ```

2. **Push the project to GitHub** (required by Vercel and Render):

   ```bash
   cd aqi-forecast-system
   git init
   git add .
   git commit -m "AQI forecast app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

   Ensure these are committed (not in `.gitignore`):

   - `backend/app/model/model.pkl`
   - `backend/app/model/preprocessor.pkl`

---

## Part 1 — Backend on Render

1. Go to [render.com](https://render.com) → sign up → **New** → **Blueprint**.
2. Connect your GitHub repo.
3. Render reads `render.yaml` at the repo root and creates the **aqi-forecast-api** service.
4. When prompted, set environment variable:

   | Key | Value (set after Vercel deploy) |
   |-----|----------------------------------|
   | `CORS_ORIGINS` | `https://your-app.vercel.app` |

   For now use a placeholder; update after frontend is live. Multiple origins: comma-separated, no spaces.

   Example:

   ```
   https://aqi-forecast.vercel.app,http://localhost:5173
   ```

5. Click **Apply**. Wait for deploy (~5–10 min first time).
6. Copy your API URL, e.g. `https://aqi-forecast-api.onrender.com`.
7. Test in browser:

   - `https://YOUR-API.onrender.com/` → `"model_loaded": true`
   - `https://YOUR-API.onrender.com/docs` → Swagger UI

**Note:** Free Render services sleep after ~15 min idle; first request may take 30–60 seconds (cold start).

### Manual Render setup (no Blueprint)

1. **New** → **Web Service** → connect repo.
2. **Root Directory:** `backend`
3. **Runtime:** Python 3
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add `CORS_ORIGINS` as above.

---

## Part 2 — Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → sign up → **Add New** → **Project**.
2. Import the same GitHub repo.
3. **Important settings:**

   | Setting | Value |
   |---------|--------|
   | **Root Directory** | `frontend` (click Edit, select `frontend`) |
   | **Framework Preset** | Vite (auto-detected) |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. **Environment variables** (Production):

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://YOUR-API.onrender.com` (no trailing slash) |

5. Click **Deploy**.
6. Open your Vercel URL, e.g. `https://aqi-forecast.vercel.app`.

---

## Part 3 — Connect frontend and backend

1. In **Render** → your service → **Environment** → set:

   ```
   CORS_ORIGINS=https://your-project.vercel.app,http://localhost:5173
   ```

   Use your real Vercel URL. Redeploy if needed (Render may auto-redeploy on env change).

2. In **Vercel** → Project → **Settings** → **Environment Variables** → confirm `VITE_API_URL` points to Render.

3. **Redeploy Vercel** after changing `VITE_API_URL` (Vite bakes env vars at build time):

   - Deployments → ⋮ on latest → **Redeploy**

4. Test the live app: city dropdown loads, prediction returns AQI.

---

## Local `.env` files (reference)

**`frontend/.env`**

```
VITE_API_URL=http://localhost:8000
```

**`backend/.env`**

```
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Cities empty / network error | Backend asleep (Render free) — wait 60s and refresh; check `VITE_API_URL` |
| CORS error in browser console | Add exact Vercel URL to `CORS_ORIGINS` on Render |
| `model_loaded: false` | `model.pkl` not in repo — run `train.py` and commit `backend/app/model/` |
| Old API URL after change | Redeploy Vercel after updating `VITE_API_URL` |
| 404 on Vercel refresh | `vercel.json` rewrites are included — ensure Root Directory is `frontend` |

---

## Optional — Railway (backend alternative)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Set **Root Directory** to `backend`.
3. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add `CORS_ORIGINS` variable.
5. Use Railway public URL as `VITE_API_URL` on Vercel.

---

## Checklist

- [ ] Model files committed (`model.pkl`, `preprocessor.pkl`)
- [ ] Code on GitHub
- [ ] Render backend live, `/` shows `model_loaded: true`
- [ ] Vercel frontend deployed with `VITE_API_URL`
- [ ] `CORS_ORIGINS` includes Vercel URL
- [ ] Live prediction works
