from datetime import datetime

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

from app.models.user import utcnow


class VaultItem(Document):
    user_id: Indexed(PydanticObjectId)
    site: str
    username: str
    password_ciphertext: str
    iv: str
    notes_ciphertext: str | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "vault_items"
