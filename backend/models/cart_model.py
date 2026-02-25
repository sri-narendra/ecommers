from bson import ObjectId
from bson.errors import InvalidId
from utils.helpers import get_now_utc
from utils.constants import COLLECTION_CARTS

class Cart:
    def __init__(self, mongo):
        self.collection = mongo.db[COLLECTION_CARTS]
    
    def get_cart_by_user(self, user_id):
        """Get cart for a specific user (Bug Phase 1: 2, 5, Phase 2: 1)"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            cart = self.collection.find_one({'user_id': user_id})
            if not cart:
                # Create empty cart if doesn't exist
                cart_data = {
                    'user_id': user_id,
                    'items': [],
                    'updated_at': get_now_utc()
                }
                result = self.collection.insert_one(cart_data)
                cart = self.collection.find_one({'_id': result.inserted_id})
            
            return cart
        except (InvalidId, TypeError):
            return None
    
    def add_item_to_cart(self, user_id, product_id, quantity):
        """Add item to cart or update quantity if exists (Bug Phase 1: 12, Phase 3: 9)"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            cart = self.get_cart_by_user(user_id)
            if not cart:
                return {"success": False, "error": "cart_initialization_failed"}
            
            # Check if item already exists in cart
            item_exists = False
            for item in cart['items']:
                if item['product_id'] == product_id:
                    item['quantity'] += int(quantity)
                    item_exists = True
                    break
            
            if not item_exists:
                cart['items'].append({
                    'product_id': product_id,
                    'quantity': int(quantity)
                })
            
            cart['updated_at'] = get_now_utc()
            
            result = self.collection.update_one(
                {'_id': cart['_id']},
                {'$set': {
                    'items': cart['items'],
                    'updated_at': cart['updated_at']
                }}
            )
            if result.matched_count > 0:
                return {"success": True}
            return {"success": False, "error": "db_update_failed"}
        except (InvalidId, TypeError, ValueError):
            return {"success": False, "error": "invalid_input"}
    
    def update_item_quantity(self, user_id, product_id, quantity):
        """Update item quantity in cart (Bug Phase 1: 12, Phase 3: 9)"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            cart = self.get_cart_by_user(user_id)
            if not cart:
                return {"success": False, "error": "cart_not_found"}
            
            found = False
            for item in cart['items']:
                if item['product_id'] == product_id:
                    item['quantity'] = int(quantity)
                    found = True
                    break
            
            if not found:
                return {"success": False, "error": "item_not_in_cart"}
            
            updated_at = get_now_utc()
            result = self.collection.update_one(
                {'_id': cart['_id']},
                {'$set': {
                    'items': cart['items'],
                    'updated_at': updated_at
                }}
            )
            if result.matched_count > 0:
                return {"success": True}
            return {"success": False, "error": "db_update_failed"}
        except (InvalidId, TypeError, ValueError):
            return {"success": False, "error": "invalid_input"}
    
    def remove_item_from_cart(self, user_id, product_id):
        """Remove item from cart (Bug Phase 1: 12, Phase 3: 9)"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)
            
            cart = self.get_cart_by_user(user_id)
            if not cart:
                return {"success": False, "error": "cart_not_found"}
            
            original_len = len(cart['items'])
            cart['items'] = [item for item in cart['items'] 
                            if item['product_id'] != product_id]
            
            if len(cart['items']) == original_len:
                return {"success": False, "error": "item_not_in_cart"}
            
            updated_at = get_now_utc()
            result = self.collection.update_one(
                {'_id': cart['_id']},
                {'$set': {
                    'items': cart['items'],
                    'updated_at': updated_at
                }}
            )
            if result.matched_count > 0:
                return {"success": True}
            return {"success": False, "error": "db_update_failed"}
        except (InvalidId, TypeError):
            return {"success": False, "error": "invalid_input"}
    
    def clear_cart(self, user_id):
        """Clear all items from cart (Bug Phase 1: 12, Phase 3: 9)"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            
            result = self.collection.update_one(
                {'user_id': user_id},
                {'$set': {
                    'items': [],
                    'updated_at': get_now_utc()
                }}
            )
            if result.matched_count > 0:
                return {"success": True}
            return {"success": False, "error": "cart_not_found"}
        except (InvalidId, TypeError):
            return {"success": False, "error": "invalid_input"}
    
    def get_cart_total(self, user_id, product_model):
        """Calculate total value of cart in cents (Bug Phase 1: 12, Phase 3: 10)"""
        try:
            cart = self.get_cart_by_user(user_id)
            if not cart or not cart.get('items'):
                return 0
            
            total_cents = 0
            valid_items = []
            cart_modified = False
            
            for item in cart['items']:
                product = product_model.get_product_by_id(item['product_id'])
                if product:
                    total_cents += product.get('price', 0) * item.get('quantity', 0)
                    valid_items.append(item)
                else:
                    # Bug Phase 3: 10 - Handle missing product by removing it from cart
                    cart_modified = True
            
            if cart_modified:
                self.collection.update_one(
                    {'_id': cart['_id']},
                    {'$set': {'items': valid_items, 'updated_at': get_now_utc()}}
                )
            
            return total_cents
        except Exception:
            return 0
    
    def get_cart_items_with_details(self, user_id, product_model):
        """Get cart items with product details (Bug Phase 1: 12, Phase 3: 10)"""
        try:
            cart = self.get_cart_by_user(user_id)
            if not cart or not cart.get('items'):
                return []
            
            items_with_details = []
            valid_items = []
            cart_modified = False
            
            for item in cart['items']:
                product = product_model.get_product_by_id(item['product_id'])
                if product:
                    items_with_details.append({
                        'cart_item': item,
                        'product': product
                    })
                    valid_items.append(item)
                else:
                    # Bug Phase 3: 10 - Handle missing product
                    cart_modified = True
            
            if cart_modified:
                self.collection.update_one(
                    {'_id': cart['_id']},
                    {'$set': {'items': valid_items, 'updated_at': get_now_utc()}}
                )
            
            return items_with_details
        except Exception:
            return []
