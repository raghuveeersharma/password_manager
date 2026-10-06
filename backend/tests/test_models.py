from app.models import RefreshToken, User


async def test_indexes_created(client):
    user_idx = await User.get_pymongo_collection().index_information()
    assert any(i.get("unique") and i["key"] == [("email", 1)] for i in user_idx.values())

    rt_idx = await RefreshToken.get_pymongo_collection().index_information()
    assert any(i.get("expireAfterSeconds") == 0 for i in rt_idx.values())
