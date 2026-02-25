from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from models.user_model import User
from extensions import mongo
from utils.helpers import standard_response

def jwt_required_custom():
    """Decorator to require JWT authentication (Bug 4, Phase 2: 2, 6)"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                if current_user_id is None:
                    return standard_response(success=False, error='Invalid token identity', status_code=401)
                
                # Verify user exists in DB (Bug 17)
                user_model = User(mongo)
                user = user_model.get_user_by_id(current_user_id)
                if not user:
                    return standard_response(success=False, error='User not found or deleted', status_code=401)
                
                return fn(*args, **kwargs)
            except Exception as e:
                return standard_response(success=False, error='Authentication required', status_code=401)
        return decorator
    return wrapper

def admin_required():
    """Decorator to require admin role (Bug Phase 2: 2, 6)"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                if current_user_id is None:
                    return standard_response(success=False, error='Invalid token identity', status_code=401)
                
                user_model = User(mongo)
                user = user_model.get_user_by_id(current_user_id)
                
                if not user or user.get('role') != 'admin':
                    return standard_response(success=False, error='Admin access required', status_code=403)
                
                return fn(*args, **kwargs)
            except Exception as e:
                return standard_response(success=False, error='Authentication required', status_code=401)
        return decorator
    return wrapper

def get_current_user():
    """Get current user from JWT token (Bug Phase 2: 2)"""
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return None
        user_model = User(mongo)
        return user_model.get_user_by_id(current_user_id)
    except:
        return None

def validate_product_stock(product_id, quantity):
    """Validate if product has sufficient stock"""
    product_model = mongo.db.products
    
    # Bug 1, 2: Safe ObjectId conversion
    try:
        if isinstance(product_id, str):
            product_id = ObjectId(product_id)
    except (InvalidId, TypeError):
        return False, "Invalid product ID format"

    product = product_model.find_one({'_id': product_id})
    
    if not product:
        return False, "Product not found"
    
    # Bug 16: Default values
    stock = product.get('stock', 0)
    
    if stock < quantity:
        return False, f"Insufficient stock. Available: {stock}"
    
    return True, "Stock available"
