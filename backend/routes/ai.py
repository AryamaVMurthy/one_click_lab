from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated

from models.ai import (
    TextGenerationRequest,
    TextGenerationResponse,
    QuizGenerationRequest,
    QuizGenerationResponse,
    AutocompleteRequest,
    AutocompleteResponse
)
from models.user import User
from routes.auth import get_current_user
from utils.mongo_utils import serialize_mongo_doc
import logging

# Initialize router
router = APIRouter(tags=["ai"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Endpoints
@router.post(
    "/ai/generate-text",
    response_model=TextGenerationResponse,
    summary="Generate text content",
    description="Generate text content based on topic, contentType, targetLength, and tone.",
    responses={
        200: {
            "description": "Text generated successfully",
            "content": {
                "application/json": {
                    "example": {"success": True, "data": {"content": "Python is a versatile programming language..."}, "error": None}
                }
            }
        },
        400: {
            "description": "Invalid request",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid contentType"}
                }
            }
        },
        401: {
            "description": "Unauthorized",
            "content": {
                "application/json": {
                    "example": {"detail": "Unauthorized"}
                }
            }
        }
    }
)
async def generate_text(request: TextGenerationRequest, current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Generating text for topic: {request.topic}")
        result = await generate_text_content(request, current_user)
        return result
    except Exception as e:
        logger.error(f"Error generating text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating text: {str(e)}")

async def generate_text_content(
    text_request: TextGenerationRequest,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Generate AI text content based on parameters"""
    # In a real implementation, this would call an AI service like OpenAI, Claude, etc.
    # For now, we'll return a placeholder response
    
    # Validate input
    if text_request.contentType not in ["introduction", "explanation", "summary"]:
        raise HTTPException(status_code=400, detail="Invalid contentType")
    
    if text_request.targetLength not in ["short", "medium", "long"]:
        raise HTTPException(status_code=400, detail="Invalid targetLength")
    
    if text_request.tone not in ["formal", "casual", "technical"]:
        raise HTTPException(status_code=400, detail="Invalid tone")
    
    # In a real implementation, this would be replaced with:
    # 1. Prepare a prompt based on the parameters
    # 2. Call AI service API with the prompt
    # 3. Process and format the response
    
    placeholder_content = f"""
        <h2>{text_request.topic}</h2>
        <p>This is a {text_request.targetLength} {text_request.contentType} about {text_request.topic} 
        written in a {text_request.tone} tone.</p>
        <p>In a real implementation, this would contain AI-generated content based on your parameters.</p>
    """
    
    return {
        "success": True,
        "data": {
            "content": placeholder_content
        },
        "error": None
    }

@router.post(
    "/ai/generate-quiz",
    response_model=QuizGenerationResponse,
    summary="Generate a quiz",
    description="Generate a quiz with questions and answers based on topic, numQuestions, and difficulty.",
    responses={
        200: {
            "description": "Quiz generated successfully",
            "content": {
                "application/json": {
                    "example": {"success": True, "data": {"questions": [{"text": "Sample question 1 about Python?", "options": [{"text": "Option A", "isCorrect": True}, {"text": "Option B", "isCorrect": False}, {"text": "Option C", "isCorrect": False}, {"text": "Option D", "isCorrect": False}], "explanation": "This is the explanation for question 1", "points": 1}]}, "error": None}
                }
            }
        },
        400: {
            "description": "Invalid request",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid difficulty"}
                }
            }
        },
        401: {
            "description": "Unauthorized",
            "content": {
                "application/json": {
                    "example": {"detail": "Unauthorized"}
                }
            }
        }
    }
)
async def generate_quiz(request: QuizGenerationRequest, current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Generating quiz for topic: {request.topic}")
        result = await generate_quiz_content(request, current_user)
        return result
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")

async def generate_quiz_content(
    quiz_request: QuizGenerationRequest,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Generate a quiz with questions and answers"""
    # In a real implementation, this would call an AI service
    
    # Validate input
    if quiz_request.difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(status_code=400, detail="Invalid difficulty")
    
    if quiz_request.numQuestions <= 0 or quiz_request.numQuestions > 20:
        raise HTTPException(status_code=400, detail="Number of questions must be between 1 and 20")
    
    # Placeholder quiz generation
    questions = []
    for i in range(quiz_request.numQuestions):
        questions.append({
            "text": f"Sample question {i+1} about {quiz_request.topic}?",
            "options": [
                {"text": "Option A", "isCorrect": i % 4 == 0},
                {"text": "Option B", "isCorrect": i % 4 == 1},
                {"text": "Option C", "isCorrect": i % 4 == 2},
                {"text": "Option D", "isCorrect": i % 4 == 3}
            ],
            "explanation": f"This is the explanation for question {i+1}",
            "points": 1
        })
    
    return {
        "success": True,
        "data": {
            "questions": questions
        },
        "error": None
    }

@router.post(
    "/ai/autocomplete",
    response_model=AutocompleteResponse,
    summary="Autocomplete text",
    description="Autocomplete text based on a prompt.",
    responses={
        200: {
            "description": "Text autocompleted successfully",
            "content": {
                "application/json": {
                    "example": {"success": True, "data": {"completion": "Python is a high-level programming language..."}, "error": None}
                }
            }
        },
        400: {
            "description": "Invalid request",
            "content": {
                "application/json": {
                    "example": {"detail": "Prompt cannot be empty"}
                }
            }
        },
        401: {
            "description": "Unauthorized",
            "content": {
                "application/json": {
                    "example": {"detail": "Unauthorized"}
                }
            }
        }
    }
)
async def autocomplete(request: AutocompleteRequest, current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Autocompleting text for prompt: {request.prompt}")
        result = await autocomplete_content(request, current_user)
        return result
    except Exception as e:
        logger.error(f"Error autocompleting text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error autocompleting text: {str(e)}")

async def autocomplete_content(
    autocomplete_request: AutocompleteRequest,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Autocomplete text based on a prompt"""
    # In a real implementation, this would call an AI service
    
    # Validate input
    if not autocomplete_request.prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    # Placeholder autocomplete generation
    completion = f"{autocomplete_request.prompt} [This would be AI-generated completion in a real implementation]"
    
    return {
        "success": True,
        "data": {
            "completion": completion
        },
        "error": None
    }
