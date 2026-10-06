# TODO

Legend: `[ ]` open · `[x]` done. Detailed backend steps are in BACKEND_PLAN.md.

## Phase 0 — Frontend fixes (before backend)
- [x] Remove `console.log` of master password in `TableComponent.jsx`
- [x] Use `item.id` as React `key` instead of `index`
- [x] Fix edit flow: don't remove the item until the edit is saved (or add a cancel button)
- [x] Remove duplicate `<Toaster />` (rendered in both `Manager` and `TableComponent`)
- [x] Add a `.env.example` documenting `VITE_*` vars
- [x] Move `lord-icon` script usage/CDN loading into one documented place
- [x] Add a "show password" reveal on the table (behind master password)
- [x] Add password generator and strength meter (nice-to-have)
- [ ] Fix 5 pre-existing `react/prop-types` lint errors in `TableComponent.jsx` (add `prop-types` or disable the rule)

Phase 0 status: complete (2026-10-06) except the lint item above. `vite build` passes; not yet manually tested in a browser.

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
- [ ] CRUD endpoints under `/vault`, scoped to current user
- [ ] Pydantic schemas (ciphertext + iv fields, size limits)
- [ ] Tests incl. cross-user access returns 404

## Phase 4 — Frontend integration
- [ ] `VITE_API_URL`, `src/api/client.js` with 401→refresh handling
- [ ] `src/crypto/` module (PBKDF2/Argon2 key derivation, AES-GCM)
- [ ] `AuthContext`, Login and Register pages, logout in `Navbar`
- [ ] Replace localStorage in `Manager` with API calls (loading + error states)
- [ ] One-time import of existing localStorage entries → server (re-encrypt with new key)
- [ ] Remove `VITE_SECRET_KEY` and the localStorage master-password logic

## Phase 5 — Hardening & release
- [ ] Security headers, HSTS, request size limits
- [ ] Dockerfile + docker-compose (api + mongo)
- [ ] CI: lint + tests for front and backend
- [ ] Deploy backend (Render/Fly/VPS) and update frontend env
- [ ] Set up MongoDB Atlas (or managed) + backups, least-privilege DB user
- [ ] Out of scope for now: changing/resetting the master password (it is fixed)
- [ ] Optional: TOTP 2FA, export/import, password-breach check, auto-lock timer
