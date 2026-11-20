"""Servicio de analítica - Lógica de negocio para analytics."""

from typing import List, Optional

from sqlalchemy.orm import Session

from repositories.analytics_repository import AnalyticsRepository
from schemas import OneRMHistoryCreate, OneRMHistoryResponse, OneRMRequest, OneRMResponse, WeeklyVolumeResponse


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


def get_rpe_percentage(rpe: float) -> Optional[float]:
    """Obtener porcentaje de 1RM según RPE con interpolación."""
    if rpe in RPE_TO_PERCENTAGE:
        return RPE_TO_PERCENTAGE[rpe]

    sorted_rpes = sorted(RPE_TO_PERCENTAGE.keys())
    lower = max([r for r in sorted_rpes if r <= rpe])
    upper = min([r for r in sorted_rpes if r >= rpe])
    if lower == upper:
        return RPE_TO_PERCENTAGE[lower]

    lower_pct = RPE_TO_PERCENTAGE[lower]
    upper_pct = RPE_TO_PERCENTAGE[upper]
    ratio = (rpe - lower) / (upper - lower)
    return lower_pct + ratio * (upper_pct - lower_pct)


class AnalyticsService:
    """Lógica de negocio de analítica."""

    def __init__(self, db: Session):
        self.repo = AnalyticsRepository(db)

    def get_weekly_volume(
        self, user_id: int, weeks: int = 12
    ) -> List[WeeklyVolumeResponse]:
        """Obtener volumen semanal para el gráfico del dashboard."""
        data = self.repo.get_weekly_volume(user_id, weeks)
        return [
            WeeklyVolumeResponse(
                week_start=row["week_start"],
                total_volume=row["total_volume"],
                sessions_count=row["sessions_count"],
            )
            for row in data
        ]

    def calculate_1rm(self, request: OneRMRequest) -> OneRMResponse:
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
            percentage = get_rpe_percentage(request.rpe)

            result.rpe_adjusted_1rm = round(rpe_adjusted, 2)
            result.estimated_1rm = round(rpe_adjusted, 2)  # El estimado final usa RPE si está
            result.rpe_percentage = round(percentage * 100, 1) if percentage else None
            result.formula_used = "Epley + RPE (RTS)"

        return result

    def save_1rm(self, user_id: int, data: OneRMHistoryCreate) -> OneRMHistoryResponse:
        """Guardar un cálculo de 1RM en el historial del usuario."""
        return self.repo.save_1rm_history(
            user_id=user_id,
            exercise_name=data.exercise_name,
            weight=data.weight,
            reps=data.reps,
            rpe=data.rpe,
            estimated_1rm=data.estimated_1rm,
        )

    def get_1rm_history(
        self,
        user_id: int,
        exercise_name: Optional[str] = None,
        limit: int = 100,
    ) -> List[OneRMHistoryResponse]:
        """Obtener historial de 1RM del usuario autenticado."""
        history = self.repo.get_1rm_history(user_id, exercise_name, limit)
        return [
            OneRMHistoryResponse(
                id=h.id,
                exercise_name=h.exercise_name,
                weight=h.weight,
                reps=h.reps,
                rpe=h.rpe,
                estimated_1rm=h.estimated_1rm,
                created_at=h.created_at,
            )
            for h in history
        ]