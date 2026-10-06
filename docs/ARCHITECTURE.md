# Architecture

## 1. Current state (frontend only)

A single-page React app. No server; everything is in the browser.

```
index.html ─ main.jsx ─ App.jsx
                          ├─ Navbar          sets/verifies a "master password"
                          ├─ Manager         add/edit/delete form + state
                          │    └─ TableComponent   list, copy username/password
                          └─ Footer
```

### Data flow today
1. User enters site/username/password in `Manager`.
2. Password is AES-encrypted with `CryptoJS.AES.encrypt(pw, VITE_SECRET_KEY)`.
3. The array `[{id (uuid), site, username, password(ciphertext)}]` is saved in `localStorage["passwords"]`.
4. Master password is AES-encrypted with the same key and stored in `localStorage["PassManager"]`.
5. Copying or revealing a password prompts for the master password, compares it to the decrypted stored one, then decrypts (clipboard / shown in the table row until hidden).
6. Editing loads the entry into the form (decrypted) and saves it back in place; the form also has a password generator and strength meter (`src/utils/password.js`).

### Weaknesses of the current design
| Issue | Why it matters |
|---|---|
| `VITE_SECRET_KEY` is bundled into the JS | Anyone can read the key and decrypt all data |
| Master password stored reversibly in localStorage | Not a real authentication check; trivially recoverable |
| Data only in one browser | No sync, lost if storage is cleared |
| ~~`console.log` of master password~~ | Fixed in Phase 0 |
| ~~Edit removes the item before saving~~ | Fixed in Phase 0: edit updates in place, with a Cancel button |
| ~~Edit re-encrypted the already-encrypted password~~ | Fixed in Phase 0: password is decrypted into the form first |
| ~~`key={index}` in list~~ | Fixed in Phase 0: rows keyed by `item.id` |

## 2. Target architecture

```
┌────────────────────┐   HTTPS / JSON    ┌──────────────────────────┐
│  React SPA (front) │ ────────────────► │  FastAPI  (/api/v1)      │
│                    │ ◄──────────────── │  auth · vault · health   │
│  - Web Crypto      │   JWT (access)    │                          │
│  - derive key from │   + refresh cookie│  Beanie ODM ─► MongoDB   │
│    master password │                   └──────────────────────────┘
│  - encrypt/decrypt │
│    in the browser  │
└────────────────────┘
```

### Zero-knowledge model
- The user's **master password never leaves the browser**.
- Browser derives two things from it with a KDF (PBKDF2 via Web Crypto, or Argon2 via WASM):
  1. **Auth key** → sent to the server as the login credential (server hashes it again with Argon2id).
  2. **Encryption key** → kept only in memory; used with AES-256-GCM to encrypt each vault item's password (and optionally username/site notes).
- Server stores: user email, salt, KDF params, hashed auth key, and vault items whose sensitive fields are ciphertext + IV.
- Consequence: a DB leak does not expose passwords; a forgotten master password is unrecoverable (must be stated in the UI).
- **The master password is fixed for now.** There is no change-password or reset flow: the KDF salt and encryption key are tied to it, so changing it would mean re-encrypting every item. Revisit later (would be a client-side re-encrypt + bulk update endpoint).

### Backend structure (FastAPI)
```
backend/
├── app/
│   ├── main.py            app factory, CORS, router include
│   ├── config.py          pydantic-settings
│   ├── db.py              Mongo client + Beanie init (init_beanie)
│   ├── models/            user.py, vault_item.py, refresh_token.py (Beanie Documents)
│   ├── schemas/           Pydantic request/response models
│   ├── api/v1/            auth.py, vault.py, health.py
│   ├── services/          auth_service.py, vault_service.py
│   └── core/              security.py (argon2, JWT), deps.py (get_current_user)
├── tests/
├── requirements.txt
└── .env.example
```

### Data model (MongoDB collections)
```
users
  _id (ObjectId) · email (unique index) · auth_hash · kdf_salt · kdf_params
  created_at · updated_at

vault_items
  _id (ObjectId) · user_id (ObjectId, indexed) · site · username
  password_ciphertext · iv · notes_ciphertext (optional)
  created_at · updated_at

refresh_tokens
  _id · user_id · token_hash · expires_at (TTL index) · revoked_at
```
Item ids exposed to the frontend are the `_id` as a string. The frontend's old uuid ids are replaced on import. The expired refresh tokens are removed automatically by a MongoDB TTL index. No migrations: schema changes are handled in the Beanie models (and a script if existing data needs reshaping).

### API surface (v1)
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| POST | `/auth/register` | create user (email, auth key, kdf salt/params) |
| GET | `/auth/kdf-params?email=` | salt + params needed before login |
| POST | `/auth/login` | returns access token, sets refresh cookie |
| POST | `/auth/refresh` | rotate refresh token |
| POST | `/auth/logout` | revoke refresh token |
| GET | `/vault` | list current user's items |
| POST | `/vault` | create item |
| PUT | `/vault/{id}` | update item |
| DELETE | `/vault/{id}` | delete item |

### Frontend changes
- New `src/api/client.js` (fetch wrapper, attaches token, handles 401 → refresh).
- New `src/crypto/` (derive keys, encrypt/decrypt with Web Crypto).
- New `AuthContext` + Login/Register views; `Manager` reads/writes via API instead of localStorage.
- `VITE_API_URL` env var for the backend base URL.

### Security controls
- HTTPS only; HSTS in production.
- Access JWT short-lived (15 min), kept in memory; refresh token in `HttpOnly; Secure; SameSite` cookie, rotated.
- Rate limiting on login/register; generic error messages.
- CORS restricted to known frontend origins.
- Every vault query filtered by `user_id` from the token (no IDOR).
- Pydantic validation on all input; request size limits.
