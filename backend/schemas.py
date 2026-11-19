"""Esquemas Pydantic (validación y serialización)."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


class WorkoutSetCreate(BaseModel):
    exercise_name: str = Field(min_length=1, max_length=255)
    weight: float = Field(ge=0)
    reps: int = Field(ge=1, le=100)
    rpe: Optional[float] = Field(default=None, ge=1, le=10)
    rir: Optional[int] = Field(default=None, ge=0, le=10)
    set_order: int = Field(default=0, ge=0)


class WorkoutSetResponse(WorkoutSetCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutSessionCreate(BaseModel):
    date: Optional[datetime] = None
    notes: Optional[str] = None
    sets: List[WorkoutSetCreate] = Field(min_length=1)


class WorkoutSessionResponse(BaseModel):
    id: int
    date: datetime
    notes: Optional[str]
    created_at: datetime
    sets: List[WorkoutSetResponse]

    class Config:
        from_attributes = True


class WeeklyVolumeResponse(BaseModel):
    week_start: str
    total_volume: float
    sessions_count: int


# =============================================================================
# ESQUEMAS PARA 1RM CALCULATOR
# =============================================================================


class OneRMRequest(BaseModel):
    weight: float = Field(ge=0, description="Peso levantado (kg)")
    reps: int = Field(ge=1, le=50, description="Repeticiones realizadas")
    rpe: Optional[float] = Field(default=None, ge=1, le=10, description="RPE opcional (1-10)")


class OneRMResponse(BaseModel):
    estimated_1rm: float = Field(description="1RM estimado en kg")
    epley_1rm: float = Field(description="1RM por fórmula de Epley")
    rpe_adjusted_1rm: Optional[float] = Field(default=None, description="1RM ajustado por RPE (si se proporcionó)")
    rpe_percentage: Optional[float] = Field(default=None, description="Porcentaje de 1RM según RPE")
    formula_used: str = Field(description="Fórmula utilizada")


# =============================================================================
# ESQUEMAS PARA 1RM HISTORY (Sprint 2 - Paso 3)
# =============================================================================


class OneRMHistoryCreate(BaseModel):
    exercise_name: str = Field(min_length=1, max_length=255, description="Nombre del ejercicio")
    weight: float = Field(ge=0, description="Peso levantado (kg)")
    reps: int = Field(ge=1, le=100, description="Repeticiones realizadas")
    rpe: Optional[float] = Field(default=None, ge=1, le=10, description="RPE opcional (1-10)")
    estimated_1rm: float = Field(ge=0, description="1RM estimado calculado (kg)")


class OneRMHistoryResponse(BaseModel):
    id: int
    exercise_name: str
    weight: float
    reps: int
    rpe: Optional[float]
    estimated_1rm: float
    created_at: datetime

    class Config:
        from_attributes = True