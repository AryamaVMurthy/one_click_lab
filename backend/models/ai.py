from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union

class TextGenerationRequest(BaseModel):
    topic: str
    contentType: str  # one of "introduction", "explanation", "summary"
    keywords: Optional[List[str]] = None
    targetLength: str  # one of "short", "medium", "long"
    tone: str  # one of "formal", "casual", "technical"
    context: Optional[str] = None

class TextContent(BaseModel):
    content: str

class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None

class TextGenerationResponse(ApiResponse):
    data: Optional[TextContent] = None

class QuizOption(BaseModel):
    text: str
    isCorrect: bool

class QuizQuestion(BaseModel):
    text: str
    options: List[QuizOption]
    explanation: str
    points: int

class QuizGenerationRequest(BaseModel):
    topic: str
    numQuestions: int
    difficulty: str  # one of "easy", "medium", "hard"
    contentReference: Optional[str] = None

class QuizContent(BaseModel):
    questions: List[QuizQuestion]

class QuizGenerationResponse(ApiResponse):
    data: Optional[QuizContent] = None

class AutocompleteRequest(BaseModel):
    prompt: str
    maxTokens: Optional[int] = 50

class AutocompleteContent(BaseModel):
    completion: str

class AutocompleteResponse(ApiResponse):
    data: Optional[AutocompleteContent] = None
