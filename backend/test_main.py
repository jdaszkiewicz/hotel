import pytest
from httpx import AsyncClient
from main import app
from tortoise import Tortoise

@pytest.mark.asyncio
async def test_get_reservations():
    async with AsyncClient(base_url="http://127.0.0.1:8000") as client:
        response = await client.get("/reservations/")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_create_reservation():
    data = {
        "resource": "Pokoj 1408",
        "user": "Mike Enslin",
        "start_time": "2024-12-01T10:00",
        "end_time": "2024-12-01T12:00",
    }

    async with AsyncClient(base_url="http://127.0.0.1:8000") as client:
        response = await client.post("/reservations/", json=data)
        assert response.status_code == 200
        assert "Rezerwacja dodana" in response.json()["message"]

@pytest.mark.asyncio
async def test_cleanup():
    await Tortoise.init(
        db_url='sqlite://reservations.db', 
        modules={'models': ['main']}
    )
    await Tortoise.get_connection("default").execute_query('DELETE FROM reservation')
    await Tortoise.close_connections()
