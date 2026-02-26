from flask import Blueprint, request, url_for
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from extensions import mongo
from models.order_model import Order
from models.user_model import User
from models.product_model import Product
from middleware.auth_middleware import admin_required, jwt_required_custom
from utils.helpers import standard_response, serialize_doc, serialize_list, validate_oid
from utils.constants import (
    ORDER_STATUS_PENDING,
    ORDER_STATUS_CANCELLED,
    DELIVERY_STATUS_PROCESSING,
    DELIVERY_STATUS_OUT_FOR_DELIVERY
)

bp = Blueprint('admin', __name__)

@bp.route('/admin/dashboard', methods=['GET'])
@jwt_required_custom()
@admin_required()
def admin_dashboard():
    """Get admin dashboard statistics (Bug Phase 1: 12, 20)"""
    user_model = User(mongo)
    product_model = Product(mongo)
    order_model = Order(mongo)
    
    # Get statistics
    total_users = user_model.collection.count_documents({})
    total_products = product_model.collection.count_documents({})
    total_orders = order_model.collection.count_documents({})
    
    # Calculate revenue (Bug Phase 3: 3)
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_price"}}}]
    order_stats = list(order_model.collection.aggregate(pipeline))
    total_revenue_cents = order_stats[0]['total'] if order_stats else 0
    
    # Get low stock products
    low_stock_products = product_model.get_low_stock_products(5)
    
    return standard_response(
        success=True,
        data={
            'dashboard': {
                'total_users': total_users,
                'total_products': total_products,
                'total_orders': total_orders,
                'total_revenue': total_revenue_cents / 100, # convert cents to dollars
                'low_stock_count': len(low_stock_products),
                'low_stock_products': [
                    {
                        '_id': str(p['_id']),
                        'name': p['name'],
                        'stock': p['stock'],
                        'category': p.get('category', 'N/A')
                    } for p in low_stock_products
                ]
            }
        }
    )

@bp.route('/admin/users', methods=['GET'])
@jwt_required_custom()
@admin_required()
def get_users():
    """Get all users (admin only)"""
    user_model = User(mongo)
    users = user_model.get_all_users()
    return standard_response(success=True, data={'users': serialize_list(users)})

@bp.route('/admin/orders', methods=['GET'])
@jwt_required_custom()
@admin_required()
def get_all_orders():
    """Get all orders with user info (admin only)"""
    order_model = Order(mongo)
    orders = order_model.get_all_orders_with_users()
    
    # Flatten user info for easier frontend use
    formatted_orders = []
    for o in orders:
        user = o.get('user', {})
        order_doc = serialize_doc(o)
        order_doc['user_name'] = user.get('name', 'Unknown')
        order_doc['user_email'] = user.get('email', 'Unknown')
        # Remove the full user object to keep response clean
        if 'user' in order_doc: del order_doc['user']
        formatted_orders.append(order_doc)
        
    return standard_response(success=True, data={'orders': formatted_orders})

@bp.route('/admin/orders/<order_id>', methods=['GET'])
@jwt_required_custom()
@admin_required()
def get_admin_order_details(order_id):
    """Get single order details for admin (admin only)"""
    order_oid = validate_oid(order_id)
    if not order_oid:
        return standard_response(success=False, error='Invalid order ID', status_code=400)
        
    from utils.constants import COLLECTION_USERS
    pipeline = [
        {'$match': {'_id': order_oid}},
        {
            '$lookup': {
                'from': COLLECTION_USERS,
                'localField': 'user_id',
                'foreignField': '_id',
                'as': 'user'
            }
        },
        {
            '$unwind': {
                'path': '$user',
                'preserveNullAndEmptyArrays': True
            }
        }
    ]
    
    results = list(mongo.db.orders.aggregate(pipeline))
    if not results:
        return standard_response(success=False, error='Order not found', status_code=404)
        
    order = results[0]
    user = order.get('user', {})
    product_model = Product(mongo)
        
    # Re-using the logic from _format_order_with_items but since it's in a different BP, 
    # we'll do it here or move it to a helper. Let's keep it simple for now and use serialize_doc.
    # Actually, we need the product details for the modal.
    
    formatted_items = []
    for item in order.get('items', []):
        product = product_model.get_product_by_id(item['product_id'])
        if product:
            img_url = url_for('images.get_image', image_id=product['image_id'], _external=True) if product.get('image_id') else None
            formatted_items.append({
                'product_id': str(product['_id']),
                'name': product['name'],
                'quantity': item['quantity'],
                'price_at_purchase': item.get('price_at_purchase'),
                'image_url': img_url
            })
    
    order_doc = serialize_doc(order)
    order_doc['user_name'] = user.get('name', 'Unknown')
    order_doc['user_email'] = user.get('email', 'Unknown')
    if 'user' in order_doc: del order_doc['user']
    order_doc['items'] = formatted_items
    
    return standard_response(success=True, data=order_doc)

@bp.route('/admin/orders/<order_id>/status', methods=['PUT'])
@jwt_required_custom()
@admin_required()
def update_order_status(order_id):
    """Update order status (admin only) (Bug Phase 3: 6, 9)"""
    order_oid = validate_oid(order_id)
    if not order_oid:
        return standard_response(success=False, error='Invalid order ID', status_code=400)
        
    if not request.is_json:
        return standard_response(success=False, error='Content-Type must be application/json', status_code=400)
        
    data = request.get_json()
    status = data.get('status')
    
    if not status:
        return standard_response(success=False, error='Status is required', status_code=400)
        
    order_model = Order(mongo)
    result = order_model.update_order_status(order_oid, status)
    
    if result['success']:
        return standard_response(success=True, message=f'Order status updated to {status}')
    
    return standard_response(success=False, error=result.get('error', 'Update failed'), status_code=404)

@bp.route('/admin/orders/<order_id>/delivery', methods=['PUT'])
@jwt_required_custom()
@admin_required()
def update_delivery(order_id):
    """Update delivery status or tracking (admin only) (Bug Phase 3: 6, 9)"""
    order_oid = validate_oid(order_id)
    if not order_oid:
        return standard_response(success=False, error='Invalid order ID', status_code=400)
        
    if not request.is_json:
        return standard_response(success=False, error='Content-Type must be application/json', status_code=400)
        
    data = request.get_json()
    tracking_number = data.get('tracking_number')
    delivery_status = data.get('delivery_status')
    
    order_model = Order(mongo)
    
    if tracking_number:
        result = order_model.assign_tracking_number(order_oid, tracking_number)
        if not result['success']:
            return standard_response(success=False, error=result.get('error', 'Failed to assign tracking'), status_code=404)
            
    if delivery_status:
        result = order_model.update_delivery_status(order_oid, delivery_status)
        if not result['success']:
            return standard_response(success=False, error=result.get('error', 'Failed to update delivery status'), status_code=404)
            
    return standard_response(success=True, message='Delivery information updated successfully')

# Deprecated/Old routes cleanup (consolidating to /admin/ routes)
@bp.route('/orders/status/<status>', methods=['GET'])
@jwt_required_custom()
@admin_required()
def get_orders_by_status(status):
    """Get orders by status (admin only)"""
    order_model = Order(mongo)
    orders = list(order_model.collection.find({'status': status}))
    return standard_response(success=True, data={'orders': serialize_list(orders)})
