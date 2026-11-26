# Architecture Summary — Data Based Training API (Backend)

**Target**: `backend/` | **Phase**: 1 (Reconnaissance) | **Profile**: quick

---

## 1. Product, Principals, Authority, Protected Resources

**Product type**: REST API for strength-training tracking (powerlifting, team sports, fitness). Single-tenant SaaS style.

**Principals**:
| Principal | Source of Identity | Default Actions | Privilege Scope |
|-----------|-------------------|-----------------|-----------------|
| Anonymous (unauthenticated) | None | `POST /auth/register`, `POST /auth/login`, `GET /health` | Public |
| Authenticated User (JWT Bearer) | `sub` claim = email → `User.id` via `UserRepository.get_by_email` | CRUD own `WorkoutSession`, own `WorkoutSet`, own `OneRMHistory`, read own analytics | Tenant-scoped to `user_id` |
| Operator / Admin | Not implemented | — | — |

**Protected resources** (require valid JWT):
- `WorkoutSession` + `WorkoutSet` (user-scoped, cascade delete)
- `OneRMHistory` (user-scoped)
- Analytics: `/analytics/weekly-volume`, `/analytics/calculate-1rm`, `/analytics/save-1rm`, `/analytics/1rm-history`

**Trust-sensitive actions**: registration (password hash), login (JWT issuance), workout mutation (owner check), analytics read (owner filter).

---

## 2. Comparable-Software Baseline

No direct comparable in repo. Closest public analogues: **Supabase PostgREST** (auto-CRUD + RLS), **Hasura** (GraphQL + permissions), **Firebase Auth + Firestore rules**. This codebase implements **application-level authorization** (service layer checks `user_id`) instead of DB-level RLS. Trade-off: simpler SQL, but authorization logic lives in Python and must be audited per endpoint.

---

## 3. Tech Stack, Deployment, Offline Limits

| Layer | Technology | Version (pinned) |
|-------|------------|------------------|
| Runtime | Python | 3.12 (per `runtime.txt`) |
| Framework | FastAPI | 0.115.0 |
| ORM | SQLAlchemy | 2.0.34 (DeclarativeBase) |
| Validation | Pydantic v2 | 2.9.2 |
| Auth | python-jose (JWT HS256) + passlib (sha256_crypt) + bcrypt | 3.3.0 / 1.7.4 / 4.2.0 |
| DB | SQLite (dev) / PostgreSQL (prod via `DATABASE_URL`) | — |
| ASGI | Uvicorn | 0.30.6 |
| Test | pytest | (dev dep) |

**Source-visible deployment paths**:
- `render.yaml` → Render.com (managed PostgreSQL, `DATABASE_URL` injected)
- `Dockerfile` absent; `uvicorn main:app` entrypoint
- Frontend proxy: `vite.config.ts` → `/auth`, `/workouts`, `/analytics` → `http://127.0.0.1:8000`

**Offline build/test commands** (no external deps):
```bash
cd backend && .venv/Scripts/Activate.ps1 && pytest -v
```
- Writes: `.pytest_cache/`, `__pycache__/`
- Reads: `fitness.db` (SQLite file), `requirements.txt`
- No network calls in tests (uses in-memory SQLite via `conftest.py` fixture)

**Missing toolchains**: None for offline test. Production needs PostgreSQL driver (`psycopg2`) not in `requirements.txt` — would fail if `DATABASE_URL=postgresql://...`.

---

## 4. Entry Surfaces & Source-to-Sink Paths

| Surface | Path | Input Validation | AuthZ Control | Sink / Effect |
|---------|------|------------------|---------------|---------------|
| **HTTP POST** | `/auth/register` | `UserCreate` (EmailStr, password ≥8) | None (public) | `User` row (hashed pwd) |
| **HTTP POST** | `/auth/login` | `OAuth2PasswordRequestForm` | `UserRepository.get_by_email` + `verify_password` | JWT `access_token` (HS256, 30 min default) |
| **HTTP GET** | `/auth/me` | `oauth2_scheme` → `get_current_user` | Token → `User` | `UserResponse` (no pwd) |
| **HTTP POST** | `/workouts` | `WorkoutSessionCreate` (sets ≥1, each `exercise_name` 1-255, `weight`≥0, `reps` 1-100, `rpe` 1-10) | `get_current_user` → `user_id` scoped to session | `WorkoutSession` + `WorkoutSet[]` (cascade) |
| **HTTP GET** | `/workouts` | `skip`, `limit` (≤50) | `user_id` filter | `WorkoutSessionResponse[]` |
| **HTTP GET** | `/workouts/{id}` | Path `workout_id` | `user_id` filter + 404 | Single `WorkoutSessionResponse` |
| **HTTP DELETE** | `/workouts/{id}` | Path `workout_id` | `user_id` filter + 404 | Cascade delete |
| **HTTP GET** | `/analytics/weekly-volume` | `weeks` (default 12) | `user_id` filter | Aggregated `volume`, `sessions` per ISO week |
| **HTTP POST** | `/analytics/calculate-1rm` | `OneRMRequest` (weight≥0, reps 1-50, rpe 1-10) | `user_id` (audit only, no DB write) | Computed `OneRMResponse` (Epley ± RTS RPE) |
| **HTTP POST** | `/analytics/save-1rm` | `OneRMHistoryCreate` (exercise_name 1-255, weight≥0, reps 1-100, rpe 1-10, estimated_1rm≥0) | `user_id` scoped | `OneRMHistory` row |
| **HTTP GET** | `/analytics/1rm-history` | `exercise_name` (ILIKE), `limit` (≤100) | `user_id` filter | `OneRMHistoryResponse[]` |

