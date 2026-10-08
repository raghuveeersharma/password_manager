# TODO

Legend: `[ ]` open · `[x]` done. Detailed backend steps are in BACKEND_PLAN.md.

Commits: one per phase (`Phase 0` … `Phase 5`). Phase 5 deployment items remain open.

## Phase 0 — Frontend fixes (before backend)
- [x] Remove `console.log` of master password in `TableComponent.jsx`
- [x] Use `item.id` as React `key` instead of `index`
- [x] Fix edit flow: don't remove the item until the edit is saved (or add a cancel button)
- [x] Remove duplicate `<Toaster />` (rendered in both `Manager` and `TableComponent`)
- [x] Add a `.env.example` documenting `VITE_*` vars
- [x] Move `lord-icon` script usage/CDN loading into one documented place
- [x] Add a "show password" reveal on the table (behind master password)
- [x] Add password generator and strength meter (nice-to-have)
- [x] Fix `react/prop-types` lint errors (rule disabled in `eslint.config.js`; plain-JSX project)

Phase 0 status: complete (2026-10-06). `vite build` and `npm run lint` pass.

## Phase 1 — Backend foundation
- [x] Scaffold `backend/` (venv, `requirements.txt`, `app/main.py`, `/health`)
- [x] Config via `pydantic-settings`, `.env.example`
- [x] MongoDB connection + Beanie init in lifespan
- [x] Beanie models (`users`, `vault_items`, `refresh_tokens`) with indexes (unique email, user_id, TTL on refresh tokens)
- [x] Local Mongo via docker compose
- [x] CORS for `http://localhost:5173` and prod origin
- [x] pytest setup with separate test database + client fixture

Phase 1 status: complete (2026-10-06). `pytest` passes (4 tests) against local Mongo (`docker compose up -d mongo` in `backend/`).

## Phase 2 — Auth
- [x] `POST /auth/register`, `GET /auth/kdf-params`, `POST /auth/login`
- [x] Argon2id hashing, JWT access token, rotating refresh cookie
- [x] `POST /auth/refresh`, `POST /auth/logout`
- [x] `get_current_user` dependency
- [x] Rate limiting on auth routes
- [x] Auth tests (happy path, bad password, expired/revoked token)

Phase 2 status: complete (2026-10-06). 20 tests pass. Extra: `GET /auth/me`; replaying a revoked refresh token revokes all of that user's sessions.

## Phase 3 — Vault API
- [x] CRUD endpoints under `/vault`, scoped to current user
- [x] Pydantic schemas (ciphertext + iv fields, size limits)
- [x] Tests incl. cross-user access returns 404

Phase 3 status: complete (2026-10-06). 27 tests pass. Extra: `GET /vault/{id}`; malformed ids return 404; unknown body fields rejected (422). `notes_ciphertext` stays on the model but is not exposed (a second ciphertext would need its own IV).

## Phase 4 — Frontend integration
- [x] `VITE_API_URL`, `src/api/client.js` with 401→refresh handling
- [x] `src/crypto/` module (PBKDF2 + HKDF key derivation, AES-GCM)
- [x] `AuthContext`, Login and Register pages, logout in `Navbar` (plus Unlock screen and Lock button)
- [x] Replace localStorage in `Manager` with API calls (loading + error states)
- [x] One-time import of existing localStorage entries → server (re-encrypt with new key)
- [x] Remove `VITE_SECRET_KEY` and the localStorage master-password logic (see note)

Phase 4 status: code complete (2026-10-06). `vite build` and `npm run lint` pass; crypto + API client verified with a Node smoke test against the live backend (register, login, CRUD, 401→refresh→retry, concurrent refresh, logout). **Not yet tested in a browser.**
- Key derivation: PBKDF2-SHA256 (600k iterations, Web Crypto) → HKDF into an auth key (sent to server) and a non-extractable AES-256-GCM key (memory only). Argon2 was not used: the backend only accepts `pbkdf2-sha256`.
- After a page reload the refresh cookie restores the session but not the key, so the user sees an Unlock screen. Unlock re-runs `/auth/login` to verify the master password server-side (this leaves the previous refresh token orphaned until it expires).
- The old master-password prompts are gone (the vault is already unlocked); a Lock button replaces them. Idle auto-lock is still Phase 5 optional.
- `VITE_SECRET_KEY` is no longer used for normal operation, but `src/crypto/legacy.js` still reads it so old localStorage entries can be imported. Delete that file and the variable once imported.

## Phase 5 — Hardening & release
- [x] Security headers, HSTS, request size limits
- [x] Dockerfile + docker-compose (api + mongo)
- [x] CI: lint + tests for front and backend
- [ ] Deploy backend (Render/Fly/VPS) and update frontend env — needs your hosting account; see DEPLOYMENT.md
- [ ] Set up MongoDB Atlas (or managed) + backups, least-privilege DB user — needs your Atlas account; see DEPLOYMENT.md
- [x] Out of scope for now: changing/resetting the master password (it is fixed)
- [ ] Optional: TOTP 2FA, export/import, password-breach check, auto-lock timer

Phase 5 status: code and config done (2026-10-06); deployment steps remain and are documented in DEPLOYMENT.md. 35 backend tests pass; `ruff`, `npm run lint` and `vite build` pass; the Docker image builds and the api + mongo stack ran healthy in production mode.
- Backend: security headers on every response (`nosniff`, `DENY`, `no-store`, CSP, referrer/permissions policy), HSTS and hidden `/docs` when `ENVIRONMENT=production`, 64 KB request body limit (413, also for chunked uploads), startup refuses a weak `JWT_SECRET` or non-Secure cookies in production.
- `requirements.txt` is now runtime-only; test/lint tools are in `requirements-dev.txt`.
- CI is `.github/workflows/ci.yml` (backend with a Mongo service, frontend, Docker build). It has never run on GitHub yet.
- Rate limiting is per instance; run one instance or move the limiter to Redis before scaling out.
- Frontend security headers are in `vercel.json` only; a CSP for the SPA is not added yet.
