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
sections_collection = None
modules_collection = None
deployments_collection = None

# Initialize database connection
def init_db():
    global client, database, labs_collection, users_collection, sections_collection, modules_collection, deployments_collection
    
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        # Ping the server to validate connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        database = client[DATABASE_NAME]
        
        # Initialize collections
        labs_collection = database.get_collection("labs")
        users_collection = database.get_collection("users")
        sections_collection = database.get_collection("sections")
        modules_collection = database.get_collection("modules")
        deployments_collection = database.get_collection("deployments")
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

def get_sections_collection():
    return sections_collection

def get_modules_collection():
    return modules_collection

def get_deployments_collection():
    return deployments_collection

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
        
        # Section indexes
        sync_db.sections.create_index("id", unique=True)
        sync_db.sections.create_index("labId")
        
        # Module indexes
        sync_db.modules.create_index("id", unique=True)
        sync_db.modules.create_index("sectionId")
        
        # Deployment indexes
        sync_db.deployments.create_index("labId")
        sync_db.deployments.create_index("version")
        
        logger.info("MongoDB indexes created successfully (sync)")
        sync_client.close()
    except Exception as e:
        logger.error(f"Error creating indexes (sync): {e}")

# Create indexes asynchronously (keep this for reference)
async def create_indexes():
    try:
        # User indexes
        await users_collection.create_index("email", unique=True)
        
        # Lab indexes
        await labs_collection.create_index("id", unique=True)
        await labs_collection.create_index("author.id")
        await labs_collection.create_index("status")
        await labs_collection.create_index([("title", "text"), ("description", "text")])
        
        # Section indexes
        await sections_collection.create_index("id", unique=True)
        await sections_collection.create_index("labId")
        
        # Module indexes
        await modules_collection.create_index("id", unique=True)
        await modules_collection.create_index("sectionId")
        
        # Deployment indexes
        await deployments_collection.create_index("labId")
        await deployments_collection.create_index("version")
        
        logger.info("MongoDB indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
