from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
import uuid

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str = "creator"  # "admin", "creator", "student"
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now().isoformat())

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "John Doe",
                "email": "john@example.com",
                "role": "creator",
                "createdAt": "2023-01-01T00:00:00Z",
                "updatedAt": "2023-01-01T00:00:00Z"
            }
        }

class UserInDB(User):
    """Model for user as stored in the database"""
    passwordHash: str

class UserResponse(BaseModel):
    """Response model for returning user data"""
    success: bool
    data: User
    error: Optional[str] = None

class TokenData(BaseModel):
    id: Optional[str] = None
    exp: Optional[datetime] = None

class Token(BaseModel):
    success: bool
    token: str
    refreshToken: str
    user: User
    error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "role": "creator",
                    "createdAt": "2023-01-01T00:00:00Z",
                    "updatedAt": "2023-01-01T00:00:00Z"
                },
                "error": None
            }
        }
