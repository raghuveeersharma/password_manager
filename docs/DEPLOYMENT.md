# Deployment runbook

These steps need your own hosting and MongoDB accounts, so they are not automated. Do them in order.

## 1. MongoDB Atlas
1. Create a cluster (M0 free tier is fine to start; use a paid tier for continuous backups).
2. **Database user (least privilege):** Database Access → add a user with the built-in role `readWrite` scoped to the `passop` database only (Add Specific Privilege → `readWrite` on database `passop`). Do not use the admin/`atlasAdmin` user for the app. The app creates its own collections and indexes at startup, which `readWrite` allows.
3. **Network access:** do not leave `0.0.0.0/0` open. Add the API host's egress IPs, or use VPC/private peering where available. PaaS hosts without fixed IPs force a wider allowlist — prefer a host with static egress IPs.
4. **Backups:** enable Cloud Backup (M10+) with point-in-time restore, or schedule `mongodump` on M0. Do a test restore into a scratch cluster once. Remember the vault is ciphertext: a backup is useless without each user's master password, and a lost master password is unrecoverable.
5. Copy the SRV connection string for the user from step 2 → `MONGODB_URL`.

## 2. Backend (container)
Build from `backend/Dockerfile` (Render, Fly.io, or any VPS with Docker). Set these environment variables:

| Variable | Value |
|---|---|
| `ENVIRONMENT` | `production` (refuses to start with a weak secret or insecure cookies, adds HSTS, hides `/docs`) |
| `JWT_SECRET` | random, 32+ chars: `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `MONGODB_URL` / `MONGODB_DB` | from Atlas; `passop` |
| `CORS_ORIGINS` | JSON list of the deployed frontend origin, e.g. `["https://you.github.io"]` (origin only: no path, no trailing slash) |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `lax` if frontend and API share a registrable domain (e.g. `app.example.com` + `api.example.com`); `none` if they are on different sites (e.g. `github.io` + `onrender.com`) |
| `FORWARDED_ALLOW_IPS` | your platform proxy's IP(s), or `*` only if the container is reachable solely through the proxy. Without this, rate limiting sees the proxy IP and all users share one bucket |

Terminate TLS at the platform's proxy. The container listens on `$PORT` (default 8000). Check `GET /api/v1/health` after deploy.

Rate limiting is in-process (slowapi memory storage): it is per instance. Run a single instance, or move the limiter to Redis before scaling out.

## 3. Frontend
Set `VITE_API_URL=https://<api-host>/api/v1` **at build time** (it is baked into the bundle) and redeploy (`npm run deploy` for gh-pages, or your Vercel project settings). `vercel.json` already sends the basic security headers; GitHub Pages cannot set headers.

If hosting on a different site than the API, `COOKIE_SAMESITE=none` is required for the refresh cookie, and browsers with third-party-cookie blocking may break silent refresh. Same-site hosting (shared parent domain) avoids this and is recommended.

## 4. Smoke test
Register a throwaway account, add an item, reload (you should land on the Unlock screen), unlock, delete the item, log out. Then check the response headers on the API (`strict-transport-security`, `x-content-type-options`, `cache-control: no-store`).

## Not done yet
- A `Content-Security-Policy` for the SPA: needs the final API origin in `connect-src` and `cdn.lordicon.com` in `script-src`/`connect-src`.
