// API Client

class APIClient {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.token = localStorage.getItem('token');
    }

    getBaseURL() {
        // In production, this should be your Render backend URL
        // In development, use localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        } else {
            // Replace with your actual Render backend URL
            return 'https://ecommers-yt40.onrender.com';
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    getHeaders(includeAuth = true, contentType = 'application/json') {
        const headers = {
            'Content-Type': contentType
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async handleResponse(response) {
        let data;
        
        try {
            data = await response.json();
        } catch (e) {
            // If response is not JSON, try text
            data = { message: await response.text() };
        }

        if (!response.ok) {
            const error = new Error(data.message || `HTTP error! status: ${response.status}`);
            error.status = response.status;
            error.response = data;
            throw error;
        }

        return data;
    }

    async get(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        return this.handleResponse(response);
    }

    async post(endpoint, data, options = {}) {
        const headers = this.getHeaders(true, options.contentType || 'application/json');
        
        let body;
        if (options.contentType === 'multipart/form-data') {
            body = data; // FormData object
        } else {
            body = JSON.stringify(data);
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: body
        });

        return this.handleResponse(response);
    }

    async put(endpoint, data, options = {}) {
        const headers = this.getHeaders(true, options.contentType || 'application/json');
        
        let body;
        if (options.contentType === 'multipart/form-data') {
            body = data; // FormData object
        } else {
            body = JSON.stringify(data);
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: headers,
            body: body
        });

        return this.handleResponse(response);
    }

    async delete(endpoint, data = null) {
        const headers = this.getHeaders();
        let body = null;

        if (data) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(data);
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE',
            headers: headers,
            body: body
        });

        return this.handleResponse(response);
    }

    // Auth methods
    async login(email, password) {
        return this.post('/api/login', { email, password });
    }

    async register(name, email, password) {
        return this.post('/api/register', { name, email, password });
    }

    async getProfile() {
        return this.get('/api/profile');
    }

    async updateProfile(data) {
        return this.put('/api/profile', data);
    }

    async changePassword(currentPassword, newPassword) {
        return this.put('/api/change-password', {
            current_password: currentPassword,
            new_password: newPassword
        });
    }

    // Product methods
    async getProducts(category = null, limit = null, skip = null) {
        let url = '/api/products';
        const params = new URLSearchParams();

        if (category) params.append('category', category);
        if (limit) params.append('limit', limit);
        if (skip) params.append('skip', skip);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        return this.get(url);
    }

    async getProduct(id) {
        return this.get(`/api/products/${id}`);
    }

    async searchProducts(query) {
        return this.get(`/api/products/search?q=${encodeURIComponent(query)}`);
    }

    async createProduct(data) {
        return this.post('/api/products', data, { contentType: 'multipart/form-data' });
    }

    async updateProduct(id, data) {
        return this.put(`/api/products/${id}`, data, { contentType: 'multipart/form-data' });
    }

    async deleteProduct(id) {
        return this.delete(`/api/products/${id}`);
    }

    async updateStock(id, stock) {
        return this.put(`/api/products/${id}/stock`, { stock });
    }

    async getLowStockProducts(threshold = 5) {
        return this.get(`/api/products/low-stock?threshold=${threshold}`);
    }

    // Cart methods
    async getCart() {
        return this.get('/api/cart');
    }

    async addToCart(productId, quantity) {
        return this.post('/api/cart/add', { product_id: productId, quantity });
    }

    async updateCartItem(productId, quantity) {
        return this.put('/api/cart/update', { product_id: productId, quantity });
    }

    async removeFromCart(productId) {
        return this.delete('/api/cart/remove', { product_id: productId });
    }

    async clearCart() {
        return this.delete('/api/cart/clear');
    }

    async checkout() {
        return this.post('/api/cart/checkout', {});
    }

    // Order methods
    async getOrders() {
        return this.get('/api/orders');
    }

    async getOrder(id) {
        return this.get(`/api/orders/${id}`);
    }

    async cancelOrder(id) {
        return this.put(`/api/orders/${id}/cancel`, {});
    }

    async updateTracking(id, trackingNumber) {
        return this.put(`/api/admin/orders/${id}/tracking`, { tracking_number: trackingNumber });
    }

    async updateDeliveryStatus(id, deliveryStatus) {
        return this.put(`/api/admin/orders/${id}/delivery-status`, { delivery_status: deliveryStatus });
    }

    // Admin methods
    async getDashboard() {
        return this.get('/api/admin/dashboard');
    }

    async getAllUsers() {
        return this.get('/api/admin/users');
    }

    async getAllOrders() {
        return this.get('/api/admin/orders');
    }

    async updateOrderStatus(id, status) {
        return this.put(`/api/admin/orders/${id}/status`, { status });
    }

    async getOrdersByStatus(status) {
        return this.get(`/api/admin/orders/status/${status}`);
    }

    async getOrdersByDeliveryStatus(deliveryStatus) {
        return this.get(`/api/admin/orders/delivery/${deliveryStatus}`);
    }

    // Image methods
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        return this.post('/api/images/upload', formData, { contentType: 'multipart/form-data' });
    }

    async deleteImage(id) {
        return this.delete(`/api/images/${id}`);
    }
}

// Create global API instance
const api = new APIClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIClient, api };
}
