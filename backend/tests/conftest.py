import os

import pytest
from httpx import ASGITransport, AsyncClient
from pymongo import AsyncMongoClient

# Must be set before app.config.get_settings() is first called.
os.environ["MONGODB_DB"] = "passop_test"

from app.config import get_settings  # noqa: E402
from app.main import create_app  # noqa: E402


@pytest.fixture
async def client():
    settings = get_settings()
    assert settings.mongodb_db == "passop_test"
    app = create_app()
    async with app.router.lifespan_context(app):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as c:
            yield c
    mongo = AsyncMongoClient(settings.mongodb_url)
    await mongo.drop_database(settings.mongodb_db)
    await mongo.close()

