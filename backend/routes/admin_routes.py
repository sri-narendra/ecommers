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

@bp.route('/dashboard', methods=['GET'])
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
    
    # Get low stock products
    low_stock_products = product_model.get_low_stock_products(5)
    
    return standard_response(
        success=True,
        data={
            'dashboard': {
                'total_users': total_users,
                'total_products': total_products,
                'total_orders': total_orders,
                'low_stock_products_count': len(low_stock_products)
            },
            'low_stock_products': [
                {
                    '_id': str(p['_id']),
                    'name': p['name'],
                    'stock': p['stock']
                } for p in low_stock_products
            ]
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
    """Get all orders (admin only)"""
    order_model = Order(mongo)
    orders = order_model.get_all_orders()
    return standard_response(success=True, data={'orders': serialize_list(orders)})

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
