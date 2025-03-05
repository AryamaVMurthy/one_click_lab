from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import uuid

# Module models for the different section types
class TextModule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sectionId: Optional[str] = None  # Foreign key to section
    type: str = "text"
    title: Optional[str] = None
    content: str
    order: int
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now().isoformat())

class Option(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    isCorrect: bool

class QuizQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    type: str = "multiple-choice"  # Can be extended for different types
    options: List[Option]
    explanation: Optional[str] = None
    points: int = 1

class QuizModule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sectionId: Optional[str] = None  # Foreign key to section
    type: str = "quiz"
    title: str
    questions: List[QuizQuestion]
    passingScore: Optional[int] = None
    order: int
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now().isoformat())

class ImageModule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sectionId: Optional[str] = None  # Foreign key to section
    type: str = "image"
    url: str
    altText: Optional[str] = None
    caption: Optional[str] = None
    order: int
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now().isoformat())

class VideoModule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sectionId: Optional[str] = None  # Foreign key to section
    type: str = "video"
    url: str
    provider: str  # "youtube", "vimeo", "custom"
    caption: Optional[str] = None
    order: int
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now().isoformat())

# Union type for modules
Module = Union[TextModule, QuizModule, ImageModule, VideoModule]

class ModuleReference(BaseModel):
    id: str
    type: str  # "text", "quiz", "image", "video"
    order: int

class Section(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    labId: Optional[str] = None  # Foreign key to lab
    title: str
    order: int
    moduleRefs: List[ModuleReference] = []  # References to modules
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now().isoformat())

class Author(BaseModel):
    id: str
    name: str
    email: Optional[str] = None

class DeploymentVersion(BaseModel):
    version: str
    url: str
    deployedAt: str = Field(default_factory=lambda: datetime.now().isoformat())

class DeploymentUrls(BaseModel):
    latest: Optional[str] = None
    versions: List[DeploymentVersion] = []

class LabBase(BaseModel):
    title: str
    description: str
    author: Author

class LabCreate(LabBase):
    pass

class LabUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class Lab(LabBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sectionRefs: List[str] = []  # References to section IDs
    status: str = "draft"  # "draft" or "published"
    isPublished: bool = False
    createdAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    publishedAt: Optional[str] = None
    deploymentUrls: Optional[DeploymentUrls] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Introduction to Python",
                "description": "Learn the basics of Python programming language",
                "sectionRefs": ["123e4567-e89b-12d3-a456-426614174001"],
                "status": "draft",
                "author": {
                    "id": "123e4567-e89b-12d3-a456-426614174003",
                    "name": "John Doe",
                    "email": "john@example.com"
                },
                "isPublished": False,
                "createdAt": "2023-01-01T00:00:00Z",
                "updatedAt": "2023-01-01T00:00:00Z"
            }
        }

class LabInDB(Lab):
    """Model for lab as stored in the database"""
    pass

class SectionInDB(Section):
    """Model for section as stored in the database"""
    pass

# Composite models for API responses
class SectionWithModules(Section):
    modules: List[Dict[str, Any]] = []  # Actual module objects

class LabWithSections(Lab):
    sections: List[SectionWithModules] = []

class LabResponse(BaseModel):
    success: bool
    data: LabWithSections
    error: Optional[str] = None

class LabsResponse(BaseModel):
    """Response model for returning paginated labs"""
    success: bool
    data: Dict[str, Any]
    error: Optional[str] = None
