from flask import Blueprint, request, url_for
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from extensions import mongo
from models.order_model import Order
from models.product_model import Product
from middleware.auth_middleware import jwt_required_custom
from utils.helpers import standard_response, serialize_doc, serialize_list, validate_oid

bp = Blueprint('orders', __name__)

def _format_order_with_items(order, product_model):
    """Helper to add product details to order items (Bug Phase 1: 5, Phase 3: 7)"""
    formatted_items = []
    for item in order.get('items', []):
        product = product_model.get_product_by_id(item['product_id'])
        if product:
            img_url = None
            if product.get('image_id'):
                img_url = url_for('images.get_image', image_id=product['image_id'], _external=True)
                
            formatted_items.append({
                'product_id': str(product['_id']),
                'name': product['name'],
                'quantity': item['quantity'],
                'price_at_purchase': item.get('price_at_purchase'), # cents
                'image_url': img_url
            })
        else:
            formatted_items.append({
                'product_id': str(item['product_id']),
                'name': 'Product Unvailable',
                'quantity': item['quantity'],
                'price_at_purchase': item.get('price_at_purchase'),
                'image_url': None
            })
    
    order_doc = serialize_doc(order)
    order_doc['items'] = formatted_items
    return order_doc

@bp.route('/orders', methods=['GET'])
@jwt_required_custom()
def get_my_orders():
    """Get orders for the current user"""
    current_user_id = get_jwt_identity()
    user_oid = validate_oid(current_user_id)
    if not user_oid:
        return standard_response(success=False, error='Invalid user ID', status_code=401)
        
    order_model = Order(mongo)
    product_model = Product(mongo)
    
    orders = order_model.get_orders_by_user(user_oid)
    formatted_orders = [_format_order_with_items(order, product_model) for order in orders]
    
    return standard_response(success=True, data={'orders': formatted_orders})

@bp.route('/orders/<order_id>', methods=['GET'])
@jwt_required_custom()
def get_order_details(order_id):
    """Get single order details (Bug Phase 3: 6)"""
    order_oid = validate_oid(order_id)
    if not order_oid:
        return standard_response(success=False, error='Invalid order ID', status_code=400)
        
    current_user_id = get_jwt_identity()
    
    order_model = Order(mongo)
    product_model = Product(mongo)
    
    order = order_model.get_order_by_id(order_oid)
    if not order:
        return standard_response(success=False, error='Order not found', status_code=404)
    
    # Secure check: only the owner (or admin but this is user route) can see the order
    if str(order['user_id']) != current_user_id:
        return standard_response(success=False, error='Unauthorized', status_code=403)
        
    return standard_response(success=True, data=_format_order_with_items(order, product_model))

@bp.route('/orders/<order_id>/cancel', methods=['POST'])
@jwt_required_custom()
def cancel_order(order_id):
    """Cancel a pending order (Bug Phase 3: 6, 9)"""
    order_oid = validate_oid(order_id)
    if not order_oid:
        return standard_response(success=False, error='Invalid order ID', status_code=400)
        
    current_user_id = get_jwt_identity()
    
    order_model = Order(mongo)
    order = order_model.get_order_by_id(order_oid)
    
    if not order:
        return standard_response(success=False, error='Order not found', status_code=404)
        
    if str(order['user_id']) != current_user_id:
        return standard_response(success=False, error='Unauthorized', status_code=403)
        
    if order['status'] != 'pending':
        return standard_response(success=False, error='Only pending orders can be cancelled', status_code=400)
    
    # Restore stock
    product_model = Product(mongo)
    for item in order['items']:
        product_model.increase_stock(item['product_id'], item['quantity'])
        
    result = order_model.cancel_order(order_oid)
    if result['success']:
        return standard_response(success=True, message='Order cancelled successfully')
    
    return standard_response(success=False, error=result.get('error', 'Failed to cancel order'), status_code=500)
