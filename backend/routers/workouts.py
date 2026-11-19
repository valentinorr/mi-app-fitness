"""Endpoints de entrenamientos: /workouts."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, WorkoutSession, WorkoutSet
from schemas import WorkoutSessionCreate, WorkoutSessionResponse
from security import get_current_user

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.post("", response_model=WorkoutSessionResponse, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout: WorkoutSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crear una nueva sesión de entrenamiento"""
    db_workout = WorkoutSession(
        user_id=current_user.id,
        date=workout.date or datetime.utcnow(),
        notes=workout.notes,
    )
    db.add(db_workout)
    db.flush()  # Para obtener el ID

    for i, set_data in enumerate(workout.sets):
        db_set = WorkoutSet(
            session_id=db_workout.id,
            exercise_name=set_data.exercise_name,
            weight=set_data.weight,
            reps=set_data.reps,
            rpe=set_data.rpe,
            rir=set_data.rir,
            set_order=set_data.set_order or i,
        )
        db.add(db_set)

    db.commit()
    db.refresh(db_workout)
    return db_workout


@router.get("", response_model=List[WorkoutSessionResponse])
def get_workouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """Obtener todas las sesiones del usuario actual"""
    workouts = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return workouts


@router.get("/{workout_id}", response_model=WorkoutSessionResponse)
def get_workout(
    workout_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener una sesión específica"""
    workout = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.id == workout_id, WorkoutSession.user_id == current_user.id)
        .first()
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return workout


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Eliminar una sesión"""
    workout = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.id == workout_id, WorkoutSession.user_id == current_user.id)
        .first()
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    db.delete(workout)
    db.commit()