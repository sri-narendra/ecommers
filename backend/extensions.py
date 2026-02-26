from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from gridfs import GridFS
from config import Config

# Initialize extensions
mongo = PyMongo()
jwt = JWTManager()
fs = None

def init_extensions(app: Flask):
    """Initialize all Flask extensions"""
    # Initialize MongoDB
    mongo.init_app(app)
    
    # Initialize GridFS with safety (Bug 10, 19)
    global fs
    with app.app_context():
        try:
            fs = GridFS(mongo.db)
        except Exception as e:
            app.logger.error(f"Failed to initialize GridFS: {str(e)}")
            fs = None
    
    # Initialize JWT
    jwt.init_app(app)
    
    # Initialize CORS properly using specified origins
    CORS(app, resources={r"/*": {"origins": app.config.get('CORS_ORIGINS', [])}}, 
         supports_credentials=True,
         allow_headers="*",
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    return mongo, jwt, fs

def setup_database(app: Flask):
    """Setup database indexes and other constraints (Bug Phase 1: 7, 17, Phase 2: 8)"""
    with app.app_context():
        from pymongo import ASCENDING, DESCENDING
        try:
            # Create unique index for email (Bug 7)
            mongo.db.users.create_index([("email", ASCENDING)], unique=True)
            
            # Additional performance indexes (Bug 17)
            mongo.db.products.create_index([("created_at", DESCENDING)])
            mongo.db.orders.create_index([("user_id", ASCENDING)])
            mongo.db.orders.create_index([("created_at", DESCENDING)])
            mongo.db.cart.create_index([("user_id", ASCENDING)], unique=True)
            
            app.logger.info("Database indexes created successfully")
        except Exception as e:
            app.logger.error(f"Failed to create database indexes: {str(e)}")