"""
Script to initialize the MongoDB database with required collections.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "one_click_labs")

# Required collections
COLLECTIONS = [
    "users",
    "labs",
    "sections",
    "modules",
    "deployments",
    "refresh_tokens"
]

async def init_database():
    """Initialize the database with required collections."""
    print(f"Connecting to MongoDB at: {MONGODB_URL}")
    client = AsyncIOMotorClient(MONGODB_URL)
    
    try:
        # Check if database exists
        db_list = await client.list_database_names()
        if DATABASE_NAME in db_list:
            print(f"Database '{DATABASE_NAME}' already exists")
        else:
            print(f"Creating database '{DATABASE_NAME}'")
        
        # Get database
        db = client[DATABASE_NAME]
        
        # Create collections if they don't exist
        existing_collections = await db.list_collection_names()
        for collection_name in COLLECTIONS:
            if collection_name in existing_collections:
                print(f"Collection '{collection_name}' already exists")
            else:
                print(f"Creating collection '{collection_name}'")
                await db.create_collection(collection_name)
        
        # Create indexes for users collection
        print("Creating indexes for users collection...")
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        
        # Create indexes for labs collection
        print("Creating indexes for labs collection...")
        await db.labs.create_index("id", unique=True)
        await db.labs.create_index("author.id")
        
        # Create indexes for sections collection
        print("Creating indexes for sections collection...")
        await db.sections.create_index("id", unique=True)
        await db.sections.create_index("labId")
        
        # Create indexes for modules collection
        print("Creating indexes for modules collection...")
        await db.modules.create_index("id", unique=True)
        await db.modules.create_index("sectionId")
        
        # Create indexes for refresh_tokens collection
        print("Creating indexes for refresh_tokens collection...")
        await db.refresh_tokens.create_index("token", unique=True)
        await db.refresh_tokens.create_index("userId")
        
        print("Database initialization completed successfully!")
        return True
    except Exception as e:
        print(f"Database initialization failed: {e}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    print("Initializing MongoDB database...")
    loop = asyncio.get_event_loop()
    success = loop.run_until_complete(init_database())
    print(f"\nInitialization {'succeeded' if success else 'failed'}")
