# Guía de Despliegue: Data Based Training

## Arquitectura
- **Backend**: FastAPI + SQLite → Render (gratis)
- **Frontend**: React + Vite → Vercel (gratis)

---

## 1. Preparar Repositorio GitHub

```bash
cd C:\Users\User\Proyectos\mi-app-fitness
git init
git add .
git commit -m "Initial commit: Data Based Training app"
# Crear repo en GitHub y push
git remote add origin https://github.com/TU_USUARIO/mi-app-fitness.git
git push -u origin master
```

---

## 2. Backend en Render

### Archivos creados:
- `render.yaml` - Configuración de Render
- `backend/requirements.txt` - Dependencias Python
- `backend/security.py` - Lee `SECRET_KEY` de env vars
- `backend/database.py` - Lee `DATABASE_URL` de env vars

### Pasos en Render Dashboard:

1. **Crear cuenta** en [render.com](https://render.com) y conectar GitHub
2. **New > Web Service** > Conectar tu repo `mi-app-fitness`
3. **Configuración automática** (lee `render.yaml`):
   - Name: `dbt-backend`
   - Region: `Frankfurt` (o la más cercana)
   - Plan: `Free`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables** (añadir en Settings > Environment):
   - `SECRET_KEY` → Generar una clave segura (Render puede auto-generar con `generateValue: true`)
   - `ALGORITHM` = `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` = `30`
   - `DATABASE_URL` = `sqlite:///./fitness.db` (ya está en render.yaml)
   - `PYTHON_VERSION` = `3.11`
5. **Deploy** - Render hará build y deploy automático

### URLs resultantes:
- API: `https://dbt-backend.onrender.com`
- Health check: `https://dbt-backend.onrender.com/health`
- Docs: `https://dbt-backend.onrender.com/docs`

---

## 3. Frontend en Vercel

### Archivos creados:
- `frontend/vercel.json` - Configuración de Vercel
- `frontend/.env.example` - Variables de entorno ejemplo
- `frontend/src/api/client.ts` - Usa `import.meta.env.VITE_API_URL`

### Pasos en Vercel Dashboard:

1. **Crear cuenta** en [vercel.com](https://vercel.com) y conectar GitHub
2. **Add New > Project** > Importar tu repo `mi-app-fitness`
3. **Configuración**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build` (auto-detectado)
   - Output Directory: `dist` (auto-detectado)
4. **Environment Variables** (en Settings > Environment Variables):
   - `VITE_API_URL` = `https://dbt-backend.onrender.com`
     > **Importante**: Usa la URL exacta de tu backend en Render
5. **Deploy** - Vercel hará build y deploy

### URLs resultantes:
- App: `https://mi-app-fitness.vercel.app` (o tu dominio personalizado)

---

## 4. Configurar CORS en Backend (Importante)

El frontend en Vercel necesita acceder al backend en Render. Edita `backend/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(...)

# AÑADIR ESTO:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mi-app-fitness.vercel.app",  # Tu URL de Vercel
        "http://localhost:5173",               # Para desarrollo local
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Haz commit y push → Render y Vercel harán redeploy automático.

---

## 5. Variables de Entorno Resumen

### Backend (Render)
| Variable | Valor | Nota |
|----------|-------|------|
| `SECRET_KEY` | (auto-generada o clave larga aleatoria) | **Obligatoria** |
| `ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | |
| `DATABASE_URL` | `sqlite:///./fitness.db` | |
| `PYTHON_VERSION` | `3.11` | |

### Frontend (Vercel)
| Variable | Valor | Nota |
|----------|-------|------|
| `VITE_API_URL` | `https://dbt-backend.onrender.com` | **Obligatoria** - URL exacta del backend |

---

## 6. Verificación Post-Deploy

1. **Backend health**: `curl https://dbt-backend.onrender.com/health`
   - Debe responder: `{"status":"ok","service":"dbt-api"}`

2. **Frontend**: Abre `https://tu-app.vercel.app`
   - Debe cargar la página de login
   - Regístrate y prueba funcionalidades

3. **Comprobar CORS**: En DevTools > Network, no debe haber errores de CORS

---

## 7. Notas Importantes

### SQLite en Render (Free Tier)
- La base de datos **se pierde en cada deploy** (sistema de archivos efímero)
- Para producción real, usa **PostgreSQL** (gratis en Render: `New > PostgreSQL`)
- Migración a PostgreSQL: cambia `DATABASE_URL` a `postgresql://user:pass@host/db`

### Costos
- **Render Free**: 750 hrs/mes, duerme tras 15 min inactividad (cold start ~30s)
- **Vercel Free**: 100 GB bandwidth, builds ilimitados

### Dominio Personalizado (Opcional)
- Vercel: Settings > Domains > Add
- Render: Settings > Custom Domains

---

## 8. Comandos Útiles

```bash
# Ver logs en Render
# Dashboard > Service > Logs

# Ver logs en Vercel
# Dashboard > Project > Functions > View Logs

# Test local con variables de producción
cd frontend && VITE_API_URL=https://dbt-backend.onrender.com npm run dev

# Rebuild manual
git commit --allow-empty -m "trigger rebuild" && git push
```

---

## Checklist Final

- [ ] Repo en GitHub
- [ ] `render.yaml` en raíz
- [ ] `backend/requirements.txt` actualizado
- [ ] `backend/security.py` y `database.py` usan `os.getenv()`
- [ ] `vercel.json` en `/frontend`
- [ ] `frontend/src/api/client.ts` usa `VITE_API_URL`
- [ ] Backend deployado en Render
- [ ] `SECRET_KEY` configurada en Render
- [ ] Frontend deployado en Vercel
- [ ] `VITE_API_URL` apuntando a backend de Render
- [ ] CORS configurado en `backend/main.py`
- [ ] Test completo: registro, login, crear workout, calculadoras