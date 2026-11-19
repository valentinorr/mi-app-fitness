"""Endpoints de analítica: /analytics."""

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import User, WorkoutSession, WorkoutSet, OneRMHistory
from schemas import (
    OneRMHistoryCreate,
    OneRMHistoryResponse,
    OneRMRequest,
    OneRMResponse,
    WeeklyVolumeResponse,
)
from security import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


# =============================================================================
# ENDPOINTS DE VOLUMEN SEMANAL
# =============================================================================


@router.get("/weekly-volume", response_model=List[WeeklyVolumeResponse])
def get_weekly_volume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    weeks: int = 12,
):
    """Obtener volumen semanal para el gráfico del dashboard"""
    # Calcular volumen por semana: sum(weight * reps) agrupado por semana
    # Usamos strftime para agrupar por año-semana
    cutoff_date = datetime.utcnow() - timedelta(weeks=weeks)

    results = (
        db.query(
            func.strftime("%Y-%W", WorkoutSession.date).label("week"),
            func.sum(WorkoutSet.weight * WorkoutSet.reps).label("volume"),
            func.count(WorkoutSession.id.distinct()).label("sessions"),
        )
        .join(WorkoutSet, WorkoutSession.id == WorkoutSet.session_id)
        .filter(WorkoutSession.user_id == current_user.id)
        .filter(WorkoutSession.date >= cutoff_date)
        .group_by(func.strftime("%Y-%W", WorkoutSession.date))
        .order_by(func.strftime("%Y-%W", WorkoutSession.date))
        .all()
    )

    return [
        WeeklyVolumeResponse(
            week_start=row.week,
            total_volume=round(row.volume or 0, 2),
            sessions_count=row.sessions,
        )
        for row in results
    ]


# =============================================================================
# ENDPOINT 1RM CALCULATOR (Sprint 2)
# =============================================================================

# Tabla RPE de RTS (Rate of Perceived Exertion) - % de 1RM
# Basado en la tabla estándar de Mike Tuchscherer / Reactive Training Systems
RPE_TO_PERCENTAGE = {
    10.0: 1.00,  # 100% - Fallo muscular
    9.5: 0.97,
    9.0: 0.93,
    8.5: 0.90,
    8.0: 0.87,
    7.5: 0.84,
    7.0: 0.81,
    6.5: 0.78,
    6.0: 0.75,
    5.5: 0.72,
    5.0: 0.70,
    4.5: 0.67,
    4.0: 0.64,
    3.5: 0.61,
    3.0: 0.58,
    2.5: 0.55,
    2.0: 0.52,
    1.5: 0.50,
    1.0: 0.47,
}


def calculate_epley_1rm(weight: float, reps: int) -> float:
    """
    Fórmula de Epley: 1RM = weight * (1 + reps/30)
    Válida para 1-10 reps aproximadamente.
    """
    if reps <= 1:
        return weight
    return weight * (1 + reps / 30.0)


def calculate_rpe_adjusted_1rm(weight: float, reps: int, rpe: float) -> float:
    """
    Calcula 1RM ajustado por RPE usando la tabla RTS.
    Fórmula: 1RM = (peso levantado) / (% de 1RM según RPE)
    """
    epley_1rm = calculate_epley_1rm(weight, reps)

    # Obtener porcentaje de la tabla RPE (interpolación lineal si no existe exacto)
    if rpe in RPE_TO_PERCENTAGE:
        percentage = RPE_TO_PERCENTAGE[rpe]
    else:
        # Interpolación lineal entre los dos valores más cercanos
        sorted_rpes = sorted(RPE_TO_PERCENTAGE.keys())
        lower = max([r for r in sorted_rpes if r <= rpe])
        upper = min([r for r in sorted_rpes if r >= rpe])
        if lower == upper:
            percentage = RPE_TO_PERCENTAGE[lower]
        else:
            lower_pct = RPE_TO_PERCENTAGE[lower]
            upper_pct = RPE_TO_PERCENTAGE[upper]
            ratio = (rpe - lower) / (upper - lower)
            percentage = lower_pct + ratio * (upper_pct - lower_pct)

    # El peso levantado corresponde a ese porcentaje del 1RM real
    # Por tanto: 1RM_real = peso / porcentaje
    return epley_1rm / percentage


@router.post("/calculate-1rm", response_model=OneRMResponse)
def calculate_1rm(request: OneRMRequest, current_user: User = Depends(get_current_user)):
    """
    Calcula el 1RM estimado usando:
    - Fórmula de Epley (baseline)
    - Ajuste por RPE (tabla RTS) si se proporciona
    """
    # 1RM base con Epley
    epley_1rm = calculate_epley_1rm(request.weight, request.reps)

    result = OneRMResponse(
        estimated_1rm=round(epley_1rm, 2),
        epley_1rm=round(epley_1rm, 2),
        formula_used="Epley",
    )

    # Si hay RPE, calcular ajuste
    if request.rpe is not None:
        rpe_adjusted = calculate_rpe_adjusted_1rm(request.weight, request.reps, request.rpe)
        percentage = RPE_TO_PERCENTAGE.get(request.rpe)

        # Si no está exacto en la tabla, interpolar
        if percentage is None:
            sorted_rpes = sorted(RPE_TO_PERCENTAGE.keys())
            lower = max([r for r in sorted_rpes if r <= request.rpe])
            upper = min([r for r in sorted_rpes if r >= request.rpe])
            if lower != upper:
                lower_pct = RPE_TO_PERCENTAGE[lower]
                upper_pct = RPE_TO_PERCENTAGE[upper]
                ratio = (request.rpe - lower) / (upper - lower)
                percentage = lower_pct + ratio * (upper_pct - lower_pct)

        result.rpe_adjusted_1rm = round(rpe_adjusted, 2)
        result.estimated_1rm = round(rpe_adjusted, 2)  # El estimado final usa RPE si está
        result.rpe_percentage = round(percentage * 100, 1) if percentage else None
        result.formula_used = "Epley + RPE (RTS)"

    return result


# =============================================================================
# ENDPOINTS 1RM HISTORY (Sprint 2 - Paso 3)
# =============================================================================


@router.post("/save-1rm", response_model=OneRMHistoryResponse, status_code=status.HTTP_201_CREATED)
def save_1rm(
    data: OneRMHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Guardar un cálculo de 1RM en el historial del usuario"""
    history = OneRMHistory(
        user_id=current_user.id,
        exercise_name=data.exercise_name,
        weight=data.weight,
        reps=data.reps,
        rpe=data.rpe,
        estimated_1rm=data.estimated_1rm,
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


@router.get("/1rm-history", response_model=List[OneRMHistoryResponse])
def get_1rm_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    exercise_name: Optional[str] = None,
    limit: int = 100,
):
    """Obtener historial de 1RM del usuario autenticado"""
    query = db.query(OneRMHistory).filter(OneRMHistory.user_id == current_user.id)

    if exercise_name:
        query = query.filter(OneRMHistory.exercise_name.ilike(f"%{exercise_name}%"))

    history = query.order_by(OneRMHistory.created_at.desc()).limit(limit).all()
    return history