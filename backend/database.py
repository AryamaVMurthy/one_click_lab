from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "one_click_labs")

# Create a client instance
client = None
database = None
labs_collection = None
users_collection = None

# Initialize database connection
def init_db():
    global client, database, labs_collection, users_collection
    
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        # Ping the server to validate connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        database = client[DATABASE_NAME]
        
        # Initialize collections
        labs_collection = database.get_collection("labs")
        users_collection = database.get_collection("users")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

# Initialize the database connection
init_db()

# Function to get database client
def get_database():
    return database

# Function to get specific collections
def get_labs_collection():
    return labs_collection

def get_users_collection():
    return users_collection

# Create indexes synchronously
def create_indexes_sync():
    """Create MongoDB indexes synchronously using PyMongo (not Motor)"""
    try:
        # Create a synchronous MongoDB client
        sync_client = MongoClient(MONGODB_URL)
        sync_db = sync_client[DATABASE_NAME]
        
        # User indexes
        sync_db.users.create_index("email", unique=True)
        
        # Lab indexes
        sync_db.labs.create_index("id", unique=True)
        sync_db.labs.create_index("author.id")
        sync_db.labs.create_index("status")
        sync_db.labs.create_index([("title", "text"), ("description", "text")])
        
        logger.info("MongoDB indexes created successfully (sync)")
        sync_client.close()
    except Exception as e:
        logger.error(f"Failed to create MongoDB indexes (sync): {e}")
        raise

# Create indexes asynchronously (keep this for reference)
async def create_indexes():
    """Create MongoDB indexes asynchronously using Motor"""
    try:
        # User indexes
        await get_users_collection().create_index("email", unique=True)
        
        # Lab indexes
        await get_labs_collection().create_index("id", unique=True)
        await get_labs_collection().create_index("author.id")
        await get_labs_collection().create_index("status")
        await get_labs_collection().create_index([("title", "text"), ("description", "text")])
        
        logger.info("MongoDB indexes created successfully (async)")
    except Exception as e:
        logger.error(f"Failed to create MongoDB indexes (async): {e}")
        raise
