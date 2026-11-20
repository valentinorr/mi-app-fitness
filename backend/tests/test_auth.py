"""Tests para endpoints de autenticación (/auth)."""

from fastapi.testclient import TestClient


class TestRegister:
    """Tests para POST /auth/register."""

    def test_register_success(self, client: TestClient):
        """Registro exitoso retorna 201 y usuario creado."""
        response = client.post(
            "/auth/register",
            json={"email": "newuser@example.com", "password": "password123", "full_name": "New User"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert "id" in data
        assert "created_at" in data
        assert "hashed_password" not in data

    def test_register_duplicate_email(self, client: TestClient, test_user):
        """Registro con email duplicado retorna 400."""
        response = client.post(
            "/auth/register",
            json={"email": "test@example.com", "password": "password123", "full_name": "Another User"},
        )
        assert response.status_code == 400
        assert "ya está registrado" in response.json()["detail"]

    def test_register_invalid_email(self, client: TestClient):
        """Registro con email inválido retorna 422."""
        response = client.post(
            "/auth/register",
            json={"email": "not-an-email", "password": "password123"},
        )
        assert response.status_code == 422

    def test_register_short_password(self, client: TestClient):
        """Registro con contraseña muy corta retorna 422."""
        response = client.post(
            "/auth/register",
            json={"email": "user@example.com", "password": "short"},
        )
        assert response.status_code == 422


class TestLogin:
    """Tests para POST /auth/login."""

    def test_login_success(self, client: TestClient, test_user):
        """Login exitoso retorna 200 y token JWT."""
        response = client.post(
            "/auth/login",
            data={"username": "test@example.com", "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0

    def test_login_wrong_password(self, client: TestClient, test_user):
        """Login con contraseña incorrecta retorna 401."""
        response = client.post(
            "/auth/login",
            data={"username": "test@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert "incorrectos" in response.json()["detail"]

    def test_login_nonexistent_user(self, client: TestClient):
        """Login con usuario inexistente retorna 401."""
        response = client.post(
            "/auth/login",
            data={"username": "nonexistent@example.com", "password": "password123"},
        )
        assert response.status_code == 401
        assert "incorrectos" in response.json()["detail"]

    def test_login_missing_fields(self, client: TestClient):
        """Login sin campos requeridos retorna 422."""
        response = client.post("/auth/login", data={})
        assert response.status_code == 422


class TestMe:
    """Tests para GET /auth/me."""

    def test_me_success(self, client: TestClient, auth_headers):
        """Obtener usuario actual con token válido retorna 200."""
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"

    def test_me_without_token(self, client: TestClient):
        """Obtener usuario sin token retorna 401."""
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_me_with_invalid_token(self, client: TestClient):
        """Obtener usuario con token inválido retorna 401."""
        response = client.get("/auth/me", headers={"Authorization": "Bearer invalid-token"})
        assert response.status_code == 401