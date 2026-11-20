"""Repositorio de entrenamientos - Única capa que accede a la BD para workouts."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from models import WorkoutSession, WorkoutSet


class WorkoutRepository:
    """Operaciones de base de datos para entrenamientos."""

    def __init__(self, db: Session):
        self.db = db

    def create_session(
        self,
        user_id: int,
        date: datetime,
        notes: Optional[str] = None,
    ) -> WorkoutSession:
        """Crear una nueva sesión de entrenamiento."""
        db_workout = WorkoutSession(user_id=user_id, date=date, notes=notes)
        self.db.add(db_workout)
        self.db.flush()
        return db_workout

    def create_set(
        self,
        session_id: int,
        exercise_name: str,
        weight: float,
        reps: int,
        rpe: Optional[float] = None,
        rir: Optional[int] = None,
        set_order: int = 0,
    ) -> WorkoutSet:
        """Crear una serie dentro de una sesión."""
        db_set = WorkoutSet(
            session_id=session_id,
            exercise_name=exercise_name,
            weight=weight,
            reps=reps,
            rpe=rpe,
            rir=rir,
            set_order=set_order,
        )
        self.db.add(db_set)
        return db_set

    def get_sessions_by_user(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> List[WorkoutSession]:
        """Obtener todas las sesiones de un usuario."""
        return (
            self.db.query(WorkoutSession)
            .filter(WorkoutSession.user_id == user_id)
            .order_by(WorkoutSession.date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_session_by_id(self, session_id: int, user_id: int) -> Optional[WorkoutSession]:
        """Obtener una sesión específica por ID y usuario."""
        return (
            self.db.query(WorkoutSession)
            .filter(WorkoutSession.id == session_id, WorkoutSession.user_id == user_id)
            .first()
        )

    def delete_session(self, session: WorkoutSession) -> None:
        """Eliminar una sesión (cascada elimina las series)."""
        self.db.delete(session)
        self.db.commit()

    def commit(self) -> None:
        """Confirmar transacción."""
        self.db.commit()

    def refresh(self, obj) -> None:
        """Refrescar objeto desde BD."""
        self.db.refresh(obj)