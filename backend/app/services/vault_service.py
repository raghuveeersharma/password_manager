from beanie import PydanticObjectId

from app.models import VaultItem
from app.models.user import utcnow
from app.schemas.vault import VaultItemIn


class ItemNotFound(Exception):
    pass


def _parse_id(item_id: str) -> PydanticObjectId:
    # A malformed id is indistinguishable from a missing one.
    if not PydanticObjectId.is_valid(item_id):
        raise ItemNotFound
    return PydanticObjectId(item_id)


async def _get_owned(user_id: PydanticObjectId, item_id: str) -> VaultItem:
    item = await VaultItem.find_one(
        VaultItem.id == _parse_id(item_id), VaultItem.user_id == user_id
    )
    if item is None:
        raise ItemNotFound
    return item


async def list_items(user_id: PydanticObjectId) -> list[VaultItem]:
    return await VaultItem.find(VaultItem.user_id == user_id).sort(-VaultItem.created_at).to_list()


async def create_item(user_id: PydanticObjectId, data: VaultItemIn) -> VaultItem:
    item = VaultItem(user_id=user_id, **data.model_dump())
    await item.insert()
    return item


async def get_item(user_id: PydanticObjectId, item_id: str) -> VaultItem:
    return await _get_owned(user_id, item_id)


async def update_item(user_id: PydanticObjectId, item_id: str, data: VaultItemIn) -> VaultItem:
    item = await _get_owned(user_id, item_id)
    for field, value in data.model_dump().items():
        setattr(item, field, value)
    item.updated_at = utcnow()
    await item.save()
    return item


async def delete_item(user_id: PydanticObjectId, item_id: str) -> None:
    item = await _get_owned(user_id, item_id)
    await item.delete()
