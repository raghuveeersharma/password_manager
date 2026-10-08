import base64
import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.config import Settings

_hasher = PasswordHasher()  # Argon2id by default
# Verified against when the user is unknown so login timing doesn't reveal existence.
DUMMY_HASH = _hasher.hash("dummy-auth-key")

DEFAULT_KDF_PARAMS = {"algorithm": "pbkdf2-sha256", "iterations": 600_000}


def hash_auth_key(auth_key: str) -> str:
    return _hasher.hash(auth_key)


def verify_auth_key(auth_hash: str, auth_key: str) -> bool:
    try:
        return _hasher.verify(auth_hash, auth_key)
    except (VerificationError, InvalidHashError):
        return False


def fake_kdf_salt(email: str, settings: Settings) -> str:
    """Deterministic per-email salt for unknown users (prevents enumeration)."""
    digest = hmac.new(settings.jwt_secret.encode(), f"kdf-salt:{email}".encode(), hashlib.sha256).digest()
    return base64.b64encode(digest[:16]).decode()


def create_access_token(user_id: str, settings: Settings) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str, settings: Settings) -> str | None:
    """Returns the user id, or None if the token is invalid/expired."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=["HS256"], options={"require": ["exp", "sub"]}
        )
    except jwt.PyJWTError:
        return None
    if payload.get("type") != "access":
        return None
    return payload["sub"]


def new_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
