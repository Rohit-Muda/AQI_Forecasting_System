import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

MODEL_DIR = Path(__file__).resolve().parent / "model"
MODEL_PATH = MODEL_DIR / "model.pkl"
PREPROCESSOR_PATH = MODEL_DIR / "preprocessor.pkl"

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
