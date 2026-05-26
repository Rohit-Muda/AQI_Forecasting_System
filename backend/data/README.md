# Dataset (local only)

Place `INDIA_AQI_COMPLETE_20251126.csv` in this folder for training.

The CSV is **not** stored on GitHub (file exceeds GitHub’s 100 MB limit).

Training:

```bash
cd backend/training
python train.py
```

Deployed APIs use committed files in `backend/app/model/` (`model.pkl`, `preprocessor.pkl`).
