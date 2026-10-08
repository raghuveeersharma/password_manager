from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.models import User, VaultItem
from app.schemas.vault import VaultItemIn, VaultItemOut
from app.services import vault_service

router = APIRouter(prefix="/vault", tags=["vault"])

_NOT_FOUND = HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")


def _out(item: VaultItem) -> VaultItemOut:
    return VaultItemOut(
        id=str(item.id),
        site=item.site,
        username=item.username,
        password_ciphertext=item.password_ciphertext,
        iv=item.iv,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("", response_model=list[VaultItemOut])
async def list_items(user: User = Depends(get_current_user)) -> list[VaultItemOut]:
    return [_out(i) for i in await vault_service.list_items(user.id)]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=VaultItemOut)
async def create_item(body: VaultItemIn, user: User = Depends(get_current_user)) -> VaultItemOut:
    return _out(await vault_service.create_item(user.id, body))


@router.get("/{item_id}", response_model=VaultItemOut)
async def get_item(item_id: str, user: User = Depends(get_current_user)) -> VaultItemOut:
    try:
        return _out(await vault_service.get_item(user.id, item_id))
    except vault_service.ItemNotFound:
        raise _NOT_FOUND from None


@router.put("/{item_id}", response_model=VaultItemOut)
async def update_item(
    item_id: str, body: VaultItemIn, user: User = Depends(get_current_user)
) -> VaultItemOut:
    try:
        return _out(await vault_service.update_item(user.id, item_id, body))
    except vault_service.ItemNotFound:
        raise _NOT_FOUND from None


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str, user: User = Depends(get_current_user)) -> None:
    try:
        await vault_service.delete_item(user.id, item_id)
    except vault_service.ItemNotFound:
        raise _NOT_FOUND from None
