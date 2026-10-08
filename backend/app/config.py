from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Literal["development", "production"] = "development"
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "passop"
    jwt_secret: str = "change-me"
    access_token_minutes: int = 15
    refresh_token_days: int = 14
    cors_origins: list[str] = ["http://localhost:5173"]
    # Cookie flags: keep Secure on. Browsers accept Secure cookies on http://localhost.
    cookie_secure: bool = True
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    # Vault payloads are a few KB; anything bigger than this is rejected with 413.
    max_request_bytes: int = 64 * 1024

    @model_validator(mode="after")
    def _production_checks(self) -> "Settings":
        if self.environment == "production":
            if self.jwt_secret == "change-me" or len(self.jwt_secret) < 32:
                raise ValueError("JWT_SECRET must be a random string of at least 32 characters in production")
            if not self.cookie_secure:
                raise ValueError("COOKIE_SECURE must be true in production")
            if self.cookie_samesite == "none" and not self.cookie_secure:
                raise ValueError("COOKIE_SAMESITE=none requires COOKIE_SECURE=true")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
