from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Annotated
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import os
import uuid

from models.user import UserCreate, User, UserInDB, Token, TokenData, UserResponse
from database import get_users_collection

# Initialize router
router = APIRouter(tags=["auth"])

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Ensure bcrypt is installed correctly
try:
    import bcrypt
except ImportError:
    raise ImportError("bcrypt is not installed. Please install it using 'pip install bcrypt'.")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(email: str):
    user = await get_users_collection().find_one({"email": email})
    if user:
        return UserInDB(**user)

async def authenticate_user(email: str, password: str):
    user = await get_user(email)
    if not user:
        return False
    if not verify_password(password, user.passwordHash):
        return False
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

def create_refresh_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(id=user_id)
    except JWTError:
        raise credentials_exception
    user = await get_users_collection().find_one({"id": token_data.id})
    if user is None:
        raise credentials_exception
    return User(**user)

# API Endpoints
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post(
    "/register",
    response_model=UserResponse,
    summary="Register a new user",
    description="Register a new user with name, email, and password.",
    responses={
        200: {
            "description": "User registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "data": {
                            "id": "user_id",
                            "name": "John Doe",
                            "email": "john@example.com",
                            "role": "creator",
                            "createdAt": "created_at",
                            "updatedAt": "updated_at"
                        },
                        "error": None
                    }
                }
            }
        },
        400: {
            "description": "User already exists",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "data": None,
                        "error": "Email already registered"
                    }
                }
            }
        }
    }
)
async def register(user_data: RegisterRequest):
    # Check if user already exists
    existing_user = await get_users_collection().find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = UserCreate(**user_data.dict())
    user_in_db = UserInDB(
        **user.dict(),
        id=str(uuid.uuid4()),
        passwordHash=get_password_hash(user.password),
        role="creator",
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    
    # Insert into database
    await get_users_collection().insert_one(user_in_db.dict())
    
    user_response = User(
        id=user_in_db.id,
        name=user_in_db.name,
        email=user_in_db.email,
        role=user_in_db.role,
        createdAt=user_in_db.createdAt,
        updatedAt=user_in_db.updatedAt
    )
    
    return {
        "success": True,
        "data": user_response,
        "error": None
    }

@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate a user",
    description="Authenticate a user and return access and refresh tokens.",
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "token": "access_token",
                        "refreshToken": "refresh_token",
                        "user": {
                            "id": "user_id",
                            "name": "John Doe",
                            "email": "john@example.com",
                            "role": "creator",
                            "createdAt": "created_at",
                            "updatedAt": "updated_at"
                        },
                        "error": None
                    }
                }
            }
        },
        401: {
            "description": "Invalid credentials",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "token": None,
                        "refreshToken": None,
                        "user": None,
                        "error": "Incorrect email or password"
                    }
                }
            }
        }
    }
)
async def login(form_data: LoginRequest):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={"sub": user.id}, expires_delta=refresh_token_expires
    )
    
    return Token(
        success=True,
        token=access_token,
        refreshToken=refresh_token,
        user=user,
        error=None
    )

# OAuth2 compatible token login endpoint
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={"sub": user.id}, expires_delta=refresh_token_expires
    )
    
    return Token(
        success=True,
        token=access_token,
        refreshToken=refresh_token,
        user=user,
        error=None
    )

class RefreshTokenRequest(BaseModel):
    refreshToken: str

@router.post(
    "/refresh-token",
    response_model=Token,
    summary="Refresh an access token",
    description="Refresh an access token using a refresh token.",
    responses={
        200: {
            "description": "Token refreshed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "token": "new_access_token",
                        "refreshToken": "new_refresh_token",
                        "user": {
                            "id": "user_id",
                            "name": "John Doe",
                            "email": "john@example.com",
                            "role": "creator",
                            "createdAt": "created_at",
                            "updatedAt": "updated_at"
                        },
                        "error": None
                    }
                }
            }
        },
        401: {
            "description": "Invalid refresh token",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "token": None,
                        "refreshToken": None,
                        "user": None,
                        "error": "Invalid refresh token"
                    }
                }
            }
        }
    }
)
async def refresh_token(token_data: RefreshTokenRequest):
    try:
        payload = jwt.decode(token_data.refreshToken, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = await get_users_collection().find_one({"id": user_id})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_obj = User(**user)
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        new_refresh_token = create_refresh_token(
            data={"sub": user_id}, expires_delta=refresh_token_expires
        )
        
        return {
            "success": True,
            "token": access_token,
            "refreshToken": new_refresh_token,
            "user": user_obj,
            "error": None
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/logout", response_model=dict)
async def logout(current_user: Annotated[User, Depends(get_current_user)]):
    # In a real implementation, you would invalidate the token
    # For now, just return a success message
    return {
        "success": True,
        "data": {"message": "Logged out successfully"},
        "error": None
    }
