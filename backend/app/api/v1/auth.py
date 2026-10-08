from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response, status
from pydantic import EmailStr

from app.config import Settings, get_settings
from app.core import security
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.models import User
from app.schemas.auth import (
    KdfParamsResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
REFRESH_PATH = "/api/v1/auth"


def _set_refresh_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        REFRESH_COOKIE,
        token,
        max_age=settings.refresh_token_days * 86400,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path=REFRESH_PATH,
    )


def _clear_refresh_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        REFRESH_COOKIE,
        path=REFRESH_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


def _token_response(user: User, settings: Settings) -> TokenResponse:
    return TokenResponse(
        access_token=security.create_access_token(str(user.id), settings),
        kdf_salt=user.kdf_salt,
        kdf_params=user.kdf_params,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterRequest) -> UserResponse:
    try:
        user = await auth_service.register(body)
    except auth_service.EmailTaken:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered") from None
    return UserResponse(id=str(user.id), email=user.email)


@router.get("/kdf-params", response_model=KdfParamsResponse)
@limiter.limit("20/minute")
async def kdf_params(
    request: Request,
    email: EmailStr = Query(),
    settings: Settings = Depends(get_settings),
) -> KdfParamsResponse:
    salt, params = await auth_service.get_kdf_params(email.strip().lower(), settings)
    return KdfParamsResponse(kdf_salt=salt, kdf_params=params)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    response: Response,
    body: LoginRequest,
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    try:
        user = await auth_service.authenticate(body.email, body.auth_key)
    except auth_service.InvalidCredentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password") from None
    _set_refresh_cookie(response, await auth_service.issue_refresh_token(user.id, settings), settings)
    return _token_response(user, settings)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    if refresh_token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    try:
        user, new_token = await auth_service.rotate_refresh_token(refresh_token, settings)
    except auth_service.InvalidRefreshToken:
        _clear_refresh_cookie(response, settings)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token") from None
    _set_refresh_cookie(response, new_token, settings)
    return _token_response(user, settings)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
async def logout(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    if refresh_token:
        await auth_service.revoke_refresh_token(refresh_token)
    _clear_refresh_cookie(response, settings)


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(id=str(user.id), email=user.email)
