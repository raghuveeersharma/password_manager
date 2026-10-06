# Backend Plan — FastAPI + Frontend Integration

Goal: replace browser-only localStorage storage with an authenticated FastAPI backend, keeping vault data end-to-end encrypted (server stores ciphertext only). See ARCHITECTURE.md for the design.

## Stack
- Python 3.12, FastAPI, Uvicorn
- MongoDB + Beanie ODM (PyMongo async driver); `mongomock-motor`-style mocking is avoided — tests use a real throwaway Mongo database
- Pydantic v2 + pydantic-settings
- `argon2-cffi` (hashing), `pyjwt` (tokens), `slowapi` (rate limits)
- pytest + httpx for tests

## Step 1 — Scaffold
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install fastapi "uvicorn[standard]" beanie pymongo \
  pydantic-settings argon2-cffi pyjwt slowapi pytest pytest-asyncio httpx
pip freeze > requirements.txt
```
Create the layout from ARCHITECTURE.md. `app/main.py` exposes `GET /api/v1/health` and adds `CORSMiddleware` with origins from `CORS_ORIGINS`.

`.env.example`:
```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=passop
JWT_SECRET=change-me
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=14
CORS_ORIGINS=["http://localhost:5173"]
```

## Step 2 — Database
Run MongoDB locally (`docker run -d -p 27017:27017 mongo:7` or a compose service) or use Atlas.
Models are Beanie `Document`s: `User`, `VaultItem`, `RefreshToken` (fields in ARCHITECTURE.md), with `Settings.name` for the collection and indexes (unique `email`, `vault_items.user_id`, TTL on `refresh_tokens.expires_at`). Call `init_beanie(database, document_models=[...])` in the FastAPI lifespan handler. No migrations.

## Step 3 — Auth
- Register: client sends `email`, `auth_key` (derived), `kdf_salt`, `kdf_params`. Server stores `argon2id(auth_key)`.
- `GET /auth/kdf-params?email=` returns salt/params (return a deterministic fake for unknown emails to avoid user enumeration).
- Login: verify auth key → issue access JWT (body) + refresh token (HttpOnly cookie, hashed in DB, rotated on use).
- `core/deps.py::get_current_user` decodes the bearer token and loads the user.

## Step 4 — Vault endpoints
CRUD under `/api/v1/vault`. Every query includes `user_id == current_user.id`. Schema:
```json
{ "id": "uuid", "site": "https://…", "username": "bob",
  "password_ciphertext": "base64", "iv": "base64" }
```
Validate `{id}` as an ObjectId (400/404 on bad format). Return 404 (not 403) for items owned by others. Cap field lengths.

## Step 5 — Tests
Use httpx `AsyncClient` against the app with a separate test database (`passop_test`) that is dropped after each run. Cover: register/login/refresh/logout, token expiry, CRUD, cross-user isolation, validation errors, rate limit.

## Step 6 — Frontend integration (in `front/`)
1. Add `VITE_API_URL=http://localhost:8000/api/v1` to `.env` / `.env.example`.
2. `src/api/client.js`: `fetch` wrapper with `credentials: "include"`, bearer header from in-memory token, one automatic retry via `/auth/refresh` on 401.
3. `src/crypto/vault.js`: `deriveKeys(masterPassword, salt, params)` → `{authKey, encKey}`; `encrypt(encKey, plaintext)` / `decrypt(...)` using Web Crypto AES-GCM with a random 12-byte IV.
4. `src/context/AuthContext.jsx`: holds access token + `encKey` in memory; `login`, `register`, `logout`; auto-lock after inactivity.
5. Add `Login`/`Register` components; gate `Manager` behind auth in `App.jsx`.
6. `Manager.jsx`: on mount `GET /vault`; add/edit/delete call the API and update state from the response. Show loading and error toasts.
7. `TableComponent.jsx`: decrypt on demand with `encKey`; drop the master-password prompt (the user is already unlocked) or re-prompt for sensitive actions.
8. Migration helper: if `localStorage.passwords` exists after first login, offer to import — decrypt with the legacy key, re-encrypt with the new `encKey`, POST, then clear localStorage.
9. Delete `VITE_SECRET_KEY` usage and `PassManager` localStorage logic.

## Step 7 — Dev workflow
- Backend: `uvicorn app.main:app --reload --port 8000`
- Frontend: `npm run dev` (port 5173). Optionally add a Vite proxy for `/api` → `http://localhost:8000` to avoid CORS during dev.
- Later: `docker-compose.yml` with `api` + `mongo`.

## Step 8 — Deploy
- Backend container on Render/Fly/VPS behind HTTPS; MongoDB on Atlas (or a managed instance); restrict network access and use a least-privilege DB user.
- Set `CORS_ORIGINS` to the deployed frontend URL; set `VITE_API_URL` at frontend build time.
- Cookies: `Secure`, `SameSite=None` if the front and API are on different sites (otherwise `Lax`).

## Milestones
1. Health check + DB + migrations running
2. Auth working end-to-end with tests
3. Vault CRUD with tests
4. Frontend login + vault via API
5. Legacy data import, remove old crypto, deploy

## Open questions
- Argon2 in-browser (WASM) vs PBKDF2 via Web Crypto (simpler, weaker)?
- Encrypt `site`/`username` too, or only the password? (Encrypting all prevents server-side search.)
- Account recovery: accept "no recovery" or add a recovery key? (Master password change is out of scope for now — it is fixed.)
