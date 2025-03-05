"""
Tests for AI-related endpoints.
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock

# Test user data
TEST_USER = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
}

@pytest.fixture
async def auth_headers(client: AsyncClient, clean_db):
    """Get authentication headers for a test user."""
    # Register a user
    await client.post("/api/v1/register", json=TEST_USER)
    
    # Login to get token
    login_response = await client.post("/api/v1/login", json={
        "username": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    token = login_response.json()["token"]
    
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
@patch("routes.ai.generate_text_with_openai")  # Mock the OpenAI function
async def test_generate_text(mock_generate_text, client: AsyncClient, auth_headers, clean_db):
    """Test generating text with AI."""
    # Mock the OpenAI response
    mock_response = "This is a generated text response from the AI."
    mock_generate_text.return_value = mock_response
    
    # Test data
    test_data = {
        "prompt": "Write an introduction to Python programming.",
        "maxTokens": 100
    }
    
    # Make the request
    response = await client.post(
        "/api/v1/ai/generate-text",
        json=test_data,
        headers=auth_headers
    )
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "text" in data["data"]
    assert data["data"]["text"] == mock_response
    
    # Verify the mock was called with the right arguments
    mock_generate_text.assert_called_once_with(
        test_data["prompt"],
        test_data["maxTokens"]
    )

@pytest.mark.asyncio
@patch("routes.ai.generate_quiz_with_openai")  # Mock the OpenAI function
async def test_generate_quiz(mock_generate_quiz, client: AsyncClient, auth_headers, clean_db):
    """Test generating a quiz with AI."""
    # Mock the OpenAI response
    mock_response = [
        {
            "text": "What is Python?",
            "options": [
                {"text": "A programming language", "isCorrect": True},
                {"text": "A snake", "isCorrect": False}
            ],
            "explanation": "Python is a high-level programming language.",
            "points": 1
        }
    ]
    mock_generate_quiz.return_value = mock_response
    
    # Test data
    test_data = {
        "topic": "Python basics",
        "numQuestions": 1,
        "difficulty": "easy"
    }
    
    # Make the request
    response = await client.post(
        "/api/v1/ai/generate-quiz",
        json=test_data,
        headers=auth_headers
    )
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "questions" in data["data"]
    assert data["data"]["questions"] == mock_response
    
    # Verify the mock was called with the right arguments
    mock_generate_quiz.assert_called_once_with(
        test_data["topic"],
        test_data["numQuestions"],
        test_data["difficulty"]
    )

@pytest.mark.asyncio
@patch("routes.ai.autocomplete_with_openai")  # Mock the OpenAI function
async def test_autocomplete(mock_autocomplete, client: AsyncClient, auth_headers, clean_db):
    """Test autocomplete with AI."""
    # Mock the OpenAI response
    mock_response = "Python is a high-level, interpreted programming language."
    mock_autocomplete.return_value = mock_response
    
    # Test data
    test_data = {
        "text": "Python is a",
        "maxTokens": 20
    }
    
    # Make the request
    response = await client.post(
        "/api/v1/ai/autocomplete",
        json=test_data,
        headers=auth_headers
    )
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "completion" in data["data"]
    assert data["data"]["completion"] == mock_response
    
    # Verify the mock was called with the right arguments
    mock_autocomplete.assert_called_once_with(
        test_data["text"],
        test_data["maxTokens"]
    )
