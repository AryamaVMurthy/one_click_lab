import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "one_click_labs")

async def test_connection():
    try:
        # Create a client instance
        client = AsyncIOMotorClient(MONGODB_URL)
        
        # Ping the server to validate connection
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        # Get database
        database = client[DATABASE_NAME]
        
        # List collections
        collections = await database.list_collection_names()
        logger.info(f"Existing collections: {collections}")
        
        # Create indexes for our collections if they don't exist
        if "users" not in collections:
            logger.info("Creating users collection and indexes...")
            await database.users.create_index("email", unique=True)
        
        if "labs" not in collections:
            logger.info("Creating labs collection and indexes...")
            await database.labs.create_index("id", unique=True)
            await database.labs.create_index("author.id")
            await database.labs.create_index("status")
            await database.labs.create_index([("title", "text"), ("description", "text")])
        
        if "sections" not in collections:
            logger.info("Creating sections collection and indexes...")
            await database.sections.create_index("id", unique=True)
            await database.sections.create_index("labId")
        
        if "modules" not in collections:
            logger.info("Creating modules collection and indexes...")
            await database.modules.create_index("id", unique=True)
            await database.modules.create_index("sectionId")
        
        if "deployments" not in collections:
            logger.info("Creating deployments collection and indexes...")
            await database.deployments.create_index("labId")
            await database.deployments.create_index("version")
        
        logger.info("MongoDB setup completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(test_connection())
