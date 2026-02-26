from flask import Flask, jsonify, request
from datetime import datetime, timezone
from config import Config
from extensions import init_extensions, mongo
from routes import (
    auth_routes,
    product_routes, 
    cart_routes,
    order_routes,
    admin_routes,
    image_routes
)

def create_app():
    """Application factory function"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    init_extensions(app)
    
    # Setup database (indexes, etc.)
    from extensions import setup_database
    setup_database(app)
    
    # Register blueprints
    app.register_blueprint(auth_routes.bp, url_prefix='/api')
    app.register_blueprint(product_routes.bp, url_prefix='/api')
    app.register_blueprint(cart_routes.bp, url_prefix='/api')
    app.register_blueprint(order_routes.bp, url_prefix='/api')
    app.register_blueprint(admin_routes.bp, url_prefix='/api')
    app.register_blueprint(image_routes.bp, url_prefix='/api')
    
    # Set max content length (Bug Phase 2: 10)
    app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
    
    # Health check API
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'mongodb': 'connected' if mongo.db else 'disconnected',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })

    # Diagnostic logging (only if DEBUG is True)
    @app.before_request
    def log_request_headers():
        if app.debug:
            app.logger.info(f"Method: {request.method} | Path: {request.path} | Origin: {request.headers.get('Origin')}")

    # Render Root Health Check
    @app.route('/')
    def index():
        return jsonify({
            'status': 'online',
            'message': 'E-commerce backend is live.'
        })

    from werkzeug.exceptions import HTTPException

    # Global error handler to ensure CORS headers are returned on errors
    @app.errorhandler(Exception)
    def handle_exception(e):
        if isinstance(e, HTTPException):
            return e # Let Flask natively handle 404s, 502s, etc with proper headers
        app.logger.error(f"Unhandled Exception: {str(e)}")
        response = jsonify({
            'success': False,
            'error': str(e) if app.debug else 'Internal Server Error'
        })
        response.status_code = 500
        return response

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=Config.DEBUG)
