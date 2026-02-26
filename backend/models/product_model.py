from bson import ObjectId
from bson.errors import InvalidId
from utils.helpers import get_now_utc
from utils.constants import COLLECTION_PRODUCTS
import extensions

class Product:
    def __init__(self, mongo):
        self.collection = mongo.db[COLLECTION_PRODUCTS]
    
    def create_product(self, name, description, price, stock, category, image_id=None):
        """Create a new product with integer cents (Bug 15, 16, Phase 1: 5)"""
        try:
            # Store price as cents to avoid floating point issues (Bug Phase 1: 5)
            price_cents = int(round(float(price) * 100))
            
            product_data = {
                'name': name.strip(),
                'description': description.strip(),
                'price': price_cents,
                'stock': int(stock),
                'category': category.strip(),
                'image_id': image_id,
                'created_at': get_now_utc(),
                'updated_at': get_now_utc()
            }
            
            result = self.collection.insert_one(product_data)
            return self.get_product_by_id(result.inserted_id)
        except (ValueError, TypeError):
            return None
    
    def get_product_by_id(self, product_id):
        """Get product by ID (Bug 2, 5)"""
        try:
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            return self.collection.find_one({'_id': product_id})
        except (InvalidId, TypeError):
            return None
    
    def get_all_products(self, category=None, limit=None, skip=None):
        """Get all products with sorting (Bug 14, Phase 2: 8)"""
        query = {}
        if category:
            query['category'] = category
        
        try:
            # Sort by created_at descending (Bug Phase 1: 14)
            cursor = self.collection.find(query).sort('created_at', -1)
            if skip:
                cursor = cursor.skip(int(skip))
            if limit:
                cursor = cursor.limit(int(limit))
            return list(cursor)
        except (ValueError, TypeError):
            return []
    
    def update_product(self, product_id, update_data):
        """Update product info with existence check (Bug Phase 2: 1, Phase 3: 9)"""
        try:
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            if 'price' in update_data:
                update_data['price'] = int(round(float(update_data['price']) * 100))
            
            if 'name' in update_data: update_data['name'] = update_data['name'].strip()
            if 'category' in update_data: update_data['category'] = update_data['category'].strip()
            
            update_data['updated_at'] = get_now_utc()
            result = self.collection.update_one(
                {'_id': product_id},
                {'$set': update_data}
            )
            # Use matched_count to check existence (Bug Phase 2: 1)
            if result.matched_count > 0:
                return {"success": True}
            return {"success": False, "error": "product_not_found"}
        except (InvalidId, TypeError, ValueError):
            return {"success": False, "error": "invalid_input"}
    
    def delete_product(self, product_id):
        """Delete product and its image (Bug 2, 5, Phase 2: 5)"""
        try:
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            # Find product to check for image cleanup (Bug Phase 2: 5)
            product = self.collection.find_one({'_id': product_id})
            if product and product.get('image_id'):
                try:
                    from gridfs.errors import NoFile
                    import extensions
                    extensions.fs.delete(ObjectId(product['image_id']))
                except (NoFile, InvalidId, TypeError):
                    pass # Image already gone or invalid ID

            
            result = self.collection.delete_one({'_id': product_id})
            return result.deleted_count > 0
        except (InvalidId, TypeError):
            return False
    
    def update_stock(self, product_id, new_stock):
        """Update product stock (Bug 2, 5)"""
        try:
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            result = self.collection.update_one(
                {'_id': product_id},
                {'$set': {
                    'stock': int(new_stock),
                    'updated_at': get_now_utc()
                }}
            )
            return result.matched_count > 0
        except (InvalidId, TypeError, ValueError):
            return False
    
    def increase_stock(self, product_id, quantity):
        """Increase product stock (Bug Phase 3: 1)"""
        try:
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            quantity = int(quantity)
            if quantity <= 0:
                return {"success": False, "error": "quantity_must_be_positive"}
                
            result = self.collection.update_one(
                {"_id": product_id},
                {
                    "$inc": {"stock": quantity},
                    "$set": {"updated_at": get_now_utc()}
                }
            )
            if result.matched_count == 0:
                return {"success": False, "error": "product_not_found"}
            return {"success": True}
        except (InvalidId, TypeError, ValueError):
            return {"success": False, "error": "invalid_input"}

    def decrease_stock(self, product_id, quantity):
        """Decrease product stock atomically (Bug 9, Phase 1: 4, Phase 3: 9)"""
        try:
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            quantity = int(quantity)
            if quantity <= 0: 
                return {"success": False, "error": "quantity_must_be_positive"}
            
            # Check if product exists first for better error reporting
            product = self.collection.find_one({"_id": product_id})
            if not product:
                return {"success": False, "error": "product_not_found"}
            
            if product.get('stock', 0) < quantity:
                return {"success": False, "error": "insufficient_stock", "available": product.get('stock')}

            result = self.collection.update_one(
                {'_id': product_id, 'stock': {'$gte': quantity}},
                {
                    '$inc': {'stock': -quantity},
                    '$set': {'updated_at': get_now_utc()}
                }
            )
            if result.modified_count > 0:
                return {"success": True}
            
            # If we reach here, either stock changed between find and update, 
            # or the $gte condition failed (simultaneous requests)
            return {"success": False, "error": "stock_reservation_failed"}
        except (InvalidId, TypeError, ValueError):
            return {"success": False, "error": "invalid_input"}
    
    def get_low_stock_products(self, threshold=5):
        """Get products with low stock"""
        try:
            return list(self.collection.find({
                'stock': {'$lt': int(threshold)}
            }).sort('stock', 1))
        except (ValueError, TypeError):
            return []
    
    def search_products(self, query):
        """Search products by name or description"""
        try:
            query = str(query).strip()
            if not query: return []
            search_regex = {'$regex': query, '$options': 'i'}
            return list(self.collection.find({
                '$or': [
                    {'name': search_regex},
                    {'description': search_regex}
                ]
            }).sort('created_at', -1))
        except Exception:
            return []
