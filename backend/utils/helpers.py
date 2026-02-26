from flask import jsonify
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
from functools import wraps

def validate_oid(id_str):
    """Safely validate and convert ObjectId (Bug Phase 3: 6)"""
    try:
        if not id_str:
            return None
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        return None

def serialize_doc(doc):
    """Serialize a MongoDB document recursively (Bug Phase 1: 1, Phase 3: Order items)"""
    print(f"DEBUG: Serializing {type(doc)}")
    if doc is None:
        return None
    
    if isinstance(doc, dict):
        new_doc = {}
        for key, value in doc.items():
            if key == "_id":
                new_doc["_id"] = str(value)
            else:
                new_doc[key] = serialize_doc(value)
        return new_doc
    
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    
    elif isinstance(doc, ObjectId):
        return str(doc)
    
    elif isinstance(doc, datetime):
        return doc.replace(tzinfo=timezone.utc).isoformat()
    
    return doc

def serialize_list(cursor):
    """Serialize a cursor or list of MongoDB documents (Bug Phase 1: 2, Phase 2: 7)"""
    if cursor is None:
        return []
    return [serialize_doc(doc) for doc in cursor]

def standard_response(success=True, data=None, message=None, error=None, status_code=200):
    """Consistent response structure (Bug Phase 1: 26)"""
    response = {"success": success}
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    if error:
        response["error"] = error
    return jsonify(response), status_code

def to_utc_iso(dt):
    """Timezone consistent date storage (Bug Phase 2: 3)"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()

def get_now_utc():
    """Get current time in UTC (Bug Phase 2: 3)"""
    return datetime.now(timezone.utc)
