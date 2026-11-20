"""Aplicación principal FastAPI."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import analytics, auth, workouts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown


app = FastAPI(
    title="Data Based Training API",
    description="API para tracking de entrenamientos de fuerza",
    version="0.1.0",
    lifespan=lifespan,
)

# Incluir routers
app.include_router(auth.router)
app.include_router(workouts.router)
app.include_router(analytics.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "dbt-api"}