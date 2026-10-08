from pydantic import BaseModel, EmailStr, Field, field_validator


class KdfParams(BaseModel):
    algorithm: str = Field(pattern=r"^pbkdf2-sha256$")
    iterations: int = Field(ge=100_000, le=10_000_000)


def _normalize_email(v: str) -> str:
    return v.strip().lower()


class RegisterRequest(BaseModel):
    email: EmailStr
    auth_key: str = Field(min_length=16, max_length=512)
    kdf_salt: str = Field(min_length=16, max_length=128)
    kdf_params: KdfParams

    _norm = field_validator("email", mode="after")(_normalize_email)


class LoginRequest(BaseModel):
    email: EmailStr
    auth_key: str = Field(min_length=16, max_length=512)

    _norm = field_validator("email", mode="after")(_normalize_email)


class KdfParamsResponse(BaseModel):
    kdf_salt: str
    kdf_params: KdfParams


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    kdf_salt: str
    kdf_params: KdfParams


class UserResponse(BaseModel):
    id: str
    email: str
