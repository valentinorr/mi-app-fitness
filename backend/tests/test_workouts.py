"""Tests para endpoints de entrenamientos (/workouts)."""

from fastapi.testclient import TestClient


class TestCreateWorkout:
    """Tests para POST /workouts."""

    def test_create_workout_success(self, client: TestClient, auth_headers):
        """Crear workout válido retorna 201."""
        response = client.post(
            "/workouts",
            json={
                "date": "2024-01-15T10:00:00",
                "notes": "Entreno de pierna",
                "sets": [
                    {"exercise_name": "Sentadilla", "weight": 100, "reps": 5, "rpe": 8, "set_order": 0},
                    {"exercise_name": "Sentadilla", "weight": 100, "reps": 5, "rpe": 8.5, "set_order": 1},
                    {"exercise_name": "Prensa de piernas", "weight": 180, "reps": 10, "rpe": 7, "set_order": 2},
                ],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["notes"] == "Entreno de pierna"
        assert len(data["sets"]) == 3
        assert data["sets"][0]["exercise_name"] == "Sentadilla"
        assert data["sets"][0]["weight"] == 100
        assert data["sets"][0]["reps"] == 5
        assert "id" in data
        assert "created_at" in data

    def test_create_workout_without_token(self, client: TestClient):
        """Crear workout sin token retorna 401."""
        response = client.post(
            "/workouts",
            json={
                "date": "2024-01-15T10:00:00",
                "notes": "Test",
                "sets": [{"exercise_name": "Sentadilla", "weight": 100, "reps": 5}],
            },
        )
        assert response.status_code == 401

    def test_create_workout_invalid_token(self, client: TestClient):
        """Crear workout con token inválido retorna 401."""
        response = client.post(
            "/workouts",
            json={
                "date": "2024-01-15T10:00:00",
                "notes": "Test",
                "sets": [{"exercise_name": "Sentadilla", "weight": 100, "reps": 5}],
            },
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    def test_create_workout_missing_sets(self, client: TestClient, auth_headers):
        """Crear workout sin series retorna 422."""
        response = client.post(
            "/workouts",
            json={"date": "2024-01-15T10:00:00", "notes": "Test", "sets": []},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_create_workout_invalid_set_data(self, client: TestClient, auth_headers):
        """Crear workout con datos de serie inválidos retorna 422."""
        response = client.post(
            "/workouts",
            json={
                "date": "2024-01-15T10:00:00",
                "notes": "Test",
                "sets": [{"exercise_name": "", "weight": -10, "reps": 0}],
            },
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestListWorkouts:
    """Tests para GET /workouts."""

    def test_list_workouts_success(self, client: TestClient, auth_headers, test_user, db_session):
        """Listar workouts retorna 200 con array (vacío o con datos)."""
        response = client.get("/workouts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_list_workouts_with_data(self, client: TestClient, auth_headers, test_user, db_session):
        """Listar workouts después de crear uno retorna el workout."""
        # Crear un workout primero
        client.post(
            "/workouts",
            json={
                "date": "2024-01-15T10:00:00",
                "notes": "Entreno A",
                "sets": [{"exercise_name": "Sentadilla", "weight": 100, "reps": 5}],
            },
            headers=auth_headers,
        )
        # Listar
        response = client.get("/workouts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["notes"] == "Entreno A"
        assert len(data[0]["sets"]) == 1

    def test_list_workouts_pagination(self, client: TestClient, auth_headers, test_user, db_session):
        """Listar workouts con paginación funciona."""
        # Crear 3 workouts
        for i in range(3):
            client.post(
                "/workouts",
                json={
                    "date": f"2024-01-{15+i}T10:00:00",
                    "notes": f"Entreno {i}",
                    "sets": [{"exercise_name": "Sentadilla", "weight": 100, "reps": 5}],
                },
                headers=auth_headers,
            )
        # Página 1 con limit=2
        response = client.get("/workouts?skip=0&limit=2", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        # Página 2
        response = client.get("/workouts?skip=2&limit=2", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_list_workouts_without_token(self, client: TestClient):
        """Listar workouts sin token retorna 401."""
        response = client.get("/workouts")
        assert response.status_code == 401


class TestGetWorkout:
    """Tests para GET /workouts/{workout_id}."""

    def test_get_workout_success(self, client: TestClient, auth_headers, test_user, db_session):
        """Obtener workout específico retorna 200."""
        create_resp = client.post(
            "/workouts",
            json={
                "date": "2024-01-15T10:00:00",
                "notes": "Entreno específico",
                "sets": [{"exercise_name": "Sentadilla", "weight": 100, "reps": 5}],
            },
            headers=auth_headers,
        )
        workout_id = create_resp.json()["id"]

        response = client.get(f"/workouts/{workout_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == workout_id
        assert data["notes"] == "Entreno específico"

    def test_get_workout_not_found(self, client: TestClient, auth_headers):
        """Obtener workout inexistente retorna 404."""
        response = client.get("/workouts/99999", headers=auth_headers)
        assert response.status_code == 404
        assert "no encontrada" in response.json()["detail"]

    def test_get_workout_other_user(self, client: TestClient, auth_headers, db_session):
        """Obtener workout de otro usuario retorna 404."""
        # Crear otro usuario
        from security import get_password_hash
        from models import User
        other_user = User(
            email="other@example.com",
            hashed_password=get_password_hash("password123"),
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        # Login como otro usuario y crear workout
        login_resp = client.post(
            "/auth/login",
            data={"username": "other@example.com", "password": "password123"},
        )
        other_token = login_resp.json()["access_token"]
        other_headers = {"Authorization": f"Bearer {other_token}"}

        create_resp = client.post(
            "/workouts",
            json={
                "date": "2024-01-15T10:00:00",
                "notes": "Entreno de otro",
                "sets": [{"exercise_name": "Sentadilla", "weight": 100, "reps": 5}],
            },
            headers=other_headers,
        )
        other_workout_id = create_resp.json()["id"]

        # Intentar acceder como usuario original
        response = client.get(f"/workouts/{other_workout_id}", headers=auth_headers)
        assert response.status_code == 404


class TestDeleteWorkout:
    """Tests para DELETE /workouts/{workout_id}."""

    def test_delete_workout_success(self, client: TestClient, auth_headers, test_user, db_session):
        """Eliminar workout propio retorna 204."""
        create_resp = client.post(
            "/workouts",
            json={
                "date": "2024-01-15T10:00:00",
                "notes": "Para borrar",
                "sets": [{"exercise_name": "Sentadilla", "weight": 100, "reps": 5}],
            },
            headers=auth_headers,
        )
        workout_id = create_resp.json()["id"]

        response = client.delete(f"/workouts/{workout_id}", headers=auth_headers)
        assert response.status_code == 204

        # Verificar que ya no existe
        response = client.get(f"/workouts/{workout_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_workout_not_found(self, client: TestClient, auth_headers):
        """Eliminar workout inexistente retorna 404."""
        response = client.delete("/workouts/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_workout_without_token(self, client: TestClient, test_user, db_session):
        """Eliminar workout sin token retorna 401."""
        # Crear workout con token válido primero
        login_resp = client.post(
            "/auth/login",
            data={"username": "test@example.com", "password": "password123"},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        create_resp = client.post(
            "/workouts",
            json={
                "date": "2024-01-15T10:00:00",
                "notes": "Test",
                "sets": [{"exercise_name": "Sentadilla", "weight": 100, "reps": 5}],
            },
            headers=headers,
        )
        workout_id = create_resp.json()["id"]

        # Intentar borrar sin token
        response = client.delete(f"/workouts/{workout_id}")
        assert response.status_code == 401