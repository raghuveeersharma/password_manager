from datetime import UTC, datetime, timedelta

import jwt

from app.config import get_settings
from app.core.security import hash_refresh_token
from app.models import RefreshToken, User

BASE = "/api/v1/auth"


def login_body(c):
    return {"email": c["email"], "auth_key": c["auth_key"]}


async def test_register_stores_only_hash(client, creds):
    r = await client.post(f"{BASE}/register", json=creds)
    assert r.status_code == 201
    assert "auth_key" not in r.text
    user = await User.find_one(User.email == creds["email"])
    assert user.auth_hash.startswith("$argon2id$")
    assert creds["auth_key"] not in user.auth_hash


async def test_register_normalizes_email_and_rejects_duplicate(client, registered):
    r = await client.post(f"{BASE}/register", json={**registered, "email": " BOB@Example.com "})
    assert r.status_code == 409


async def test_register_validation(client, creds):
    weak = {**creds, "kdf_params": {"algorithm": "pbkdf2-sha256", "iterations": 10}}
    assert (await client.post(f"{BASE}/register", json=weak)).status_code == 422
    assert (await client.post(f"{BASE}/register", json={**creds, "email": "nope"})).status_code == 422
    assert (await client.post(f"{BASE}/register", json={**creds, "auth_key": "x"})).status_code == 422


async def test_kdf_params_known_and_unknown(client, registered):
    r = await client.get(f"{BASE}/kdf-params", params={"email": registered["email"]})
    assert r.status_code == 200
    assert r.json()["kdf_salt"] == registered["kdf_salt"]

    a = await client.get(f"{BASE}/kdf-params", params={"email": "ghost@example.com"})
    b = await client.get(f"{BASE}/kdf-params", params={"email": "ghost@example.com"})
    assert a.status_code == 200
    assert a.json() == b.json()  # deterministic, so it can't be told apart by retrying
    assert a.json()["kdf_salt"] != registered["kdf_salt"]


async def test_login_happy_path(client, registered):
    r = await client.post(f"{BASE}/login", json=login_body(registered))
    assert r.status_code == 200
    body = r.json()
    assert body["kdf_salt"] == registered["kdf_salt"]
    cookie = r.headers["set-cookie"].lower()
    assert "httponly" in cookie and "secure" in cookie and "samesite=lax" in cookie
    assert "path=/api/v1/auth" in cookie

    me = await client.get(f"{BASE}/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == registered["email"]


async def test_login_bad_password_and_unknown_user_look_the_same(client, registered):
    bad = await client.post(f"{BASE}/login", json={**login_body(registered), "auth_key": "Z" * 44})
    ghost = await client.post(f"{BASE}/login", json={**login_body(registered), "email": "ghost@example.com"})
    assert bad.status_code == ghost.status_code == 401
    assert bad.json() == ghost.json()
    assert "set-cookie" not in bad.headers


async def test_me_requires_valid_token(client, registered):
    assert (await client.get(f"{BASE}/me")).status_code == 401
    assert (await client.get(f"{BASE}/me", headers={"Authorization": "Bearer junk"})).status_code == 401


async def test_expired_access_token_rejected(client, registered):
    user = await User.find_one(User.email == registered["email"])
    settings = get_settings()
    expired = jwt.encode(
        {"sub": str(user.id), "type": "access", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.jwt_secret,
        algorithm="HS256",
    )
    r = await client.get(f"{BASE}/me", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


async def test_token_of_wrong_type_or_key_rejected(client, registered):
    user = await User.find_one(User.email == registered["email"])
    exp = datetime.now(UTC) + timedelta(minutes=5)
    for payload, key in [
        ({"sub": str(user.id), "type": "refresh", "exp": exp}, get_settings().jwt_secret),
        ({"sub": str(user.id), "type": "access", "exp": exp}, "x" * 32),
    ]:
        t = jwt.encode(payload, key, algorithm="HS256")
        r = await client.get(f"{BASE}/me", headers={"Authorization": f"Bearer {t}"})
        assert r.status_code == 401


async def test_refresh_rotates_token(client, registered):
    await client.post(f"{BASE}/login", json=login_body(registered))
    old = client.cookies.get("refresh_token")
    r = await client.post(f"{BASE}/refresh")
    assert r.status_code == 200
    assert r.json()["access_token"]
    new = client.cookies.get("refresh_token")
    assert new and new != old
    # Only hashes are stored.
    assert await RefreshToken.find_one(RefreshToken.token_hash == hash_refresh_token(new))
    assert not await RefreshToken.find_one(RefreshToken.token_hash == new)


async def test_refresh_without_cookie(client, registered):
    assert (await client.post(f"{BASE}/refresh")).status_code == 401


async def test_revoked_token_replay_revokes_all_sessions(client, registered):
    await client.post(f"{BASE}/login", json=login_body(registered))
    stolen = client.cookies.get("refresh_token")
    assert (await client.post(f"{BASE}/refresh")).status_code == 200  # legit rotation
    current = client.cookies.get("refresh_token")

    client.cookies.clear()
    client.cookies.set("refresh_token", stolen, path="/api/v1/auth")
    assert (await client.post(f"{BASE}/refresh")).status_code == 401  # replay detected

    client.cookies.clear()
    client.cookies.set("refresh_token", current, path="/api/v1/auth")
    assert (await client.post(f"{BASE}/refresh")).status_code == 401  # the rotated one is dead too


async def test_expired_refresh_token_rejected(client, registered):
    await client.post(f"{BASE}/login", json=login_body(registered))
    rec = await RefreshToken.find_one(
        RefreshToken.token_hash == hash_refresh_token(client.cookies.get("refresh_token"))
    )
    rec.expires_at = datetime.now(UTC).replace(tzinfo=None) - timedelta(seconds=1)
    await rec.save()
    assert (await client.post(f"{BASE}/refresh")).status_code == 401


async def test_logout_revokes_refresh_token(client, registered):
    await client.post(f"{BASE}/login", json=login_body(registered))
    token = client.cookies.get("refresh_token")
    r = await client.post(f"{BASE}/logout")
    assert r.status_code == 204
    client.cookies.set("refresh_token", token, path="/api/v1/auth")
    assert (await client.post(f"{BASE}/refresh")).status_code == 401


async def test_logout_without_cookie_is_ok(client):
    assert (await client.post(f"{BASE}/logout")).status_code == 204


async def test_login_rate_limited(client, registered, rate_limited):
    codes = [
        (await client.post(f"{BASE}/login", json={**login_body(registered), "auth_key": "Z" * 44})).status_code
        for _ in range(11)
    ]
    assert codes[:10] == [401] * 10
    assert codes[10] == 429
