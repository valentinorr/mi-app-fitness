"""Repositorio de usuarios - Única capa que accede a la BD para usuarios."""

from typing import Optional

from sqlalchemy.orm import Session

from models import User


class UserRepository:
    """Operaciones de base de datos para usuarios."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        """Obtener usuario por email."""
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: int) -> Optional[User]:
        """Obtener usuario por ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, email: str, hashed_password: str, full_name: Optional[str] = None) -> User:
        """Crear un nuevo usuario."""
        db_user = User(email=email, hashed_password=hashed_password, full_name=full_name)
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def email_exists(self, email: str) -> bool:
        """Verificar si un email ya existe."""
        return self.db.query(User).filter(User.email == email).first() is not None