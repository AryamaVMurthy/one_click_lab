# One Click Labs API Testing Suite

This directory contains automated tests for the One Click Labs API. The tests cover authentication, lab management, and AI features.

## Setup

1. Install test dependencies:

```bash
pip install -r requirements_test.txt
```

2. Make sure MongoDB is running on your local machine or update the `.env` file with the correct MongoDB URL.

3. Make sure you're in the backend directory when running tests.

## Running Tests

### Run all tests with detailed reporting

```bash
python tests/run_tests.py
```

This will run all tests and generate a detailed report in the `tests` directory.

### Run specific test modules

```bash
# Run authentication tests
pytest tests/test_auth.py -v

# Run lab management tests
pytest tests/test_labs.py -v

# Run AI feature tests
pytest tests/test_ai.py -v
```

### Run with coverage report

```bash
pytest --cov=routes --cov=models tests/
```

## Test Structure

- `conftest.py`: Contains pytest fixtures and configuration
- `test_auth.py`: Tests for authentication endpoints (register, login, refresh token, logout)
- `test_labs.py`: Tests for lab management endpoints (create, read, update, delete labs, sections, and modules)
- `test_ai.py`: Tests for AI feature endpoints (generate text, generate quiz, autocomplete)
- `run_tests.py`: Script to run all tests and generate a detailed report

## Continuous Integration

These tests can be integrated into a CI/CD pipeline to ensure code quality before deployment.

## Notes

- The tests use a separate test database to avoid affecting production data.
- AI tests use mocks to avoid actual API calls to OpenAI.
- Each test starts with a clean database to ensure test isolation.
