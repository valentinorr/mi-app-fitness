"""Aplicación principal FastAPI."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database import Base, engine
from rate_limit import limiter
from routers import analytics, auth, workouts


# Solo añadir rate limiter si NO estamos en modo testing
TESTING = os.getenv("TESTING", "").lower() in ("1", "true", "yes")


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

# Rate limiter middleware y handler (solo en producción)
if not TESTING:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
else:
    # En tests: limiter dummy que no hace nada
    class DummyLimiter:
        def limit(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
    app.state.limiter = DummyLimiter()

# CORS middleware - IMPORTANTE: configurar antes de los routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",           # Desarrollo local Vite
        "http://127.0.0.1:5173",           # Alternativa localhost
        "https://mi-app-fitness-abli-olive.vercel.app",  # Cambia por tu dominio Vercel real
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(workouts.router)
app.include_router(analytics.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "dbt-api"}