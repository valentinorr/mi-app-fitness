"""Servicio de entrenamientos - Lógica de negocio para workouts."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from repositories.workout_repository import WorkoutRepository
from schemas import WorkoutSessionCreate, WorkoutSetCreate


class WorkoutService:
    """Lógica de negocio de entrenamientos."""

    def __init__(self, db: Session):
        self.repo = WorkoutRepository(db)

    def create_workout(
        self,
        user_id: int,
        workout: WorkoutSessionCreate,
    ):
        """Crear una nueva sesión de entrenamiento con sus series."""
        date = workout.date or datetime.utcnow()
        db_workout = self.repo.create_session(user_id, date, workout.notes)

        for i, set_data in enumerate(workout.sets):
            self.repo.create_set(
                session_id=db_workout.id,
                exercise_name=set_data.exercise_name,
                weight=set_data.weight,
                reps=set_data.reps,
                rpe=set_data.rpe,
                rir=set_data.rir,
                set_order=set_data.set_order or i,
            )

        self.repo.commit()
        self.repo.refresh(db_workout)
        return db_workout

    def get_workouts(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> List:
        """Obtener todas las sesiones del usuario."""
        return self.repo.get_sessions_by_user(user_id, skip, limit)

    def get_workout(self, workout_id: int, user_id: int):
        """Obtener una sesión específica."""
        return self.repo.get_session_by_id(workout_id, user_id)

    def delete_workout(self, workout_id: int, user_id: int) -> bool:
        """Eliminar una sesión. Retorna True si se eliminó, False si no existe."""
        workout = self.repo.get_session_by_id(workout_id, user_id)
        if not workout:
            return False
        self.repo.delete_session(workout)
        return True