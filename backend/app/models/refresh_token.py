from datetime import datetime

import pymongo
from beanie import Document, Indexed, PydanticObjectId


class RefreshToken(Document):
    user_id: Indexed(PydanticObjectId)
    token_hash: Indexed(str, unique=True)
    expires_at: datetime
    revoked_at: datetime | None = None

    class Settings:
        name = "refresh_tokens"
        indexes = [
            # TTL: Mongo deletes the document once expires_at has passed.
            pymongo.IndexModel([("expires_at", pymongo.ASCENDING)], expireAfterSeconds=0),
        ]
