from flask import Blueprint, request, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
from extensions import mongo
from models.cart_model import Cart
from models.product_model import Product
from models.order_model import Order
from utils.helpers import standard_response, serialize_doc, serialize_list, validate_oid

bp = Blueprint('cart', __name__)

def _get_quantity(val):
    """Safe quantity parsing (Bug Phase 3: 13)"""
    try:
        # Allow 2.0 but reject 2.5
        f_val = float(val)
        if f_val.is_integer():
            return int(f_val)
        return None
    except (ValueError, TypeError):
        return None

@bp.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    """Get current user's cart (Bug Phase 3: 10)"""
    current_user_id = get_jwt_identity()
    user_oid = validate_oid(current_user_id)
    if not user_oid:
        return standard_response(success=False, error='Invalid user ID', status_code=401)
    
    cart_model = Cart(mongo)
    product_model = Product(mongo)
    
    # get_cart_items_with_details already handles missing products (Bug Phase 3: 10)
    cart_items = cart_model.get_cart_items_with_details(user_oid, product_model)
    cart_total_cents = cart_model.get_cart_total(user_oid, product_model)
    
    # Format response
    formatted_items = []
    for item in cart_items:
        product = item['product']
        cart_item = item['cart_item']
        
        # Bug Phase 3: 7 - Use url_for for images
        image_url = None
        if product.get('image_id'):
            image_url = url_for('images.get_image', image_id=product['image_id'], _external=True)
            
        formatted_items.append({
            'product_id': str(product['_id']),
            'name': product['name'],
            'price': product['price'] / 100, # convert cents to dollars
            'quantity': cart_item['quantity'],
            'total': (product['price'] * cart_item['quantity']) / 100, # convert cents to dollars
            'stock': product['stock'],
            'image_url': image_url
        })
    
    return standard_response(
        success=True,
        data={
            'cart': {
                'items': formatted_items,
                'total': cart_total_cents / 100 # convert total to dollars
            }
        }
    )

@bp.route('/cart/add', methods=['POST'])
@jwt_required()
def add_to_cart():
    """Add item to cart (Bug Phase 3: 6, 9, 13)"""
    current_user_id = get_jwt_identity()
    user_oid = validate_oid(current_user_id)
    if not user_oid: return standard_response(success=False, error='Invalid user ID', status_code=401)

    if not request.is_json:
        return standard_response(success=False, error='Content-Type must be application/json', status_code=400)
        
    data = request.get_json()
    if not data:
        return standard_response(success=False, error='Invalid or missing JSON', status_code=400)
    
    product_id = data.get('product_id')
    raw_quantity = data.get('quantity')
    
    if not product_id or raw_quantity is None:
        return standard_response(success=False, error='Product ID and quantity are required', status_code=400)
    
    product_oid = validate_oid(product_id)
    if not product_oid:
        return standard_response(success=False, error='Invalid product ID', status_code=400)
        
    quantity = _get_quantity(raw_quantity)
    if quantity is None or quantity <= 0:
        return standard_response(success=False, error='Quantity must be a positive integer', status_code=400)
    
    # Validate product exists and has sufficient stock
    product_model = Product(mongo)
    product = product_model.get_product_by_id(product_oid)
    
    if not product:
        return standard_response(success=False, error='Product not found', status_code=404)
    
    if product.get('stock', 0) < quantity:
        return standard_response(success=False, error=f'Insufficient stock. Available: {product.get("stock", 0)}', status_code=400)
    
    # Add to cart
    cart_model = Cart(mongo)
    result = cart_model.add_item_to_cart(user_oid, product_oid, quantity)
    
    if result['success']:
        return standard_response(success=True, message='Item added to cart successfully')
    
    return standard_response(success=False, error=f"Failed to add item: {result.get('error', 'unknown')}", status_code=500)

@bp.route('/cart/update', methods=['PUT'])
@jwt_required()
def update_cart_item():
    """Update item quantity in cart (Bug Phase 3: 4, 6, 9, 13)"""
    current_user_id = get_jwt_identity()
    user_oid = validate_oid(current_user_id)
    if not user_oid: return standard_response(success=False, error='Invalid user ID', status_code=401)

    if not request.is_json:
        return standard_response(success=False, error='Content-Type must be application/json', status_code=400)
        
    data = request.get_json()
    if not data:
        return standard_response(success=False, error='Invalid or missing JSON', status_code=400)
    
    product_id = data.get('product_id')
    raw_quantity = data.get('quantity')
    
    if not product_id or raw_quantity is None:
        return standard_response(success=False, error='Product ID and quantity are required', status_code=400)
    
    product_oid = validate_oid(product_id)
    if not product_oid:
        return standard_response(success=False, error='Invalid product ID', status_code=400)
        
    quantity = _get_quantity(raw_quantity)
    if quantity is None or quantity < 0:
        return standard_response(success=False, error='Quantity must be a non-negative integer', status_code=400)
    
    cart_model = Cart(mongo)
    # Bug Phase 3: 4 - handle quantity 0 as removal
    if quantity == 0:
        result = cart_model.remove_item_from_cart(user_oid, product_oid)
        if result['success']:
            return standard_response(success=True, message='Item removed from cart')
        return standard_response(success=False, error=result.get('error', 'Failed to remove item'), status_code=400)

    # Validate product exists
    product_model = Product(mongo)
    product = product_model.get_product_by_id(product_oid)
    if not product:
        return standard_response(success=False, error='Product not found', status_code=404)
    
    if product.get('stock', 0) < quantity:
        return standard_response(success=False, error=f'Insufficient stock. Available: {product.get("stock", 0)}', status_code=400)
    
    # Update cart
    result = cart_model.update_item_quantity(user_oid, product_oid, quantity)
    if result['success']:
        return standard_response(success=True, message='Cart updated successfully')
    
    return standard_response(success=False, error=result.get('error', 'Failed to update cart'), status_code=500)

