import os
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_admin():
    mongo_uri = os.environ.get('MONGO_URI')
    if not mongo_uri:
        print("Error: MONGO_URI not found in environment")
        return

    try:
        client = MongoClient(mongo_uri)
        db = client.get_default_database()
        
        # Admin info
        admin_email = "admin@ecommerce.com"
        admin_password = "AdminPassword123!"
        
        # Check if admin exists
        existing_admin = db.users.find_one({"email": admin_email})
        
        if existing_admin:
            print(f"Admin with email {admin_email} already exists.")
            return

        admin_data = {
            "name": "System Admin",
            "email": admin_email,
            "password": generate_password_hash(admin_password),
            "role": "admin",
            "created_at": "2026-02-25T17:15:00Z", # Placeholder for now
            "updated_at": "2026-02-25T17:15:00Z"
        }
        
        db.users.insert_one(admin_data)
        print("Admin account created successfully!")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    create_admin()
