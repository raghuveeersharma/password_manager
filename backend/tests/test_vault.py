BASE = "/api/v1/vault"
AUTH = "/api/v1/auth"

ITEM = {
    "site": "https://example.com",
    "username": "bob",
    "password_ciphertext": "Y2lwaGVydGV4dA==",
    "iv": "aXZpdml2aXZpdml2",
}


async def login(client, c):
    r = await client.post(f"{AUTH}/login", json={"email": c["email"], "auth_key": c["auth_key"]})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


async def second_user(client, creds):
    other = {**creds, "email": "alice@example.com"}
    assert (await client.post(f"{AUTH}/register", json=other)).status_code == 201
    return await login(client, other)


async def test_requires_auth(client):
    assert (await client.get(BASE)).status_code == 401
    assert (await client.post(BASE, json=ITEM)).status_code == 401
    assert (await client.put(f"{BASE}/64b7f0c2a1b2c3d4e5f60718", json=ITEM)).status_code == 401
    assert (await client.delete(f"{BASE}/64b7f0c2a1b2c3d4e5f60718")).status_code == 401


async def test_crud_roundtrip(client, registered):
    h = await login(client, registered)
    assert (await client.get(BASE, headers=h)).json() == []

    r = await client.post(BASE, json=ITEM, headers=h)
    assert r.status_code == 201
    created = r.json()
    assert created["id"] and created["password_ciphertext"] == ITEM["password_ciphertext"]

    assert (await client.get(BASE, headers=h)).json()[0]["id"] == created["id"]
    assert (await client.get(f"{BASE}/{created['id']}", headers=h)).json()["site"] == ITEM["site"]

    upd = {**ITEM, "username": "robert", "iv": "bmV3aXZuZXdpdm5l"}
    r = await client.put(f"{BASE}/{created['id']}", json=upd, headers=h)
    assert r.status_code == 200
    assert r.json()["username"] == "robert" and r.json()["iv"] == upd["iv"]
    assert r.json()["id"] == created["id"]
    assert r.json()["updated_at"] >= created["updated_at"]

    assert (await client.delete(f"{BASE}/{created['id']}", headers=h)).status_code == 204
    assert (await client.get(f"{BASE}/{created['id']}", headers=h)).status_code == 404
    assert (await client.get(BASE, headers=h)).json() == []


async def test_list_only_returns_own_items(client, registered, creds):
    bob = await login(client, registered)
    alice = await second_user(client, creds)
    await client.post(BASE, json=ITEM, headers=bob)
    await client.post(BASE, json={**ITEM, "username": "alice"}, headers=alice)

    assert [i["username"] for i in (await client.get(BASE, headers=bob)).json()] == ["bob"]
    assert [i["username"] for i in (await client.get(BASE, headers=alice)).json()] == ["alice"]


async def test_cross_user_access_returns_404(client, registered, creds):
    bob = await login(client, registered)
    alice = await second_user(client, creds)
    item_id = (await client.post(BASE, json=ITEM, headers=bob)).json()["id"]

    assert (await client.get(f"{BASE}/{item_id}", headers=alice)).status_code == 404
    r = await client.put(f"{BASE}/{item_id}", json={**ITEM, "username": "evil"}, headers=alice)
    assert r.status_code == 404
    assert (await client.delete(f"{BASE}/{item_id}", headers=alice)).status_code == 404

    # Untouched for the owner.
    mine = (await client.get(f"{BASE}/{item_id}", headers=bob)).json()
    assert mine["username"] == "bob"


async def test_malformed_and_unknown_ids_return_404(client, registered):
    h = await login(client, registered)
    for bad in ("not-an-id", "123", "64b7f0c2a1b2c3d4e5f60718"):
        assert (await client.get(f"{BASE}/{bad}", headers=h)).status_code == 404
        assert (await client.put(f"{BASE}/{bad}", json=ITEM, headers=h)).status_code == 404
        assert (await client.delete(f"{BASE}/{bad}", headers=h)).status_code == 404


async def test_validation(client, registered):
    h = await login(client, registered)
    bad_payloads = [
        {**ITEM, "site": ""},
        {**ITEM, "site": "x" * 2049},
        {**ITEM, "username": "x" * 321},
        {**ITEM, "password_ciphertext": ""},
        {**ITEM, "password_ciphertext": "A" * 4097},
        {**ITEM, "password_ciphertext": "not base64!"},
        {**ITEM, "iv": "short"},
        {**ITEM, "iv": "!" * 16},
        {**ITEM, "plaintext_password": "hunter2"},  # unknown fields are rejected
        {k: v for k, v in ITEM.items() if k != "iv"},
    ]
    for payload in bad_payloads:
        r = await client.post(BASE, json=payload, headers=h)
        assert r.status_code == 422, payload
    assert (await client.get(BASE, headers=h)).json() == []


async def test_cannot_set_owner_or_id_via_body(client, registered, creds):
    bob = await login(client, registered)
    r = await client.post(BASE, json={**ITEM, "user_id": "64b7f0c2a1b2c3d4e5f60718"}, headers=bob)
    assert r.status_code == 422
