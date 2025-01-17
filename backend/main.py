from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
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
import json

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite://reservations.db")
SECRET_KEY = os.getenv("SECRET_KEY", "secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user: str):
        await websocket.accept()
        self.active_connections[user] = websocket

    def disconnect(self, user: str):
        if user in self.active_connections:
            del self.active_connections[user]

    async def send_personal_message(self, message: str, user: str):
        if user in self.active_connections:
            await self.active_connections[user].send_text(message)

    async def broadcast(self, message: str, sender: str, reply_to: int = None):
        message_data = {
            "sender": sender,
            "message": message,
            "replyTo": reply_to
        }
        for connection in self.active_connections.values():
            await connection.send_text(json.dumps(message_data))

chat_manager = ConnectionManager()

app = FastAPI(
    title="System Rezerwacji",
    description="API do zarządzania rezerwacjami i czatem",
    version="1.0.0",
    contact={
        "name": "Support",
        "email": "support@rezerwacje.com"
    },
    license_info={
        "name": "MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[{
        "name": "Chat",
        "description": "Operacje związane z czatem"
    }]
)

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

from pydantic import BaseModel, validator

class Token(BaseModel):
    access_token: str
    token_type: str

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

@app.post("/token/", response_model=Token)
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
        data={
            "sub": user.username,
            "scopes": ["admin"] if user.username == "admin" else ["user"]
        }, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

class Token(BaseModel):
    access_token: str
    token_type: str

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

@app.websocket("/ws/chat/{username}")
async def websocket_chat_endpoint(websocket: WebSocket, username: str):
    """
    WebSocket endpoint for real-time chat
    """
    await chat_manager.connect(websocket, username)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            await chat_manager.broadcast(
                message_data['message'], 
                username,
                message_data.get('replyTo')
            )
    except WebSocketDisconnect:
        chat_manager.disconnect(username)
        await chat_manager.broadcast(f"{username} left the chat")

class ChatMessage(BaseModel):
    message: str
    to_user: Optional[str] = None
    reply_to: Optional[int] = None

    @validator('reply_to', pre=True)
    def convert_reply_to(cls, v):
        if v == "test" or v == "":
            return None
        return v

@app.post("/chat/send/", tags=["Chat"])
async def send_chat_message(
    message_data: ChatMessage,
    current_user: User = Depends(get_current_user)
):
    message = message_data.message
    to_user = message_data.to_user
    reply_to = message_data.reply_to
    """
    Send a chat message to all users or specific user
    """
    if message.to_user:
        await chat_manager.send_personal_message(
            f"Private from {current_user.username}: {message.message}",
            message.to_user
        )
        return {"status": "Message sent"}
    else:
        await chat_manager.broadcast(
            message.message,
            current_user.username,
            message.reply_to
        )
        return {"status": "Message broadcasted"}

class ChatHistoryRequest(BaseModel):
    username: str

@app.post("/chat/history/", tags=["Chat"])
async def get_chat_history(
    request: ChatHistoryRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Get chat history for specific user (admin only)
    """
    # Only allow admin to access this endpoint
    if current_user.username != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can access chat history"
        )
    
    # In a real application, you would query the database here
    # For now, we'll just return a dummy response
    return {
        "username": request.username,
        "messages": [
            {"from": "system", "message": "Chat history not implemented yet"}
        ]
    }

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

# Add security scheme to OpenAPI
from fastapi.openapi.utils import get_openapi

from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel

class HTTPValidationError(BaseModel):
    detail: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ReservationRequest(BaseModel):
    resource: str
    start_time: str
    end_time: str

class ChatMessage(BaseModel):
    message: str
    to_user: Optional[str] = None
    reply_to: Optional[int] = None

class ChatHistoryRequest(BaseModel):
    username: str

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
        
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add security scheme and components
    openapi_schema["components"] = {
        "securitySchemes": {
            "OAuth2PasswordBearer": {
                "type": "oauth2",
                "flows": {
                    "password": {
                        "tokenUrl": "token",
                        "scopes": {
                            "admin": "Admin access",
                            "user": "Regular user access"
                        }
                    }
                }
            }
        },
        "schemas": {
            "HTTPValidationError": {
                "title": "HTTPValidationError",
                "type": "object",
                "properties": {
                    "detail": {
                        "title": "Detail",
                        "type": "string"
                    }
                }
            },
            "RegisterRequest": RegisterRequest.schema(),
            "Token": Token.schema(),
            "ReservationRequest": ReservationRequest.schema(),
            "ChatMessage": ChatMessage.schema(),
            "ChatHistoryRequest": ChatHistoryRequest.schema()
        }
    }
    
    # Add security requirement
    openapi_schema["security"] = [{"OAuth2PasswordBearer": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
