from flask import Blueprint, request, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from extensions import mongo
import extensions
from models.product_model import Product
from middleware.auth_middleware import admin_required, jwt_required_custom
from utils.helpers import standard_response, serialize_doc, serialize_list, validate_oid
from werkzeug.utils import secure_filename

bp = Blueprint('products', __name__)

def _add_image_url(product):
    """Helper to add full image URL (Bug Phase 3: 7)"""
    if product and product.get('image_id'):
        product['image_url'] = url_for('images.get_image', image_id=product['image_id'], _external=True)
    elif product:
        product['image_url'] = None
    return product

@bp.route('/products', methods=['GET'])
def get_products():
    """Get all products with pagination and filtering"""
    category = request.args.get('category')
    search = request.args.get('search')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 100))  # default higher limit for frontend filtering

    product_model = Product(mongo)

    if search:
        products = product_model.search_products(search)
        if category:
            products = [p for p in products if (p.get('category') or '').lower() == category.lower()]
        total = len(products)
    else:
        products = product_model.get_all_products(category=category)
        total = len(products)

    # Convert price from cents to dollars
    for p in products:
        if 'price' in p and p['price'] is not None:
            p['price'] = p['price'] / 100

    # Process image URLs
    products = [_add_image_url(serialize_doc(p)) for p in products]

    return standard_response(success=True, data={
        'products': products,
        'total': total,
        'page': page,
        'limit': limit
    })

@bp.route('/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product (Bug Phase 3: 6)"""
    product_oid = validate_oid(product_id)
    if not product_oid:
        return standard_response(success=False, error='Invalid product ID', status_code=400)
        
    product_model = Product(mongo)
    product = product_model.get_product_by_id(product_oid)
    if not product:
        return standard_response(success=False, error='Product not found', status_code=404)

    product = dict(product)
    if 'price' in product and product['price'] is not None:
        product['price'] = product['price'] / 100

    return standard_response(success=True, data=_add_image_url(serialize_doc(product)))

@bp.route('/products', methods=['POST'])
@jwt_required_custom()
@admin_required()
def create_product():
    """Add new product (Bug Phase 3: 9)"""
    # Create product accepts either JSON or Form data (for image upload)
    data = {}
    image_id = None
    
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
        if 'price' in data:
            try: data['price'] = float(data['price'])
            except ValueError: pass
        if 'stock' in data:
            try: data['stock'] = int(data['stock'])
            except ValueError: pass
            
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '':
                try:
                    filename = secure_filename(file.filename)
                    image_id = extensions.fs.put(file, filename=filename, content_type=file.content_type)
                except Exception as e:
                    return standard_response(success=False, error=f'Failed to upload image: {str(e)}', status_code=500)

    required_fields = ['name', 'description', 'price', 'stock', 'category']
    for field in required_fields:
        if field not in data:
            return standard_response(success=False, error=f'Field "{field}" is required', status_code=400)
    
    product_model = Product(mongo)
    result = product_model.create_product(
        name=data['name'],
        description=data['description'],
        price=data['price'],
        stock=data['stock'],
        category=data['category'],
        image_id=str(image_id) if image_id else data.get('image_id')
    )
    
    if result['success']:
        return standard_response(success=True, data=_add_image_url(serialize_doc(result['data'])), status_code=201)
    
    return standard_response(success=False, error=result.get('error', 'Failed to create product'), status_code=400)

@bp.route('/products/<product_id>', methods=['PUT'])
@jwt_required_custom()
@admin_required()
def update_product(product_id):
    """Update product (Bug Phase 3: 6, 9)"""
    product_oid = validate_oid(product_id)
    if not product_oid:
        return standard_response(success=False, error='Invalid product ID', status_code=400)
        
    # Preparation
    data = {}
    image_id = None
    
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
        if 'price' in data:
            try: data['price'] = float(data['price'])
            except ValueError: pass
        if 'stock' in data:
            try: data['stock'] = int(data['stock'])
            except ValueError: pass
            
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '':
                try:
                    filename = secure_filename(file.filename)
                    # We could delete old image here, but Product.delete_product handles cleanup of its specific image.
                    # For updates, we just set the new image_id.
                    image_id = extensions.fs.put(file, filename=filename, content_type=file.content_type)
                    data['image_id'] = str(image_id)
                except Exception as e:
                    return standard_response(success=False, error=f'Failed to upload image: {str(e)}', status_code=500)
    
    if not data:
        return standard_response(success=False, error='No data provided', status_code=400)
    
    product_model = Product(mongo)
    result = product_model.update_product(product_oid, data)
    
    if result['success']:
        return standard_response(success=True, message='Product updated successfully')
    
    status_code = 404 if result.get('error') == 'product_not_found' else 400
    return standard_response(success=False, error=result.get('error', 'Update failed'), status_code=status_code)

@bp.route('/products/<product_id>', methods=['DELETE'])
@jwt_required_custom()
@admin_required()
def delete_product(product_id):
    """Delete product (Bug Phase 3: 5, 6)"""
    # Bug Phase 3: 5 - Handle DELETE without body
    effective_id = product_id
    if not effective_id or effective_id == "<product_id>":
        effective_id = request.args.get('product_id')
        
    product_oid = validate_oid(effective_id)
    if not product_oid:
        return standard_response(success=False, error='Invalid product ID', status_code=400)
        
    product_model = Product(mongo)
    # delete_product in model handles both DB entry and GridFS cleanup
    if product_model.delete_product(product_oid):
        return standard_response(success=True, message='Product deleted successfully')
    
    return standard_response(success=False, error='Product not found or delete failed', status_code=404)

@bp.route('/products/<product_id>/stock', methods=['PUT'])
@jwt_required_custom()
@admin_required()
def update_stock(product_id):
    """Update stock directly (admin only) (Bug Phase 3: 6, 9)"""
    product_oid = validate_oid(product_id)
    if not product_oid:
        return standard_response(success=False, error='Invalid product ID', status_code=400)
        
    if not request.is_json:
        return standard_response(success=False, error='Content-Type must be application/json', status_code=400)
        
    data = request.get_json()
    stock = data.get('stock')
    
    if stock is None:
        return standard_response(success=False, error='Stock value is required', status_code=400)
        
    product_model = Product(mongo)
    result = product_model.update_stock(product_oid, stock)
    
    if result['success']:
        return standard_response(success=True, message='Stock updated successfully')
    
    return standard_response(success=False, error=result.get('error', 'Update failed'), status_code=404)
