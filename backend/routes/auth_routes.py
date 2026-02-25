from flask import Blueprint, request
from flask_jwt_extended import create_access_token
from models.user_model import User
from extensions import mongo
from middleware.auth_middleware import get_current_user, jwt_required_custom
from utils.helpers import standard_response, serialize_doc

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user (Bug Phase 1: 3, 6, 8, Phase 2: 9, 16)"""
    if not request.is_json: # Bug Phase 1: 8
        return standard_response(success=False, error='Content-Type must be application/json', status_code=400)
        
    data = request.get_json()
    if not data:
        return standard_response(success=False, error='Invalid or missing JSON', status_code=400)
    
    # Validate required fields and strip strings (Bug Phase 1: 6, Phase 2: 9)
    name = str(data.get('name', '')).strip()
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', '')).strip()
    
    if not name or not email or not password:
        return standard_response(success=False, error='Name, email, and password are required', status_code=400)
    
    if len(password) < 6: # Bug Phase 1: 7
        return standard_response(success=False, error='Password must be at least 6 characters', status_code=400)
    
    user_model = User(mongo)
    
    # Check if user already exists
    if user_model.get_user_by_email(email):
        return standard_response(success=False, error='Email already registered', status_code=400)
    
    # Create user
    result = user_model.create_user(name=name, email=email, password=password)
    
    if result['success']:
        return standard_response(
            success=True, 
            message='User registered successfully', 
            data={'user': serialize_doc(result['data'])},
            status_code=201
        )
    
    error_msg = 'Registration failed'
    if result.get('error') == 'email_already_exists':
        error_msg = 'Email already registered'
        
    return standard_response(success=False, error=error_msg, status_code=400 if result.get('error') == 'email_already_exists' else 500)

@bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token (Bug Phase 1: 3, 6, 8, Phase 2: 9)"""
    if not request.is_json:
        return standard_response(success=False, error='Content-Type must be application/json', status_code=400)
        
    data = request.get_json()
    if not data:
        return standard_response(success=False, error='Invalid or missing JSON', status_code=400)
    
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', '')).strip()
    
    if not email or not password:
        return standard_response(success=False, error='Email and password are required', status_code=400)
    
    user_model = User(mongo)
    user = user_model.get_user_by_email(email)
    
    if user and user_model.verify_password(user['_id'], password):
        # Create JWT token
        access_token = create_access_token(
            identity=str(user['_id']),
            additional_claims={'role': user['role']}
        )
        
        return standard_response(
            success=True,
            message='Login successful',
            data={
                'access_token': access_token,
                'user': serialize_doc(user)
            }
        )
    
    return standard_response(success=False, error='Invalid credentials', status_code=401)

@bp.route('/profile', methods=['GET'])
@jwt_required_custom()
def get_profile():
    """Get current user profile (Bug Phase 1: 12)"""
    user = get_current_user()
    if not user:
        return standard_response(success=False, error='User not found', status_code=404)
    
    return standard_response(
        success=True,
        data={'user': serialize_doc(user)}
    )

@bp.route('/profile', methods=['PUT'])
@jwt_required_custom()
def update_profile():
    """Update current user profile (Bug Phase 1: 3, 6, 8)"""
    if not request.is_json:
        return standard_response(success=False, error='Content-Type must be application/json', status_code=400)
        
    user = get_current_user()
    if not user:
        return standard_response(success=False, error='User not found', status_code=404)
    
    data = request.get_json()
    if not data:
        return standard_response(success=False, error='No fields provided for update', status_code=400)
    
    update_data = {}
    if 'name' in data:
        name = str(data['name']).strip()
        if name: update_data['name'] = name
        
    if 'email' in data:
        email = str(data['email']).strip().lower()
        if email and email != user['email']:
            update_data['email'] = email
    
    if not update_data:
        return standard_response(success=False, error='No valid fields to update', status_code=400)
    
    user_model = User(mongo)
    result = user_model.update_user(user['_id'], update_data)
    
    if result['success']:
        updated_user = user_model.get_user_by_id(user['_id'])
        return standard_response(
            success=True,
            message='Profile updated successfully',
            data={'user': serialize_doc(updated_user)}
        )
    
    error_msg = result.get('error', 'Update failed')
    status_code = 400 if error_msg == 'email_already_exists' else 500
    return standard_response(success=False, error=error_msg, status_code=status_code)

@bp.route('/change-password', methods=['PUT'])
@jwt_required_custom()
def change_password():
    """Change user password (Bug Phase 1: 3, 12, Phase 2: 9)"""
    if not request.is_json:
        return standard_response(success=False, error='Content-Type must be application/json', status_code=400)
        
    user = get_current_user()
    if not user:
        return standard_response(success=False, error='User not found', status_code=404)
    
    data = request.get_json()
    if not data:
        return standard_response(success=False, error='Invalid or missing JSON', status_code=400)
    
    current_password = str(data.get('current_password', '')).strip()
    new_password = str(data.get('new_password', '')).strip()
    
    if not current_password or not new_password:
        return standard_response(success=False, error='Current and new password are required', status_code=400)
    
    if len(new_password) < 6:
        return standard_response(success=False, error='New password must be at least 6 characters', status_code=400)
    
    user_model = User(mongo)
    if not user_model.verify_password(user['_id'], current_password):
        return standard_response(success=False, error='Current password is incorrect', status_code=400)
    
    result = user_model.update_user(user['_id'], {'password': new_password})
    if result['success']:
        return standard_response(success=True, message='Password changed successfully')
    
    return standard_response(success=False, error=result.get('error', 'Failed to change password'), status_code=500)

@bp.route('/logout', methods=['POST'])
@jwt_required_custom()
def logout():
    """Logout user"""
    return standard_response(success=True, message='Logout successful')
