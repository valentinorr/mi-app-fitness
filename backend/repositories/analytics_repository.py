"""Repositorio de analítica - Única capa que accede a la BD para analytics."""

from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import WorkoutSession, WorkoutSet, OneRMHistory


class AnalyticsRepository:
    """Operaciones de base de datos para analítica."""

    def __init__(self, db: Session):
        self.db = db

    def get_weekly_volume(
        self, user_id: int, weeks: int = 12
    ) -> List[dict]:
        """Obtener volumen semanal para el gráfico del dashboard."""
        cutoff_date = datetime.utcnow() - timedelta(weeks=weeks)

        results = (
            self.db.query(
                func.strftime("%Y-%W", WorkoutSession.date).label("week"),
                func.sum(WorkoutSet.weight * WorkoutSet.reps).label("volume"),
                func.count(WorkoutSession.id.distinct()).label("sessions"),
            )
            .join(WorkoutSet, WorkoutSession.id == WorkoutSet.session_id)
            .filter(WorkoutSession.user_id == user_id)
            .filter(WorkoutSession.date >= cutoff_date)
            .group_by(func.strftime("%Y-%W", WorkoutSession.date))
            .order_by(func.strftime("%Y-%W", WorkoutSession.date))
            .all()
        )

        return [
            {
                "week_start": row.week,
                "total_volume": round(row.volume or 0, 2),
                "sessions_count": row.sessions,
            }
            for row in results
        ]

    def save_1rm_history(
        self,
        user_id: int,
        exercise_name: str,
        weight: float,
        reps: int,
        rpe: Optional[float],
        estimated_1rm: float,
    ) -> OneRMHistory:
        """Guardar un cálculo de 1RM en el historial."""
        history = OneRMHistory(
            user_id=user_id,
            exercise_name=exercise_name,
            weight=weight,
            reps=reps,
            rpe=rpe,
            estimated_1rm=estimated_1rm,
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(history)
        return history

    def get_1rm_history(
        self,
        user_id: int,
        exercise_name: Optional[str] = None,
        limit: int = 100,
    ) -> List[OneRMHistory]:
        """Obtener historial de 1RM del usuario."""
        query = self.db.query(OneRMHistory).filter(OneRMHistory.user_id == user_id)

        if exercise_name:
            query = query.filter(OneRMHistory.exercise_name.ilike(f"%{exercise_name}%"))

        return query.order_by(OneRMHistory.created_at.desc()).limit(limit).all()