from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError
from utils.helpers import get_now_utc
from utils.constants import COLLECTION_USERS

class User:
    def __init__(self, mongo):
        self.collection = mongo.db[COLLECTION_USERS]
    
    def create_user(self, name, email, password, role='user'):
        """Create a new user (Bug Phase 3: 9)"""
        email = email.strip().lower()
        password = password.strip()
        
        user_data = {
            'name': name.strip(),
            'email': email,
            'password': generate_password_hash(password),
            'role': role,
            'created_at': get_now_utc(),
            'updated_at': get_now_utc()
        }
        
        try:
            result = self.collection.insert_one(user_data)
            user = self.get_user_by_id(result.inserted_id)
            return {'success': True, 'data': user}
        except DuplicateKeyError:
            return {'success': False, 'error': 'email_already_exists'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_user_by_id(self, user_id):
        """Get user by ID (Safe)"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            return self.collection.find_one({'_id': user_id})
        except (InvalidId, TypeError):
            return None
    
    def get_user_by_email(self, email):
        """Get user by email"""
        if not email: return None
        email = email.strip().lower()
        try:
            return self.collection.find_one({'email': email})
        except Exception:
            return None
    
    def verify_password(self, user_id, password):
        """Verify user password"""
        user = self.get_user_by_id(user_id)
        if not password: return False
        password = password.strip()
        if user and "password" in user and check_password_hash(user['password'], password):
            return True
        return False
    
    def update_user(self, user_id, update_data):
        """Update user information (Bug Phase 3: 9)"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            clean_update = {}
            if 'email' in update_data:
                clean_update['email'] = update_data['email'].strip().lower()
            if 'password' in update_data:
                clean_update['password'] = generate_password_hash(update_data['password'].strip())
            if 'name' in update_data:
                clean_update['name'] = update_data['name'].strip()
                
            if not clean_update:
                return {'success': False, 'error': 'no_data_to_update'}

            clean_update['updated_at'] = get_now_utc()
            result = self.collection.update_one(
                {'_id': user_id},
                {'$set': clean_update}
            )
            
            if result.matched_count == 0:
                return {'success': False, 'error': 'user_not_found'}
            return {'success': True}
        except DuplicateKeyError:
            return {'success': False, 'error': 'email_already_exists'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def delete_user(self, user_id):
        """Delete user"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            result = self.collection.delete_one({'_id': user_id})
            return result.deleted_count > 0
        except (InvalidId, TypeError):
            return False
    
    def get_all_users(self):
        """Get all users (for admin)"""
        try:
            return list(self.collection.find().sort('created_at', -1))
        except Exception:
            return []
