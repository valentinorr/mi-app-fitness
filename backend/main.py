from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Annotated, List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker, Session

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

SECRET_KEY = "dev-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

DATABASE_URL = "sqlite:///./fitness.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# =============================================================================
# BASE DE DATOS - MODELOS
# =============================================================================

class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    workouts: Mapped[List["WorkoutSession"]] = relationship(back_populates="user")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="workouts")
    sets: Mapped[List["WorkoutSet"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("workout_sessions.id"), nullable=False, index=True)
    exercise_name: Mapped[str] = mapped_column(String(255), nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    reps: Mapped[int] = mapped_column(Integer, nullable=False)
    rpe: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rir: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    set_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["WorkoutSession"] = relationship(back_populates="sets")


class OneRMHistory(Base):
    __tablename__ = "one_rm_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    exercise_name: Mapped[str] = mapped_column(String(255), nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    reps: Mapped[int] = mapped_column(Integer, nullable=False)
    rpe: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    estimated_1rm: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


# Crear tablas
Base.metadata.create_all(bind=engine)


# =============================================================================
# ESQUEMAS PYDANTIC
# =============================================================================

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


# =============================================================================
# DEPENDENCIAS
# =============================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)]
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, token_data.email)
    if user is None:
        raise credentials_exception
    return user


# =============================================================================
# APLICACIÓN FASTAPI
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="Data Based Training API",
    description="API para tracking de entrenamientos de fuerza",
    version="0.1.0",
    lifespan=lifespan,
)


# =============================================================================
# ENDPOINTS DE AUTENTICACIÓN
# =============================================================================

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Annotated[Session, Depends(get_db)]):
    """Registrar un nuevo usuario"""
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    return create_user(db, user)


@app.post("/auth/login", response_model=Token)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)]
):
    """Login y obtención de token JWT"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Obtener usuario actual"""
    return current_user


# =============================================================================
# ENDPOINTS DE WORKOUT SESSIONS
# =============================================================================

@app.post("/workouts", response_model=WorkoutSessionResponse, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout: WorkoutSessionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
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


@app.get("/workouts", response_model=List[WorkoutSessionResponse])
def get_workouts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
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


@app.get("/workouts/{workout_id}", response_model=WorkoutSessionResponse)
def get_workout(
    workout_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
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


@app.delete("/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
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


# =============================================================================
# ENDPOINTS DE ANALÍTICA (para el Dashboard)
# =============================================================================

@app.get("/analytics/weekly-volume", response_model=List[WeeklyVolumeResponse])
def get_weekly_volume(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    weeks: int = 12,
):
    """Obtener volumen semanal para el gráfico del dashboard"""
    from sqlalchemy import func

    # Calcular volumen por semana: sum(weight * reps) agrupado por semana
    # Usamos strftime para agrupar por año-semana
    cutoff_date = datetime.utcnow() - timedelta(weeks=weeks)

    results = (
        db.query(
            func.strftime('%Y-%W', WorkoutSession.date).label('week'),
            func.sum(WorkoutSet.weight * WorkoutSet.reps).label('volume'),
            func.count(WorkoutSession.id.distinct()).label('sessions'),
        )
        .join(WorkoutSet, WorkoutSession.id == WorkoutSet.session_id)
        .filter(WorkoutSession.user_id == current_user.id)
        .filter(WorkoutSession.date >= cutoff_date)
        .group_by(func.strftime('%Y-%W', WorkoutSession.date))
        .order_by(func.strftime('%Y-%W', WorkoutSession.date))
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
    10.0: 1.00,   # 100% - Fallo muscular
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


@app.post("/analytics/calculate-1rm", response_model=OneRMResponse)
def calculate_1rm(
    request: OneRMRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
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

@app.post("/analytics/save-1rm", response_model=OneRMHistoryResponse, status_code=status.HTTP_201_CREATED)
def save_1rm(
    data: OneRMHistoryCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
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


@app.get("/analytics/1rm-history", response_model=List[OneRMHistoryResponse])
def get_1rm_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    exercise_name: Optional[str] = None,
    limit: int = 100,
):
    """Obtener historial de 1RM del usuario autenticado"""
    query = db.query(OneRMHistory).filter(OneRMHistory.user_id == current_user.id)

    if exercise_name:
        query = query.filter(OneRMHistory.exercise_name.ilike(f"%{exercise_name}%"))

    history = (
        query.order_by(OneRMHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    return history


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "dbt-api"}