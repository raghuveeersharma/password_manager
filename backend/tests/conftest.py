import os

import pytest
from httpx import ASGITransport, AsyncClient
from pymongo import AsyncMongoClient

# Must be set before app.config.get_settings() is first called.
os.environ["MONGODB_DB"] = "passop_test"
os.environ["JWT_SECRET"] = "test-secret-" + "x" * 32

from app.config import get_settings  # noqa: E402
from app.core.limiter import limiter  # noqa: E402
from app.main import create_app  # noqa: E402


@pytest.fixture
async def client():
    settings = get_settings()
    assert settings.mongodb_db == "passop_test"
    app = create_app()
    limiter.reset()
    limiter.enabled = False  # tests opt in with the `rate_limited` fixture
    async with app.router.lifespan_context(app):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="https://test"
        ) as c:
            yield c
    mongo = AsyncMongoClient(settings.mongodb_url)
    await mongo.drop_database(settings.mongodb_db)
    await mongo.close()


@pytest.fixture
def rate_limited():
    limiter.enabled = True
    yield
    limiter.enabled = False


@pytest.fixture
def creds():
    return {
        "email": "bob@example.com",
        "auth_key": "A" * 44,
        "kdf_salt": "B" * 24,
        "kdf_params": {"algorithm": "pbkdf2-sha256", "iterations": 600000},
    }


@pytest.fixture
async def registered(client, creds):
    r = await client.post("/api/v1/auth/register", json=creds)
    assert r.status_code == 201
    return creds
