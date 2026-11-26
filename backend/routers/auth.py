"""Endpoints de autenticación: /register, /login, /me."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from models import User
from rate_limit import limiter
from schemas import Token, UserCreate, UserResponse
from security import oauth2_scheme
from services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Dependencia para obtener el servicio de autenticación."""
    return AuthService(db)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
def register(
    request: Request,
    user: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Registrar un nuevo usuario (rate limited: 5/min/IP)"""
    try:
        return auth_service.register_user(user.email, user.password, user.full_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/login",
    response_model=Token,
)
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login y obtención de token JWT (rate limited: 5/min/IP)"""
    token_data = auth_service.authenticate(form_data.username, form_data.password)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """Obtener usuario actual desde token (dependencia reutilizable)."""
    return auth_service.get_user_by_token(token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Obtener usuario actual"""
    return current_user