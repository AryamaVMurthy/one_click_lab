# One Click Labs Backend

This is the backend API for the One Click Labs platform, built with FastAPI and MongoDB.

## Setup

1. Create a virtual environment and activate it:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file based on the `.env.example` file:

```bash
cp .env.example .env
```

4. Edit the `.env` file with your configuration.

5. Make sure you have MongoDB running (locally or remote).

## Running the Application

```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, you can access the auto-generated API documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

The following endpoints are available:

### Authentication

- `POST /api/v1/login` - Login with email and password
- `POST /api/v1/register` - Register a new user
- `POST /api/v1/refresh-token` - Refresh an access token
- `POST /api/v1/logout` - Logout

### Labs

- `POST /api/v1/labs` - Create a new lab
- `GET /api/v1/labs/{id}` - Get a lab by ID
- `PUT /api/v1/labs/{id}` - Update a lab
- `DELETE /api/v1/labs/{id}` - Delete a lab
- `GET /api/v1/labs` - Get all labs (with pagination and filters)
- `POST /api/v1/labs/{id}/deploy` - Deploy a lab

### AI Content Generation

- `POST /api/v1/ai/generate-text` - Generate text content
- `POST /api/v1/ai/generate-quiz` - Generate a quiz
- `POST /api/v1/ai/autocomplete` - Autocomplete text

### Simulation

- `POST /api/v1/simulation` - Generate simulation content (JSON structure or HTML)
- `POST /api/v1/simulation/save` - Save a simulation module to a lab
- `GET /api/v1/simulation/{lab_id}/{section_id}/{module_id}` - Get a specific simulation module