@bp.route('/cart/remove', methods=['DELETE'])
@jwt_required()
def remove_from_cart():
    """Remove item from cart (Bug Phase 3: 5, 6, 9)"""
    current_user_id = get_jwt_identity()
    user_oid = validate_oid(current_user_id)
    if not user_oid: return standard_response(success=False, error='Invalid user ID', status_code=401)
    
    # Bug Phase 3: 5 - handle DELETE without JSON body
    product_id = None
    if request.is_json:
        data = request.get_json(silent=True) or {}
        product_id = data.get('product_id')
    
    if not product_id:
        product_id = request.args.get('product_id')
        
    if not product_id:
        return standard_response(success=False, error='Product ID is required', status_code=400)
    
    product_oid = validate_oid(product_id)
    if not product_oid:
        return standard_response(success=False, error='Invalid product ID', status_code=400)
    
    cart_model = Cart(mongo)
    result = cart_model.remove_item_from_cart(user_oid, product_oid)
    if result['success']:
        return standard_response(success=True, message='Item removed from cart successfully')
    
    return standard_response(success=False, error=result.get('error', 'Failed to remove item'), status_code=400)

@bp.route('/cart/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    """Clear all items from cart (Bug Phase 3: 6, 9)"""
    current_user_id = get_jwt_identity()
    user_oid = validate_oid(current_user_id)
    if not user_oid: return standard_response(success=False, error='Invalid user ID', status_code=401)
    
    cart_model = Cart(mongo)
    result = cart_model.clear_cart(user_oid)
    if result['success']:
        return standard_response(success=True, message='Cart cleared successfully')
    
    return standard_response(success=False, error=result.get('error', 'Failed to clear cart'), status_code=500)

@bp.route('/checkout', methods=['POST'])
@jwt_required()
def checkout():
    """Checkout cart and create order (Bug Phase 3: 1, 2, 3, 8, 12)"""
    current_user_id = get_jwt_identity()
    user_oid = validate_oid(current_user_id)
    if not user_oid: return standard_response(success=False, error='Invalid user ID', status_code=401)
    
    cart_model = Cart(mongo)
    product_model = Product(mongo)
    
    # Bug Phase 3: 12 - Get cart items and check if empty
    cart_items = cart_model.get_cart_items_with_details(user_oid, product_model)
    if not cart_items:
        return standard_response(success=False, error='Cart is empty', status_code=400)
    
    # Bug Phase 3: 2 & 8 - REORDER: 1. Validate, 2. Reserve Stock, 3. Create Order
    
    # 1. Validate all items first
    order_items = []
    total_price_cents = 0
    
    for item in cart_items:
        product = item['product']
        cart_item = item['cart_item']
        
        if product.get('stock', 0) < cart_item['quantity']:
            return standard_response(
                success=False, 
                error=f'Insufficient stock for {product["name"]}. Available: {product.get("stock", 0)}',
                status_code=400
            )
        
        order_items.append({
            'product_id': product['_id'],
            'quantity': cart_item['quantity'],
            'price_at_purchase': product['price'] # Already in cents
        })
        total_price_cents += product['price'] * cart_item['quantity']
    
    # 2. Reserve stock (DECREASE STOCK FIRST)
    successful_decreases = []
    rollback_needed = False
    error_message = ""
    
    for item in order_items:
        dec_res = product_model.decrease_stock(item['product_id'], item['quantity'])
        if dec_res['success']:
            successful_decreases.append(item)
        else:
            rollback_needed = True
            error_message = dec_res.get('error', 'One or more items became unavailable.')
            break
            
    # Bug Phase 3: 1 - Implement manual rollback
    if rollback_needed:
        for prev_item in successful_decreases:
            product_model.increase_stock(prev_item['product_id'], prev_item['quantity'])
        return standard_response(success=False, error=f'Checkout failed: {error_message}', status_code=400)
    
    # 3. Create order
    order_model = Order(mongo)
    payment_method = request.json.get('payment_method', 'credit_card')
    shipping_address = request.json.get('shipping_address')
    order_res = order_model.create_order(user_oid, order_items, total_price_cents, shipping_address, payment_method)
    
    if not order_res['success']:
        # Bug Phase 3: 1 - Rollback stock if order creation fails
        for item in order_items:
            product_model.increase_stock(item['product_id'], item['quantity'])
        return standard_response(success=False, error='Failed to create order. Stock restored.', status_code=500)
    
    # 4. Success -> Clear cart
    order = order_res['data']
    cart_model.clear_cart(user_oid)
    
    return standard_response(
        success=True,
        message='Order created successfully',
        data={
            'order': {
                'id': str(order['_id']),
                'total_price_cents': order['total_price'],
                'status': order['status']
            }
        },
        status_code=201
    )
