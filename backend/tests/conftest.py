"""
Configuration and fixtures for pytest.
"""
import asyncio
import os
import pytest
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import the FastAPI app
from main import app
from database import get_database

# Test database name
TEST_DATABASE_NAME = "test_one_click_lab"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as client:
        yield client

@pytest.fixture(scope="session")
def mongodb_client():
    """Create a MongoDB client for testing."""
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url, serverSelectionTimeoutMS=5000)
    
    # Check if MongoDB is available
    try:
        client.admin.command("ping")
        print("MongoDB connection successful")
    except ServerSelectionTimeoutError:
        pytest.skip("MongoDB server is not available")
    
    yield client
    
    # Clean up test database after tests
    client.drop_database(TEST_DATABASE_NAME)
    client.close()

@pytest.fixture(scope="session")
def test_db(mongodb_client):
    """Get test database."""
    db = mongodb_client[TEST_DATABASE_NAME]
    
    # Override the get_database dependency
    def override_get_database():
        return db
    
    app.dependency_overrides[get_database] = override_get_database
    
    yield db
    
    # Remove the override after tests
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def clean_db(test_db):
    """Clean the test database before each test."""
    collections = test_db.list_collection_names()
    for collection in collections:
        test_db[collection].delete_many({})
    yield test_db
