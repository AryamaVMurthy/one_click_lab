from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import os
import traceback
from dotenv import load_dotenv
import asyncio

# Import routers
from routes.auth import router as auth_router
from routes.labs import router as labs_router
from routes.ai import router as ai_router

# Import database
from database import create_indexes, create_indexes_sync

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="One Click Labs API",
    description="API for One Click Labs platform",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handler for detailed error logging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

# Include routers
app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])
app.include_router(labs_router, prefix="/api/v1", tags=["Labs"])
app.include_router(ai_router, prefix="/api/v1", tags=["AI"])

@app.on_event("startup")
async def startup_db_client():
    logger.info("Starting up application...")
    # Use synchronous index creation to avoid event loop issues
    create_indexes_sync()

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down application...")

@app.get("/")
async def root():
    return {"message": "Welcome to One Click Labs API"}

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    # Run the application
    uvicorn.run("main:app", host=host, port=port, reload=True)
