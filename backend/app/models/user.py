from datetime import datetime, timezone

from beanie import Document, Indexed
from pydantic import Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Document):
    email: Indexed(str, unique=True)
    auth_hash: str
    kdf_salt: str
    kdf_params: dict
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "users"
