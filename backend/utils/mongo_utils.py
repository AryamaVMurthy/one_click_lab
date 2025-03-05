"""
Utility functions for MongoDB document serialization.
"""
from bson import ObjectId
import json
from datetime import datetime

class MongoJSONEncoder(json.JSONEncoder):
    """
    JSONEncoder subclass that knows how to encode MongoDB-specific types.
    """
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def serialize_mongo_doc(doc):
    """
    Serialize a MongoDB document to a JSON-compatible dictionary.
    Converts ObjectId to string and handles other MongoDB-specific types.
    """
    if doc is None:
        return None
    
    if isinstance(doc, list):
        return [serialize_mongo_doc(item) for item in doc]
    
    if not isinstance(doc, dict):
        if isinstance(doc, ObjectId):
            return str(doc)
        if isinstance(doc, datetime):
            return doc.isoformat()
        return doc
    
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = serialize_mongo_doc(value)
        elif isinstance(value, list):
            result[key] = [serialize_mongo_doc(item) for item in value]
        else:
            result[key] = value
    
    return result
