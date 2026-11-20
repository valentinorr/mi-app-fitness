"""Servicio de autenticación - Lógica de negocio para auth."""

from typing import Optional

from sqlalchemy.orm import Session

from repositories.user_repository import UserRepository
from security import (
    create_access_token,
    verify_password,
    get_password_hash,
    get_current_user_from_token,
)
from schemas import TokenData


class AuthService:
    """Lógica de negocio de autenticación."""

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.db = db

    def register_user(self, email: str, password: str, full_name: Optional[str] = None):
        """Registrar un nuevo usuario."""
        if self.user_repo.email_exists(email):
            raise ValueError("El email ya está registrado")

        hashed_password = get_password_hash(password)
        return self.user_repo.create(email, hashed_password, full_name)

    def authenticate(self, email: str, password: str) -> Optional[dict]:
        """Autenticar usuario y retornar token."""
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None

        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}

    def get_user_by_token(self, token: str):
        """Obtener usuario actual desde token JWT."""
        return get_current_user_from_token(token, self.db)