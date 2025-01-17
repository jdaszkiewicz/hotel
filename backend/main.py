from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from tortoise.contrib.fastapi import register_tortoise
from tortoise.models import Model
from tortoise import fields
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from passlib.hash import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite://reservations.db")
SECRET_KEY = os.getenv("SECRET_KEY", "secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

class User(Model):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=255, unique=True)
    email = fields.CharField(max_length=255, unique=True)
    password_hash = fields.CharField(max_length=255)
    
    def verify_password(self, password):
        return bcrypt.verify(password, self.password_hash)

class Reservation(Model):
    id = fields.IntField(pk=True)
    resource = fields.CharField(max_length=255)
    user_id = fields.IntField()
    user_email = fields.CharField(max_length=255)  # Dodajemy pole do przechowywania emaila
    start_time = fields.CharField(max_length=255)
    end_time = fields.CharField(max_length=255)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await User.get_or_none(username=username)
    if user is None:
        raise credentials_exception
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

from pydantic import BaseModel

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

@app.post("/register/")
async def register(request: RegisterRequest):
    username = request.username
    email = request.email
    password = request.password
    if await User.filter(username=username).exists():
        raise HTTPException(status_code=400, detail="Username already exists")
    if await User.filter(email=email).exists():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user = await User.create(
        username=username,
        email=email,
        password_hash=bcrypt.hash(password)
    )
    return {"message": "User created successfully"}

@app.post("/token/")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await User.get_or_none(username=form_data.username)
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

class ReservationRequest(BaseModel):
    resource: str
    start_time: str
    end_time: str

@app.get("/reservations/")
async def get_reservations(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = await User.get_or_none(username=username)
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return await Reservation.filter(user_id=user.id)
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.post("/reservations/", status_code=201)
async def create_reservation(
    reservation: ReservationRequest,
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = await User.get_or_none(username=username)
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        res = await Reservation.create(
        resource=reservation.resource,
        user_id=user.id,  # Używamy ID zalogowanego użytkownika
        user_email=user.email,  # Dodajemy email dla kompatybilności z frontendem
        start_time=reservation.start_time,
        end_time=reservation.end_time
    )
        return {"message": "Rezerwacja dodana", "reservation": res}
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/test-api/")
async def test_api():
    return {"message": "Api dziala!"}

@app.get("/authors/")
async def authors():
    authors = os.getenv("AUTHORS", "Unknown Authors")
    return {"message": authors}

register_tortoise(
    app,
    db_url=DATABASE_URL,
    modules={"models": ["main"]},
    generate_schemas=True,
    add_exception_handlers=True,
)
