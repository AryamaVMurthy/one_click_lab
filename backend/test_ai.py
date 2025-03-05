"""
Simple test script to test the AI functionality directly.
"""
import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1"

def test_ai_features():
    """Test the AI functionality."""
    # Step 1: Register a test user
    register_data = {
        "name": "Test User",
        "email": f"test_{int(time.time())}@example.com",  # Use timestamp to avoid duplicate emails
        "password": "password123"
    }
    
    print(f"\n1. Registering user: {register_data['email']}")
    register_response = requests.post(f"{BASE_URL}/register", json=register_data)
    
    if register_response.status_code != 200:
        print(f"Registration failed with status code: {register_response.status_code}")
        print(f"Response: {register_response.text}")
        return False
    
    # Step 2: Login with the registered user
    login_data = {
        "username": register_data["email"],
        "password": register_data["password"]
    }
    
    print(f"\n2. Logging in with: {login_data['username']}")
    login_response = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"Login failed with status code: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return False
    
    login_json = login_response.json()
    token = login_json["token"]
    
    # Headers for authenticated requests
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Step 3: Test text generation
    text_gen_data = {
        "topic": "Python Programming",
        "contentType": "introduction",
        "keywords": ["beginner", "variables", "functions"],
        "targetLength": "medium",
        "tone": "casual",
        "context": "For a beginner's tutorial"
    }
    
    print(f"\n3. Testing text generation for topic: {text_gen_data['topic']}")
    text_gen_response = requests.post(f"{BASE_URL}/ai/generate-text", json=text_gen_data, headers=headers)
    
    if text_gen_response.status_code != 200:
        print(f"Text generation failed with status code: {text_gen_response.status_code}")
        print(f"Response: {text_gen_response.text}")
        return False
    
    text_gen_json = text_gen_response.json()
    print(f"Text generation response: {json.dumps(text_gen_json, indent=2)}")
    
    # Step 4: Test quiz generation
    quiz_gen_data = {
        "topic": "Python Programming",
        "numQuestions": 3,
        "difficulty": "easy",
        "contentReference": "Python is a high-level, interpreted programming language known for its readability and simplicity."
    }
    
    print(f"\n4. Testing quiz generation for topic: {quiz_gen_data['topic']}")
    quiz_gen_response = requests.post(f"{BASE_URL}/ai/generate-quiz", json=quiz_gen_data, headers=headers)
    
    if quiz_gen_response.status_code != 200:
        print(f"Quiz generation failed with status code: {quiz_gen_response.status_code}")
        print(f"Response: {quiz_gen_response.text}")
        return False
    
    quiz_gen_json = quiz_gen_response.json()
    print(f"Quiz generation response: {json.dumps(quiz_gen_json, indent=2)}")
    
    # Step 5: Test autocomplete
    autocomplete_data = {
        "prompt": "Python is a programming language that",
        "maxTokens": 30
    }
    
    print(f"\n5. Testing autocomplete with prompt: {autocomplete_data['prompt']}")
    autocomplete_response = requests.post(f"{BASE_URL}/ai/autocomplete", json=autocomplete_data, headers=headers)
    
    if autocomplete_response.status_code != 200:
        print(f"Autocomplete failed with status code: {autocomplete_response.status_code}")
        print(f"Response: {autocomplete_response.text}")
        return False
    
    autocomplete_json = autocomplete_response.json()
    print(f"Autocomplete response: {json.dumps(autocomplete_json, indent=2)}")
    
    print("\nAll AI tests passed successfully!")
    return True

if __name__ == "__main__":
    # Make sure the server is running before executing this script
    print("Testing AI functionality...")
    success = test_ai_features()
    print(f"\nTest {'succeeded' if success else 'failed'}")
