from beanie import init_beanie
from pymongo import AsyncMongoClient

from app.config import Settings
from app.models import DOCUMENT_MODELS


async def init_db(settings: Settings) -> AsyncMongoClient:
    client = AsyncMongoClient(settings.mongodb_url)
    await init_beanie(database=client[settings.mongodb_db], document_models=DOCUMENT_MODELS)
    return client
