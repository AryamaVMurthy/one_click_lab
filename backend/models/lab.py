from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import uuid

# Option model for quiz questions
class Option(BaseModel):
    text: str
    isCorrect: bool

# Quiz question model
class QuizQuestion(BaseModel):
    text: str
    type: str = "multiple-choice"
    options: List[Option]
    points: int = 1
    explanation: Optional[str] = None

# Module models
class ModuleBase(BaseModel):
    type: str
    title: str
    order: int

class TextModule(ModuleBase):
    type: str = "text"
    content: str

class QuizModule(ModuleBase):
    type: str = "quiz"
    questions: List[QuizQuestion]

class ImageModule(ModuleBase):
    type: str = "image"
    url: str
    altText: Optional[str] = None
    caption: Optional[str] = None

class VideoModule(ModuleBase):
    type: str = "video"
    url: str
    provider: Optional[str] = None
    caption: Optional[str] = None

class SimulationModule(ModuleBase):
    type: str = "simulation"
    htmlContent: str
    description: Optional[str] = None
    jsonStructure: Optional[Dict[str, Any]] = None

# Union type for modules
Module = Union[TextModule, QuizModule, ImageModule, VideoModule, SimulationModule]

# Section model
class Section(BaseModel):
    title: str
    order: int
    modules: List[Any] = []  # Can contain any module type

# Author model
class Author(BaseModel):
    id: str
    name: str
    email: Optional[str] = None

# Lab models
class LabBase(BaseModel):
    title: str
    description: str

class LabCreate(LabBase):
    pass

class LabUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    sections: Optional[List[Section]] = None

class Lab(LabBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author: Author
    sections: List[Section] = []
    status: str = "draft"  # "draft", "published", or "archived"
    isPublished: bool = False
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    publishedAt: Optional[str] = None
    deploymentUrl: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Introduction to Python",
                "description": "Learn the basics of Python programming language",
                "author": {
                    "id": "123e4567-e89b-12d3-a456-426614174003",
                    "name": "John Doe",
                    "email": "john@example.com"
                },
                "sections": [
                    {
                        "title": "Getting Started",
                        "order": 0,
                        "modules": [
                            {
                                "type": "text",
                                "title": "Introduction",
                                "content": "<p>Welcome to Python Programming!</p>",
                                "order": 0
                            }
                        ]
                    }
                ],
                "status": "draft",
                "isPublished": False,
                "createdAt": "2023-01-01T00:00:00Z",
                "updatedAt": "2023-01-01T00:00:00Z"
            }
        }

class LabInDB(Lab):
    """Model for lab as stored in the database"""
    pass

# API response models
class LabResponse(BaseModel):
    success: bool
    data: Lab
    error: Optional[str] = None

class PaginationInfo(BaseModel):
    total: int
    page: int
    pages: int
    limit: int

class LabsData(BaseModel):
    labs: List[Lab]
    pagination: PaginationInfo

class LabsResponse(BaseModel):
    """Response model for returning paginated labs"""
    success: bool
    data: LabsData
    error: Optional[str] = None
