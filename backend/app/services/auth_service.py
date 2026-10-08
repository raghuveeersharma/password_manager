from datetime import UTC, datetime, timedelta

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from app.config import Settings
from app.core import security
from app.models import RefreshToken, User
from app.schemas.auth import RegisterRequest


class EmailTaken(Exception):
    pass


class InvalidCredentials(Exception):
    pass


class InvalidRefreshToken(Exception):
    pass


def _utcnow() -> datetime:
    # Mongo returns naive UTC datetimes; keep everything naive UTC for comparisons.
    return datetime.now(UTC).replace(tzinfo=None)


async def register(data: RegisterRequest) -> User:
    user = User(
        email=data.email,
        auth_hash=security.hash_auth_key(data.auth_key),
        kdf_salt=data.kdf_salt,
        kdf_params=data.kdf_params.model_dump(),
    )
    try:
        await user.insert()
    except DuplicateKeyError:
        raise EmailTaken from None
    return user


async def get_kdf_params(email: str, settings: Settings) -> tuple[str, dict]:
    user = await User.find_one(User.email == email)
    if user is None:
        return security.fake_kdf_salt(email, settings), security.DEFAULT_KDF_PARAMS
    return user.kdf_salt, user.kdf_params


async def authenticate(email: str, auth_key: str) -> User:
    user = await User.find_one(User.email == email)
    # Always run one Argon2 verification so timing doesn't reveal whether the email exists.
    auth_hash = user.auth_hash if user else security.DUMMY_HASH
    ok = security.verify_auth_key(auth_hash, auth_key)
    if user is None or not ok:
        raise InvalidCredentials
    return user


async def issue_refresh_token(user_id: PydanticObjectId, settings: Settings) -> str:
    token = security.new_refresh_token()
    await RefreshToken(
        user_id=user_id,
        token_hash=security.hash_refresh_token(token),
        expires_at=_utcnow() + timedelta(days=settings.refresh_token_days),
    ).insert()
    return token


async def rotate_refresh_token(token: str, settings: Settings) -> tuple[User, str]:
    record = await RefreshToken.find_one(RefreshToken.token_hash == security.hash_refresh_token(token))
    if record is None or record.expires_at <= _utcnow():
        raise InvalidRefreshToken
    if record.revoked_at is not None:
        # A revoked token was replayed: assume theft and kill every session for this user.
        await RefreshToken.find(
            RefreshToken.user_id == record.user_id, RefreshToken.revoked_at == None  # noqa: E711
        ).update({"$set": {"revoked_at": _utcnow()}})
        raise InvalidRefreshToken
    user = await User.get(record.user_id)
    if user is None:
        raise InvalidRefreshToken
    record.revoked_at = _utcnow()
    await record.save()
    return user, await issue_refresh_token(user.id, settings)


async def revoke_refresh_token(token: str) -> None:
    record = await RefreshToken.find_one(RefreshToken.token_hash == security.hash_refresh_token(token))
    if record is not None and record.revoked_at is None:
        record.revoked_at = _utcnow()
        await record.save()