**No other surfaces**: No file upload, no webhook, no CLI, no IPC, no model/tool args, no cloud events.

---

## 5. Trust Boundaries & Strongest Source-Visible Control

| Boundary | Location | Control | Strength |
|----------|----------|---------|----------|
| **Public ↔ Authenticated** | `security.py:71-79` `get_current_user` | JWT signature verification (`SECRET_KEY`) + `UserRepository.get_by_email` existence | **Strong** — cryptographic; fails closed on `JWTError` / missing user |
| **User ↔ User Data** | `routers/*.py` `Depends(get_current_user)` → `service` → `repo.filter(WorkoutSession.user_id == user_id)` | Application-level owner check on every query | **Medium** — depends on correct `user_id` propagation; no DB-level RLS |
| **Input ↔ DB** | `schemas.py` Pydantic models + `Field(ge=..., le=..., min_length=...)` | Schema validation at router entry | **Strong** — FastAPI rejects invalid payloads before handler runs |
| **Password Storage** | `security.py:23` `CryptContext(schemes=["sha256_crypt"])` | `sha256_crypt` (not bcrypt/argon2) | **Weak** — SHA-256-crypt is fast, not memory-hard; upgrade to `bcrypt` or `argon2` recommended |
| **JWT Secret** | `security.py:19` `SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")` | Env var with insecure default | **Weak** — default exposes dev token forgery; prod must override |

---

## 6. Repository-Relative Starting Paths

```
backend/
├── main.py                      # App factory, CORS, router mount, /health
├── database.py                  # Engine, SessionLocal, Base, get_db()
├── models.py                    # User, WorkoutSession, WorkoutSet, OneRMHistory
├── schemas.py                   # All Pydantic request/response models
├── security.py                  # JWT, password hash, get_current_user dep
├── routers/
│   ├── __init__.py
│   ├── auth.py                  # /register, /login, /me
│   ├── workouts.py              # CRUD /workouts
│   └── analytics.py             # /analytics/* (volume, 1RM calc, history)
├── services/
│   ├── auth_service.py          # register, authenticate, get_user_by_token
│   ├── workout_service.py       # create, list, get, delete workouts
│   └── analytics_service.py     # weekly volume, 1RM calc (Epley+RTS), 1RM history
├── repositories/
│   ├── user_repository.py       # get_by_email, get_by_id, create, email_exists
│   ├── workout_repository.py    # CRUD sessions + sets, commit/refresh
│   └── analytics_repository.py  # weekly volume SQL, 1RM history CRUD
├── tests/
│   ├── conftest.py              # Test DB fixture (SQLite :memory:)
│   ├── test_auth.py             # Register, login, me, duplicate email
│   └── test_workouts.py         # CRUD workouts, ownership isolation
├── requirements.txt
├── runtime.txt                  # python-3.12.7
└── render.yaml                  # Render.com deployment config
```

---

## 7. Prior Coverage & Gaps

No prior `coverage-ledger.json` or `findings.json` exists for this repo. All units are `prior_status: "none"`.

**Known gaps from source inspection**:
| Area | Gap | Severity (source-only) |
|------|-----|------------------------|
| Password hashing | `sha256_crypt` instead of `bcrypt`/`argon2` | High |
| JWT secret default | Hardcoded dev fallback in `security.py:19` | High |
| Rate limiting | Absent on `/auth/login`, `/auth/register` | Medium |
| Token refresh / rotation | Access token only (30 min), no refresh token | Medium |
| Input sanitization | `exercise_name` free text (no allowlist) — stored & reflected in analytics | Low |
| SQL injection | Parameterized ORM only — safe | — |
| CORS | Hardcoded origins in `main.py:30-33` — includes Vercel preview URL | Low |

---

## 8. Companion Selection Summary (from ATTACK-CLASSES.md)

| Attack Class | Applicable Boundaries | Selected Companion Blocks |
|--------------|----------------------|---------------------------|
| **Access Control** | User↔User Data (all `/workouts/*`, `/analytics/*`) | `ATTACK-CLASSES.md#Access control` + `VALIDATION-AND-REPORTING.md#Core discipline` |
| **Authentication** | Public↔Auth ( `/auth/*` ) | `ATTACK-CLASSES.md#Authentication` + `WEB-PROTOCOL-AND-AUTH.md#Core discipline` |
| **Injection** | All HTTP inputs (Pydantic validated) | `ATTACK-CLASSES.md#Injection` (excluded: ORM-only, no raw SQL) |
| **Cryptographic Failures** | Password hash (sha256_crypt), JWT (HS256) | `ATTACK-CLASSES.md#Cryptographic failures` + `MEMORY-SAFETY-AND-BINARY.md#Core discipline` |
| **Rate Limiting / DoS** | `/auth/login`, `/auth/register` | `ATTACK-CLASSES.md#Resource exhaustion` + `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Core discipline` |
| **Broken Access Control (IDOR)** | `/workouts/{id}`, `/workouts/{id}` DELETE | `ATTACK-CLASSES.md#Access control` (covered by owner filter) |
| **Security Misconfiguration** | CORS hardcoded, JWT secret default | `ATTACK-CLASSES.md#Security misconfiguration` + `CLOUD-AND-DEPLOYMENT.md#Core discipline` |

**Excluded blocks** (source fact):
- `ATTACK-CLASSES.md#Supply chain` — no CI/CD pipeline in repo, no `pip-audit`/`safety` run
- `ATTACK-CLASSES.md#Client-side` — backend only
- `ATTACK-CLASSES.md#Protocol/RPC` — REST over HTTP only, no gRPC/msgpack

---

*Generated by Phase 1 Reconnaissance per Cloudflare security-audit skill (RECONNAISSANCE.md). Ready for Phase 2 hunting assignment.*