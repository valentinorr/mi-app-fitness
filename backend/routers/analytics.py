"""Endpoints de analítica: /analytics."""

from typing import List, Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import (
    OneRMHistoryCreate,
    OneRMHistoryResponse,
    OneRMRequest,
    OneRMResponse,
    WeeklyVolumeResponse,
)
from security import get_current_user
from services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_analytics_service(db: Session = Depends(get_db)) -> AnalyticsService:
    """Dependencia para obtener el servicio de analítica."""
    return AnalyticsService(db)


# =============================================================================
# ENDPOINTS DE VOLUMEN SEMANAL
# =============================================================================


@router.get("/weekly-volume", response_model=List[WeeklyVolumeResponse])
def get_weekly_volume(
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    weeks: int = 12,
):
    """Obtener volumen semanal para el gráfico del dashboard"""
    return analytics_service.get_weekly_volume(current_user.id, weeks)


# =============================================================================
# ENDPOINT 1RM CALCULATOR (Sprint 2)
# =============================================================================


@router.post("/calculate-1rm", response_model=OneRMResponse)
def calculate_1rm(
    request: OneRMRequest,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    """
    Calcula el 1RM estimado usando:
    - Fórmula de Epley (baseline)
    - Ajuste por RPE (tabla RTS) si se proporciona
    """
    return analytics_service.calculate_1rm(request)


# =============================================================================
# ENDPOINTS 1RM HISTORY (Sprint 2 - Paso 3)
# =============================================================================


@router.post("/save-1rm", response_model=OneRMHistoryResponse, status_code=status.HTTP_201_CREATED)
def save_1rm(
    data: OneRMHistoryCreate,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    """Guardar un cálculo de 1RM en el historial del usuario"""
    return analytics_service.save_1rm(current_user.id, data)


@router.get("/1rm-history", response_model=List[OneRMHistoryResponse])
def get_1rm_history(
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    exercise_name: Optional[str] = None,
    limit: int = 100,
):
    """Obtener historial de 1RM del usuario autenticado"""
    return analytics_service.get_1rm_history(current_user.id, exercise_name, limit)