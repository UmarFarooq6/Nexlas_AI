from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from config import APP_NAME, FRONTEND_DIR
from routers import auth
from routers import chat
from routers import recommendations
from routers import roadmap
from routers import projects
from routers import sessions
from routers import portfolio


app = FastAPI(title=APP_NAME)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(recommendations.router)
app.include_router(roadmap.router)
app.include_router(projects.router)
app.include_router(sessions.router)
app.include_router(portfolio.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


# Single-origin setup: the API also serves the static frontend, so the whole
# app (pages + API) runs from one server and no CORS configuration is needed.
# FRONTEND_DIR (env) can point elsewhere for deployments with a different layout.
frontend_path = Path(FRONTEND_DIR) if FRONTEND_DIR else Path(__file__).resolve().parent.parent / "Frontend"

app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
