from bson import ObjectId
from bson.errors import InvalidId
from utils.helpers import get_now_utc
from utils.constants import (
    COLLECTION_ORDERS,
    ORDER_STATUS_PENDING, 
    ORDER_STATUS_CANCELLED,
    DELIVERY_STATUS_PROCESSING,
    DELIVERY_STATUS_OUT_FOR_DELIVERY
)

class Order:
    def __init__(self, mongo):
        self.collection = mongo.db[COLLECTION_ORDERS]
    
    def create_order(self, user_id, items, total_price_cents):
        """Create a new order with integer cents (Bug Phase 3: 3, 9)"""
        try:
            # Bug Phase 3: 3 - total_price_cents is already in cents
            order_data = {
                'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
                'items': items, # List of {product_id, quantity, price_at_purchase_cents}
                'total_price': int(total_price_cents),
                'status': ORDER_STATUS_PENDING,
                'delivery_status': DELIVERY_STATUS_PROCESSING,
                'tracking_number': None,
                'created_at': get_now_utc(),
                'updated_at': get_now_utc()
            }
            
            result = self.collection.insert_one(order_data)
            order = self.get_order_by_id(result.inserted_id)
            if order:
                return {"success": True, "data": order}
            return {"success": False, "error": "order_creation_failed"}
        except (InvalidId, TypeError, ValueError):
            return {"success": False, "error": "invalid_input"}
    
    def get_order_by_id(self, order_id):
        """Get order by ID (Bug 2, 5)"""
        try:
            if isinstance(order_id, str):
                order_id = ObjectId(order_id)
            return self.collection.find_one({'_id': order_id})
        except (InvalidId, TypeError):
            return None
    
    def get_orders_by_user(self, user_id):
        """Get all orders for a specific user"""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            return list(self.collection.find({'user_id': user_id}).sort('created_at', -1))
        except (InvalidId, TypeError):
            return []
    
    def get_all_orders(self):
        """Get all orders (for admin)"""
        try:
            return list(self.collection.find().sort('created_at', -1))
        except Exception:
            return []
    
    def update_order_status(self, order_id, status):
        """Update order status (Bug Phase 2: 1, Phase 3: 9)"""
        try:
            if isinstance(order_id, str):
                order_id = ObjectId(order_id)
            
            result = self.collection.update_one(
                {'_id': order_id},
                {'$set': {
                    'status': status,
                    'updated_at': get_now_utc()
                }}
            )
            if result.matched_count > 0:
                return {"success": True}
            return {"success": False, "error": "order_not_found"}
        except (InvalidId, TypeError):
            return {"success": False, "error": "invalid_input"}
    
    def cancel_order(self, order_id):
        """Cancel order (Bug Phase 3: 9)"""
        try:
            if isinstance(order_id, str):
                order_id = ObjectId(order_id)
            
            result = self.collection.update_one(
                {'_id': order_id},
                {'$set': {
                    'status': ORDER_STATUS_CANCELLED,
                    'updated_at': get_now_utc()
                }}
            )
            if result.matched_count > 0:
                return {"success": True}
            return {"success": False, "error": "order_not_found"}
        except (InvalidId, TypeError):
            return {"success": False, "error": "invalid_input"}
    
    def assign_tracking_number(self, order_id, tracking_number):
        """Assign tracking number to order (Bug Phase 3: 9)"""
        try:
            if isinstance(order_id, str):
                order_id = ObjectId(order_id)
            
            result = self.collection.update_one(
                {'_id': order_id},
                {'$set': {
                    'tracking_number': tracking_number,
                    'delivery_status': DELIVERY_STATUS_OUT_FOR_DELIVERY,
                    'updated_at': get_now_utc()
                }}
            )
            if result.matched_count > 0:
                return {"success": True}
            return {"success": False, "error": "order_not_found"}
        except (InvalidId, TypeError):
            return {"success": False, "error": "invalid_input"}
    
    def update_delivery_status(self, order_id, delivery_status):
        """Update delivery status (Bug Phase 3: 9)"""
        try:
            if isinstance(order_id, str):
                order_id = ObjectId(order_id)
            
            result = self.collection.update_one(
                {'_id': order_id},
                {'$set': {
                    'delivery_status': delivery_status,
                    'updated_at': get_now_utc()
                }}
            )
            if result.matched_count > 0:
                return {"success": True}
            return {"success": False, "error": "order_not_found"}
        except (InvalidId, TypeError):
            return {"success": False, "error": "invalid_input"}
    
    def get_orders_by_status(self, status):
        """Get orders by status (for admin)"""
        try:
            return list(self.collection.find({'status': status}).sort('created_at', -1))
        except Exception:
            return []
    
    def get_orders_by_delivery_status(self, delivery_status):
        """Get orders by delivery status (for admin)"""
        try:
            return list(self.collection.find({'delivery_status': delivery_status}).sort('created_at', -1))
        except Exception:
            return []
