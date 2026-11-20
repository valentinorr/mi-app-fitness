"""Endpoints de entrenamientos: /workouts."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import WorkoutSessionCreate, WorkoutSessionResponse
from security import get_current_user
from services.workout_service import WorkoutService

router = APIRouter(prefix="/workouts", tags=["workouts"])


def get_workout_service(db: Session = Depends(get_db)) -> WorkoutService:
    """Dependencia para obtener el servicio de entrenamientos."""
    return WorkoutService(db)


@router.post("", response_model=WorkoutSessionResponse, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout: WorkoutSessionCreate,
    current_user: User = Depends(get_current_user),
    workout_service: WorkoutService = Depends(get_workout_service),
):
    """Crear una nueva sesión de entrenamiento"""
    return workout_service.create_workout(current_user.id, workout)


@router.get("", response_model=List[WorkoutSessionResponse])
def get_workouts(
    current_user: User = Depends(get_current_user),
    workout_service: WorkoutService = Depends(get_workout_service),
    skip: int = 0,
    limit: int = 50,
):
    """Obtener todas las sesiones del usuario actual"""
    return workout_service.get_workouts(current_user.id, skip, limit)


@router.get("/{workout_id}", response_model=WorkoutSessionResponse)
def get_workout(
    workout_id: int,
    current_user: User = Depends(get_current_user),
    workout_service: WorkoutService = Depends(get_workout_service),
):
    """Obtener una sesión específica"""
    workout = workout_service.get_workout(workout_id, current_user.id)
    if not workout:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return workout


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: int,
    current_user: User = Depends(get_current_user),
    workout_service: WorkoutService = Depends(get_workout_service),
):
    """Eliminar una sesión"""
    deleted = workout_service.delete_workout(workout_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")