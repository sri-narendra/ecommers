from flask import Blueprint, request, send_file
from extensions import mongo, fs
from bson import ObjectId
import gridfs
import io
import os
from werkzeug.utils import secure_filename
from middleware.auth_middleware import admin_required, jwt_required_custom
from utils.helpers import standard_response, validate_oid

bp = Blueprint('images', __name__)

@bp.route('/images/<image_id>', methods=['GET'])
def get_image(image_id):
    """Get image from GridFS (Bug Phase 3: 6)"""
    image_oid = validate_oid(image_id)
    if not image_oid:
        return standard_response(success=False, error='Invalid image ID', status_code=400)
        
    try:
        grid_out = fs.get(image_oid)
        return send_file(
            io.BytesIO(grid_out.read()),
            mimetype=grid_out.content_type,
            download_name=grid_out.filename
        )
    except gridfs.errors.NoFile:
        return standard_response(success=False, error='Image not found', status_code=404)
    except Exception as e:
        return standard_response(success=False, error=str(e), status_code=500)

@bp.route('/images/upload', methods=['POST'])
@jwt_required_custom()
@admin_required()
def upload_image():
    """Upload image to GridFS (admin only) (Bug Phase 2: 10)"""
    if 'image' not in request.files:
        return standard_response(success=False, error='No image file provided', status_code=400)
    
    file = request.files['image']
    if file.filename == '':
        return standard_response(success=False, error='No selected file', status_code=400)
    
    try:
        filename = secure_filename(file.filename)
        # Save to GridFS
        file_id = fs.put(
            file, 
            content_type=file.content_type, 
            filename=filename
        )
        return standard_response(
            success=True,
            message='Image uploaded successfully',
            data={
                'image_id': str(file_id),
                'image_url': f"/api/images/{file_id}"
            },
            status_code=201
        )
    except Exception as e:
        return standard_response(success=False, error=str(e), status_code=500)

@bp.route('/images/<image_id>', methods=['DELETE'])
@jwt_required_custom()
@admin_required()
def delete_image(image_id):
    """Delete image from GridFS (admin only) (Bug Phase 3: 5, 6)"""
    # Bug Phase 3: 5 - Handle DELETE without JSON body
    effective_id = image_id
    if not effective_id or effective_id == "<image_id>":
        effective_id = request.args.get('image_id')
    
    if not effective_id:
        if request.is_json:
            data = request.get_json(silent=True) or {}
            effective_id = data.get('image_id')
            
    if not effective_id:
        return standard_response(success=False, error='Image ID is required', status_code=400)

    image_oid = validate_oid(effective_id)
    if not image_oid:
        return standard_response(success=False, error='Invalid image ID', status_code=400)
    
    try:
        if fs.exists(image_oid):
            fs.delete(image_oid)
            return standard_response(success=True, message='Image deleted successfully')
        return standard_response(success=False, error='Image not found', status_code=404)
    except Exception as e:
        return standard_response(success=False, error=str(e), status_code=500)
