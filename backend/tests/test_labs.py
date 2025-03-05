"""
Tests for lab-related endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from bson import ObjectId

# Test user data
TEST_USER = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
}

# Test lab data
TEST_LAB = {
    "title": "Introduction to Python",
    "description": "Learn the basics of Python programming language",
    "sections": [
        {
            "title": "Getting Started with Python",
            "order": 0,
            "modules": [
                {
                    "type": "text",
                    "title": "Introduction to Variables",
                    "content": "<p>Variables are containers for storing data values.</p>",
                    "order": 0
                },
                {
                    "type": "quiz",
                    "title": "Python Basics Quiz",
                    "questions": [
                        {
                            "text": "What is Python?",
                            "options": [
                                {
                                    "text": "A programming language",
                                    "isCorrect": True
                                },
                                {
                                    "text": "A snake",
                                    "isCorrect": False
                                }
                            ],
                            "explanation": "Python is a high-level programming language.",
                            "points": 1
                        }
                    ],
                    "order": 1
                }
            ]
        }
    ]
}

# Test section data
TEST_SECTION = {
    "title": "Getting Started with Python",
    "order": 0
}

# Test module data
TEST_TEXT_MODULE = {
    "type": "text",
    "title": "Introduction to Variables",
    "content": "<p>Variables are containers for storing data values.</p>",
    "order": 0
}

TEST_QUIZ_MODULE = {
    "type": "quiz",
    "title": "Python Basics Quiz",
    "questions": [
        {
            "text": "What is Python?",
            "options": [
                {
                    "text": "A programming language",
                    "isCorrect": True
                },
                {
                    "text": "A snake",
                    "isCorrect": False
                }
            ],
            "explanation": "Python is a high-level programming language.",
            "points": 1
        }
    ],
    "order": 1
}

TEST_CONTENT_UPDATE = {
    "sections": [
        {
            "title": "Updated Section",
            "order": 0,
            "modules": [
                {
                    "type": "text",
                    "title": "Updated Module",
                    "content": "This is updated content",
                    "order": 0
                }
            ]
        }
    ]
}

@pytest.fixture
def auth_headers(client: TestClient, clean_db):
    """Get authentication headers for a test user."""
    # Register a user
    client.post("/api/v1/register", json=TEST_USER)
    
    # Login to get token
    login_response = client.post("/api/v1/login", json={
        "username": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    token = login_response.json()["token"]
    
    return {"Authorization": f"Bearer {token}"}

def test_create_lab(client: TestClient, auth_headers, clean_db):
    """Test creating a lab."""
    response = client.post(
        "/api/v1/labs",
        json=TEST_LAB,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["title"] == TEST_LAB["title"]
    assert "id" in data["data"]
    assert "createdAt" in data["data"]
    assert "updatedAt" in data["data"]
    assert "author" in data["data"]
    assert "id" in data["data"]["author"]
    assert "sections" in data["data"]
    assert len(data["data"]["sections"]) == 1
    assert data["data"]["sections"][0]["title"] == TEST_LAB["sections"][0]["title"]
    assert len(data["data"]["sections"][0]["modules"]) == 2
    assert data["data"]["sections"][0]["modules"][0]["title"] == TEST_LAB["sections"][0]["modules"][0]["title"]
    assert data["data"]["sections"][0]["modules"][1]["title"] == TEST_LAB["sections"][0]["modules"][1]["title"]

def test_get_lab_by_id(client: TestClient, auth_headers, clean_db):
    """Test getting a lab by ID."""
    # Create a lab first
    create_response = client.post(
        "/api/v1/labs",
        json=TEST_LAB,
        headers=auth_headers
    )
    lab_id = create_response.json()["data"]["id"]
    
    # Get the lab by ID
    response = client.get(
        f"/api/v1/labs/{lab_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["id"] == lab_id
    assert data["data"]["title"] == TEST_LAB["title"]
    assert "sections" in data["data"]
    assert isinstance(data["data"]["sections"], list)

def test_get_all_labs(client: TestClient, auth_headers, clean_db):
    """Test getting all labs."""
    # Create two labs
    client.post("/api/v1/labs", json=TEST_LAB, headers=auth_headers)
    client.post(
        "/api/v1/labs",
        json={"title": "Advanced Python", "description": "Advanced Python concepts"},
        headers=auth_headers
    )
    
    # Get all labs
    response = client.get(
        "/api/v1/labs",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "labs" in data["data"]
    assert len(data["data"]["labs"]) == 2
    assert "pagination" in data["data"]
    assert data["data"]["pagination"]["total"] == 2

def test_update_lab(client: TestClient, auth_headers, clean_db):
    """Test updating a lab."""
    # Create a lab first
    create_response = client.post(
        "/api/v1/labs",
        json=TEST_LAB,
        headers=auth_headers
    )
    lab_id = create_response.json()["data"]["id"]
    
    # Update the lab
    updated_data = {
        "title": "Updated Python Course",
        "description": "An updated description"
    }
    response = client.put(
        f"/api/v1/labs/{lab_id}",
        json=updated_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["title"] == updated_data["title"]
    assert data["data"]["description"] == updated_data["description"]

def test_add_section(client: TestClient, auth_headers, clean_db):
    """Test adding a section to a lab."""
    # Create a lab first
    create_response = client.post(
        "/api/v1/labs",
        json=TEST_LAB,
        headers=auth_headers
    )
    lab_id = create_response.json()["data"]["id"]
    
    # Add a section
    response = client.post(
        f"/api/v1/labs/{lab_id}/sections",
        json=TEST_SECTION,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert len(data["data"]["sections"]) >= 1
    # Check if the last section added matches our test section
    last_section = data["data"]["sections"][-1]
    assert last_section["title"] == TEST_SECTION["title"]
    assert last_section["order"] == TEST_SECTION["order"]

def test_update_lab_content(client: TestClient, auth_headers, clean_db):
    """Test updating a lab's entire content."""
    # Create a lab first
    create_response = client.post(
        "/api/v1/labs",
        json=TEST_LAB,
        headers=auth_headers
    )
    lab_id = create_response.json()["data"]["id"]
    
    # Update the lab content
    response = client.post(
        f"/api/v1/labs/{lab_id}/update-content",
        json=TEST_CONTENT_UPDATE,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert len(data["data"]["sections"]) == 1
    assert data["data"]["sections"][0]["title"] == TEST_CONTENT_UPDATE["sections"][0]["title"]
    assert len(data["data"]["sections"][0]["modules"]) == 1
    assert data["data"]["sections"][0]["modules"][0]["title"] == TEST_CONTENT_UPDATE["sections"][0]["modules"][0]["title"]
    assert data["data"]["sections"][0]["modules"][0]["content"] == TEST_CONTENT_UPDATE["sections"][0]["modules"][0]["content"]

def test_deploy_lab(client: TestClient, auth_headers, clean_db):
    """Test deploying a lab."""
    # Create a lab first
    create_response = client.post(
        "/api/v1/labs",
        json=TEST_LAB,
        headers=auth_headers
    )
    lab_id = create_response.json()["data"]["id"]
    
    # Deploy the lab
    response = client.post(
        f"/api/v1/labs/{lab_id}/deploy",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "deploymentUrl" in data["data"]
    
    # Check that the lab status is now "published"
    get_response = client.get(
        f"/api/v1/labs/{lab_id}",
        headers=auth_headers
    )
    assert get_response.json()["data"]["status"] == "published"
    assert get_response.json()["data"]["isPublished"] is True

def test_delete_lab(client: TestClient, auth_headers, clean_db):
    """Test deleting a lab."""
    # Create a lab first
    create_response = client.post(
        "/api/v1/labs",
        json=TEST_LAB,
        headers=auth_headers
    )
    lab_id = create_response.json()["data"]["id"]
    
    # Delete the lab
    response = client.delete(
        f"/api/v1/labs/{lab_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Try to get the deleted lab
    get_response = client.get(
        f"/api/v1/labs/{lab_id}",
        headers=auth_headers
    )
    assert get_response.json()["success"] is False
