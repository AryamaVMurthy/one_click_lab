"""
Simple test script to test the MongoDB connection.
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

async def test_mongodb_connection():
    """Test the MongoDB connection."""
    print(f"Connecting to MongoDB at: {MONGODB_URL}")
    client = AsyncIOMotorClient(MONGODB_URL)
    
    try:
        # The ismaster command is cheap and does not require auth.
        await client.admin.command('ismaster')
        print("MongoDB connection successful!")
        
        # List all databases
        db_list = await client.list_database_names()
        print(f"Available databases: {db_list}")
        
        # Check if our database exists
        if DATABASE_NAME in db_list:
            print(f"Database '{DATABASE_NAME}' exists")
            
            # List all collections in our database
            db = client[DATABASE_NAME]
            collections = await db.list_collection_names()
            print(f"Collections in {DATABASE_NAME}: {collections}")
            
            # Count documents in each collection
            for collection_name in collections:
                count = await db[collection_name].count_documents({})
                print(f"Collection '{collection_name}' has {count} documents")
        else:
            print(f"Database '{DATABASE_NAME}' does not exist")
        
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    print("Testing MongoDB connection...")
    loop = asyncio.get_event_loop()
    success = loop.run_until_complete(test_mongodb_connection())
    print(f"\nTest {'succeeded' if success else 'failed'}")
