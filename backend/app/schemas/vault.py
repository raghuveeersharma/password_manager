from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VaultItemIn(BaseModel):
    """Create/replace payload. Only `password_ciphertext` is secret; it is opaque base64 to the server."""

    model_config = ConfigDict(extra="forbid")

    site: str = Field(min_length=1, max_length=2048)
    username: str = Field(min_length=1, max_length=320)
    password_ciphertext: str = Field(min_length=1, max_length=4096, pattern=r"^[A-Za-z0-9+/_-]+={0,2}$")
    iv: str = Field(min_length=16, max_length=64, pattern=r"^[A-Za-z0-9+/_-]+={0,2}$")


class VaultItemOut(BaseModel):
    id: str
    site: str
    username: str
    password_ciphertext: str
    iv: str
    created_at: datetime
    updated_at: datetime
