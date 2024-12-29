from fastapi import FastAPI
from tortoise.contrib.fastapi import register_tortoise
from tortoise.models import Model
from tortoise import fields
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite://reservations.db")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  
)

class Reservation(Model):
    id = fields.IntField(pk=True)
    resource = fields.CharField(max_length=255)
    user = fields.CharField(max_length=255)
    start_time = fields.CharField(max_length=255)
    end_time = fields.CharField(max_length=255)

@app.get("/reservations/")
async def get_reservations():
    return await Reservation.all()

@app.post("/reservations/")
async def create_reservation(reservation: dict):
    res = await Reservation.create(**reservation)
    return {"message": "Rezerwacja dodana", "reservation": res}

register_tortoise(
    app,
    db_url=DATABASE_URL,
    modules={"models": ["main"]},
    generate_schemas=True,
    add_exception_handlers=True,
)
