import os
from dotenv import load_dotenv

# Load variables from .env file into environment
load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nexlas.db")

# Gemini API (Google AI Studio)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

# App settings
APP_NAME = "Nexlas AI Backend"
DEBUG = os.getenv("DEBUG", "True") == "True"

# Frontend static folder for single-origin serving
# (defaults to ../Frontend relative to Backend/main.py when unset)
FRONTEND_DIR = os.getenv("FRONTEND_DIR")