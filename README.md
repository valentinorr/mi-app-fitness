# Data Based Training (DBT)

Aplicación web de entrenamiento basada en datos para powerlifting, deportes de equipo y fitness.

## Stack Tecnológico

- **Frontend**: React + TypeScript + Vite + TailwindCSS + Recharts
- **Backend**: Python (FastAPI) + SQLite (SQLAlchemy)
- **Autenticación**: JWT (JSON Web Tokens)

---

## Estructura del Proyecto

```
.
├── backend/                 # API FastAPI
│   ├── main.py             # Punto de entrada (endpoints, modelos, auth)
│   ├── requirements.txt    # Dependencias Python
│   └── fitness.db          # Base de datos SQLite (se crea al iniciar)
├── frontend/               # App React
│   ├── src/
│   │   ├── components/     # Dashboard, LogWorkout, LoginRegister
│   │   ├── contexts/       # AuthContext (estado global auth)
│   │   ├── api/            # Cliente Axios + interceptors JWT
│   │   └── types/          # Tipos TypeScript
│   ├── package.json
│   ├── vite.config.ts      # Proxy a backend:8000
│   └── tailwind.config.js
└── README.md
```

---

## Requisitos Previos

- **Python 3.12+** (recomendado 3.12 para compatibilidad con pydantic-core)
- **Node.js 18+** y **npm**
- **Git** (opcional)

---

## Instalación y Ejecución (Windows PowerShell)

### 1. Backend

```powershell
# Ir a la carpeta backend
cd backend

# Crear entorno virtual (recomendado Python 3.12)
python -m venv .venv

# Activar entorno virtual
.\.venv\Scripts\Activate.ps1

# Instalar dependencias (usando mirror de TUNA para mayor velocidad en China/Asia)
# Si estás en otra región, quita la opción -i
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# Iniciar servidor (recarga automática con --reload)
python -m uvicorn main:app --reload
```

**Backend corriendo en:** http://127.0.0.1:8000
- **Swagger UI (docs):** http://127.0.0.1:8000/docs
- **OpenAPI JSON:** http://127.0.0.1:8000/openapi.json

---

### 2. Frontend

```powershell
# En otra terminal, ir a la carpeta frontend
cd frontend

# Instalar dependencias (mirror TUNA)
npm config set registry https://registry.npmmirror.com
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Frontend corriendo en:** http://localhost:5173

> El proxy de Vite redirige automáticamente `/auth`, `/workouts`, `/analytics` al backend en `http://127.0.0.1:8000`.

---

## Uso Básico

1. Abre **http://localhost:5173** en el navegador
2. **Regístrate** con email, contraseña (≥8 chars) y nombre
3. **Auto-login** → accedes al Dashboard + LogWorkout
4. **Dashboard**: Gráfico de volumen semanal (últimas 12 semanas)
5. **LogWorkout**: Registra series (ejercicio, peso, reps, RPE opcional)
6. **Navbar**: Muestra tu email + botón "Cerrar sesión"
7. La sesión persiste al recargar la página (JWT en localStorage)

---

## Endpoints Principales (Backend)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar usuario (JSON: email, password, full_name) |
| POST | `/auth/login` | Login → devuelve JWT (form-data: username=email, password) |
| GET | `/auth/me` | Usuario actual (requiere Bearer token) |
| POST | `/workouts` | Crear sesión de entrenamiento (requiere token) |
| GET | `/workouts` | Listar sesiones del usuario (requiere token) |
| GET | `/analytics/weekly-volume` | Volumen semanal para gráfico (requiere token) |
| GET | `/health` | Health check |

---

## Variables de Entorno (Opcional)

Crea `.env` en `backend/` si necesitas cambiar configuración:

```env
SECRET_KEY=tu-clave-secreta-super-segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./fitness.db
```

---

## Desarrollo

### Backend - Ejecutar tests
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -v
```

### Frontend - Build producción
```powershell
cd frontend
npm run build
# Output en dist/
```

### Frontend - Lint
```powershell
cd frontend
npm run lint
```

---

## Problemas Conocidos / Troubleshooting

### Error: `bcrypt` / `pydantic-core` en Python 3.14+
Si usas Python 3.14, `pydantic-core` falla al compilar. Soluciones:
1. **Usar Python 3.12** (recomendado)
2. O agregar variable de entorno antes de `pip install`:
   ```powershell
   $env:PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
   pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
   ```
3. El `requirements.txt` ya incluye `bcrypt<4` para evitar conflictos con passlib.

### Error CORS en frontend
Si ves errores de CORS, verifica que el backend tenga `CORSMiddleware` configurado (no incluido en MVP, el proxy de Vite lo evita en desarrollo).

### Puerto ocupado
- Backend: cambia `--port 8001` en uvicorn
- Frontend: edita `server.port` en `vite.config.ts`

---

## Licencia

MIT License - Libre para uso personal y comercial.

---

## Roadmap (Próximos Sprints)

- **Sprint 2**: Módulo Powerlifting (1RM, meet prep, attempt selector)
- **Sprint 3**: Deportes de equipo (wellness, ACWR, load monitoring)
- **Sprint 4**: Integración wearables (Garmin, Strava, Apple Health)
- **Sprint 5**: Reportes PDF, sharing con coach, PWA mobile