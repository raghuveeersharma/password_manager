import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.config import Settings
from app.main import create_app


async def test_security_headers_on_success_and_errors(client):
    for r in (
        await client.get("/api/v1/health"),
        await client.get("/api/v1/vault"),  # 401
        await client.get("/api/v1/nope"),  # 404
    ):
        assert r.headers["x-content-type-options"] == "nosniff"
        assert r.headers["x-frame-options"] == "DENY"
        assert r.headers["cache-control"] == "no-store"
        assert r.headers["referrer-policy"] == "no-referrer"
        assert "default-src 'none'" in r.headers["content-security-policy"]
        assert "strict-transport-security" not in r.headers  # development


async def test_swagger_ui_is_not_locked_down_by_csp_in_dev(client):
    r = await client.get("/docs")
    assert r.status_code == 200
    assert "content-security-policy" not in r.headers


async def test_oversized_body_rejected_with_413(client):
    big = {"email": "bob@example.com", "auth_key": "A" * 100_000, "kdf_salt": "B" * 24,
           "kdf_params": {"algorithm": "pbkdf2-sha256", "iterations": 600000}}
    r = await client.post("/api/v1/auth/register", json=big)
    assert r.status_code == 413
    assert r.headers["x-content-type-options"] == "nosniff"


async def test_oversized_chunked_body_rejected(client):
    async def chunks():
        for _ in range(10):
            yield b"x" * 10_000  # no Content-Length: counted as it streams

    r = await client.post("/api/v1/auth/register", content=chunks(),
                          headers={"Content-Type": "application/json"})
    assert r.status_code == 413


async def test_normal_sized_body_still_works(client, creds):
    assert (await client.post("/api/v1/auth/register", json=creds)).status_code == 201


async def test_413_carries_cors_headers(client):
    r = await client.post("/api/v1/auth/register", content=b"x" * 100_000,
                          headers={"Origin": "http://localhost:5173", "Content-Type": "application/json"})
    assert r.status_code == 413
    assert r.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_production_requires_strong_secret_and_secure_cookies():
    with pytest.raises(ValidationError):
        Settings(environment="production", jwt_secret="change-me")
    with pytest.raises(ValidationError):
        Settings(environment="production", jwt_secret="short")
    with pytest.raises(ValidationError):
        Settings(environment="production", jwt_secret="x" * 40, cookie_secure=False)
    assert Settings(environment="production", jwt_secret="x" * 40).environment == "production"


async def test_production_has_hsts_and_no_docs(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    from app.config import get_settings
    get_settings.cache_clear()
    try:
        app = create_app()
        async with app.router.lifespan_context(app):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as c:
                r = await c.get("/api/v1/health")
                assert "max-age=" in r.headers["strict-transport-security"]
                assert (await c.get("/docs")).status_code == 404
                assert (await c.get("/openapi.json")).status_code == 404
    finally:
        monkeypatch.delenv("ENVIRONMENT")
        get_settings.cache_clear()
