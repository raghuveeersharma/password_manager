# CLAUDE.md — passOP Password Manager

Guidance for Claude Code (and humans) working in this repo.

## Project layout

```
password_manager/
├── front/      React 18 + Vite + Tailwind SPA (existing)
├── backend/    FastAPI service (Phases 1–3 done: scaffold, auth, vault; Phase 5: hardening + Docker)
└── docs/       CLAUDE.md, ARCHITECTURE.md, TODO.md, BACKEND_PLAN.md, DEPLOYMENT.md
```

## Commands

Frontend (run in `front/`):
- `npm install` — install deps
- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
- `npm run lint` — ESLint
- `npm run deploy` — build + publish to gh-pages (also has `vercel.json` SPA rewrite)

Backend (run in `backend/`, inside `.venv`):
- `pip install -r requirements-dev.txt` — runtime + test/lint deps
- `uvicorn app.main:app --reload`
- `pytest`
- `ruff check .` — lint (CI runs it)
- `docker compose up -d mongo` — local MongoDB; `docker compose up --build` — api + mongo (settings from `backend/.env`)

## Frontend conventions

- JavaScript (JSX), function components + hooks, no TypeScript, no router, no state library.
- Styling: Tailwind utility classes only (purple theme). `App.css` / `index.css` are minimal.
- Toasts: `react-hot-toast`. Icons: `react-icons` and `lord-icon` web components (loaded from CDN in `index.html`).
- Components live in `front/src/components/`: `Navbar`, `Manager`, `TableComponent`, `Footer`, `Login`, `Register`, `Unlock`, `AuthCard`. Other modules: `src/api/client.js` (fetch wrapper), `src/context/AuthContext.jsx`, `src/crypto/vault.js` (key derivation + AES-GCM), `src/crypto/legacy.js` (one-time import only), `src/utils/password.js` (strength meter + generator).
- `<Toaster />` is rendered once, in `App`. The `lord-icon` script is loaded only in `index.html`.
- Env vars must be prefixed `VITE_`; `.env` is git-ignored.

## Backend conventions (planned)

- Python 3.12, FastAPI, Pydantic v2, MongoDB via Beanie ODM (PyMongo async driver). No SQL, no Alembic.
- Master password is **fixed**: there is no change/reset-master-password feature for now (it would require re-encrypting the whole vault client-side). Do not add one without discussing.
- Layout: `app/{main,config,db,models,schemas,api,services,core}`; routers thin, logic in `services/`.
- All config from env vars via `pydantic-settings`; never commit secrets.
- Every endpoint is under `/api/v1`, returns JSON, and has a pytest test.

## Security rules (important — this is a password manager)

- **Never** log passwords, master passwords, tokens, or decrypted vault data.
- **Never** put a real encryption key in a `VITE_*` variable — it ships in the browser bundle.
- Server must only ever store ciphertext for vault items (zero-knowledge design, see ARCHITECTURE.md).
- Hash login passwords with Argon2id; never store them reversibly.
- Do not weaken CORS, cookie flags, or rate limits to "make it work".

## Known issues in current frontend

Phases 0 and 4 are done (see TODO.md): the app uses the backend, derives keys from the master password, and no longer stores a master password in localStorage. `VITE_SECRET_KEY` survives only in `src/crypto/legacy.js` for the one-time import.

## Working agreements

- Keep changes small and focused; update docs in this folder when architecture or plan changes.
- Tick items off in TODO.md as they land.
