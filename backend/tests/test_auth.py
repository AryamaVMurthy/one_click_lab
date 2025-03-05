"""
Tests for authentication endpoints.
"""
import pytest
from fastapi.testclient import TestClient

# Test user data
TEST_USER = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
}

LOGIN_DATA = {
    "username": TEST_USER["email"],
    "password": TEST_USER["password"]
}

def test_register_user(client: TestClient, clean_db):
    """Test user registration."""
    response = client.post("/api/v1/register", json=TEST_USER)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["email"] == TEST_USER["email"]
    assert "password" not in data["data"]  # Password should not be returned

def test_register_duplicate_user(client: TestClient, clean_db):
    """Test registering a user with an email that already exists."""
    # Register the first user
    client.post("/api/v1/register", json=TEST_USER)
    
    # Try to register the same user again
    response = client.post("/api/v1/register", json=TEST_USER)
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "error" in data
    assert "already exists" in data["error"].lower()

def test_login_user(client: TestClient, clean_db):
    """Test user login."""
    # Register a user first
    client.post("/api/v1/register", json=TEST_USER)
    
    # Login with the registered user
    response = client.post("/api/v1/login", json=LOGIN_DATA)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "token" in data
    assert "refreshToken" in data
    assert "user" in data
    assert data["user"]["email"] == TEST_USER["email"]

def test_login_invalid_credentials(client: TestClient, clean_db):
    """Test login with invalid credentials."""
    # Register a user first
    client.post("/api/v1/register", json=TEST_USER)
    
    # Login with wrong password
    response = client.post("/api/v1/login", json={
        "username": TEST_USER["email"],
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert "error" in data
    assert "invalid" in data["error"].lower()

def test_refresh_token(client: TestClient, clean_db):
    """Test refresh token endpoint."""
    # Register and login a user first
    client.post("/api/v1/register", json=TEST_USER)
    login_response = client.post("/api/v1/login", json=LOGIN_DATA)
    refresh_token = login_response.json()["refreshToken"]
    
    # Use the refresh token to get a new access token
    response = client.post("/api/v1/refresh-token", json={"refreshToken": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "token" in data
    assert "refreshToken" in data
    assert data["refreshToken"] != refresh_token  # Should get a new refresh token

def test_refresh_token_invalid(client: TestClient, clean_db):
    """Test refresh token endpoint with invalid token."""
    response = client.post("/api/v1/refresh-token", json={"refreshToken": "invalid_token"})
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert "error" in data

def test_logout(client: TestClient, clean_db):
    """Test logout endpoint."""
    # Register and login a user first
    client.post("/api/v1/register", json=TEST_USER)
    login_response = client.post("/api/v1/login", json=LOGIN_DATA)
    token = login_response.json()["token"]
    
    # Logout
    response = client.post(
        "/api/v1/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "message" in data
