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
    """Serialize a single MongoDB document (Bug Phase 1: 1)"""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    
    # Handle nested ObjectIds if any (recursive simplification)
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, datetime):
            doc[key] = value.replace(tzinfo=timezone.utc).isoformat()
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
