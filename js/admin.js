// Admin Module

// Load admin dashboard
async function loadAdminDashboard() {
    if (!protectAdminPage()) return;

    try {
        const response = await api.getDashboard();
        const dashboard = response.data?.dashboard || response.dashboard;

        displayDashboardStats(dashboard);
        displayLowStockProducts(dashboard.low_stock_products);
        
        return dashboard;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Failed to load dashboard', 'error');
        return null;
    }
}

// Display dashboard statistics
function displayDashboardStats(dashboard) {
    const statsContainer = document.getElementById('stats-grid');

    if (!statsContainer) return;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
                <h3>${dashboard.total_users}</h3>
                <p>Total Users</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
                <h3>${dashboard.total_products}</h3>
                <p>Total Products</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🛒</div>
            <div class="stat-info">
                <h3>${dashboard.total_orders}</h3>
                <p>Total Orders</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
                <h3>$${dashboard.total_revenue.toFixed(2)}</h3>
                <p>Total Revenue</p>
            </div>
        </div>
        <div class="stat-card danger">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
                <h3>${dashboard.low_stock_count}</h3>
                <p>Low Stock Products</p>
            </div>
        </div>
    `;
}

// Display low stock products
function displayLowStockProducts(products) {
    const lowStockContainer = document.getElementById('low-stock-list');

    if (!lowStockContainer) return;

    if (products.length === 0) {
        lowStockContainer.innerHTML = `
            <div class="empty-state">
                <h3>No low stock products</h3>
                <p>All products have sufficient stock</p>
            </div>
        `;
        return;
    }

    lowStockContainer.innerHTML = products.map(product => `
        <div class="low-stock-item">
            <div>
                <div class="product-name">${escapeHtml(product.name)}</div>
                <div class="product-category">${escapeHtml(product.category)}</div>
            </div>
            <div class="stock-count">Only ${product.stock} left</div>
        </div>
    `).join('');
}

// Load admin products
async function loadAdminProducts() {
    if (!protectAdminPage()) return;

    try {
        const response = await api.getProducts();
        const products = response.data?.products || response.products;

        displayAdminProducts(products);
        setupProductEventListeners();
        
        return products;
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
        return [];
    }
}

// Display admin products
function displayAdminProducts(products) {
    const tbody = document.getElementById('products-table-body');

    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No products found.</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>
                <img src="${product.image_url || 'assets/placeholder.jpg'}" alt="${escapeHtml(product.name)}" class="product-thumb">
            </td>
            <td>${escapeHtml(product.name)}</td>
            <td>${escapeHtml(product.category)}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>
                <span class="stock-count ${getStockStatusClass(product.stock)}">${getStockStatusText(product.stock)}</span>
            </td>
            <td>${formatDate(product.created_at)}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editProduct('${product._id}')">Edit</button>
                <button class="btn btn-primary btn-sm" onclick="updateStock('${product._id}')">Update Stock</button>
                ${product.stock <= 0 ? `<button class="btn btn-success btn-sm" onclick="restockProduct('${product._id}')">Restock</button>` : ''}
                <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product._id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Load admin orders
async function loadAdminOrders() {
    if (!protectAdminPage()) return;

    try {
        const response = await api.getAllOrders();
        const orders = response.data?.orders || response.orders;

        displayAdminOrders(orders);
        setupOrderEventListeners();
        
        return orders;
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Failed to load orders', 'error');
        return [];
    }
}

// Display admin orders
function displayAdminOrders(orders) {
    const tbody = document.getElementById('orders-table-body');

    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No orders found.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>User ID: ${order.user_id}</td>
            <td>$${order.total_price.toFixed(2)}</td>
            <td><span class="status-badge ${order.status}">${order.status.toUpperCase()}</span></td>
            <td><span class="status-badge ${order.delivery_status}">${order.delivery_status.toUpperCase()}</span></td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="viewOrderDetails('${order.id}')">View Details</button>
                <button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${order.id}', '${order.status}')">Update Status</button>
                ${order.status !== 'cancelled' ? `<button class="btn btn-danger btn-sm" onclick="cancelOrder('${order.id}')">Cancel</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// Load admin deliveries
async function loadAdminDeliveries() {
    if (!protectAdminPage()) return;

    try {
        const response = await api.getAllOrders();
        const orders = response.data?.orders || response.orders;

        // Filter to show only orders that need delivery management
        const deliveryOrders = orders.filter(order => 
            order.status === 'shipped' || order.status === 'confirmed'
        );

        displayAdminDeliveries(deliveryOrders);
        setupDeliveryEventListeners();
        
        return deliveryOrders;
    } catch (error) {
        console.error('Error loading deliveries:', error);
        showToast('Failed to load deliveries', 'error');
        return [];
    }
}

// Display admin deliveries
function displayAdminDeliveries(orders) {
    const tbody = document.getElementById('deliveries-table-body');

    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No deliveries found.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>User ID: ${order.user_id}</td>
            <td>$${order.total_price.toFixed(2)}</td>
            <td><span class="status-badge ${order.status}">${order.status.toUpperCase()}</span></td>
            <td><span class="status-badge ${order.delivery_status}">${order.delivery_status.toUpperCase()}</span></td>
            <td>${order.tracking_number || 'Not assigned'}</td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="assignTracking('${order.id}')">Assign Tracking</button>
                <button class="btn btn-secondary btn-sm" onclick="updateDeliveryStatus('${order.id}', '${order.delivery_status}')">Update Status</button>
                ${order.delivery_status === 'out_for_delivery' ? `<button class="btn btn-success btn-sm" onclick="markDelivered('${order.id}')">Mark Delivered</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// Edit product
function editProduct(productId) {
    // Implementation would show edit form
    showToast('Edit product functionality', 'info');
}

// Update stock
function updateStock(productId) {
    const newStock = prompt('Enter new stock quantity:');
    
    if (newStock === null) return;

    const quantity = parseInt(newStock);
    if (isNaN(quantity) || quantity < 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    updateProductStock(productId, quantity);
}

// Restock product
function restockProduct(productId) {
    const quantity = prompt('Enter quantity to add:');
    
    if (quantity === null) return;

    const addQuantity = parseInt(quantity);
    if (isNaN(addQuantity) || addQuantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    // Get current stock and add to it
    getProduct(productId).then(product => {
        if (product) {
            const newStock = product.stock + addQuantity;
            updateProductStock(productId, newStock);
        }
    });
}

// Update product stock
async function updateProductStock(productId, stock) {
    try {
        await api.updateStock(productId, stock);
        showToast('Stock updated successfully', 'success');
        loadAdminProducts(); // Refresh product list
    } catch (error) {
        console.error('Error updating stock:', error);
        showToast('Failed to update stock', 'error');
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        await api.deleteProduct(productId);
        showToast('Product deleted successfully', 'success');
        loadAdminProducts(); // Refresh product list
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product', 'error');
    }
}

// Update order status
function updateOrderStatus(orderId, currentStatus) {
    const newStatus = prompt(
        `Current status: ${currentStatus}\n\nAvailable statuses:\n- pending\n- confirmed\n- shipped\n- delivered\n- cancelled\n\nEnter new status:`,
        currentStatus
    );

    if (newStatus === null) return;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
        showToast('Invalid status. Please enter one of: pending, confirmed, shipped, delivered, cancelled', 'error');
        return;
    }

    updateOrder(orderId, 'status', newStatus);
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    updateOrder(orderId, 'status', 'cancelled');
}

// Update order
async function updateOrder(orderId, field, value) {
    try {
        let endpoint = '';
        if (field === 'status') {
            endpoint = `/api/admin/orders/${orderId}/status`;
        }

        await api.put(endpoint, {
            [field]: value
        });
        
        showToast('Order updated successfully!', 'success');
        loadAdminOrders();
    } catch (error) {
        console.error('Error updating order:', error);
        showToast('Error updating order: ' + error.message, 'error');
    }
}

// Assign tracking
function assignTracking(orderId) {
    const trackingNumber = prompt('Enter tracking number:');
    
    if (trackingNumber === null || trackingNumber.trim() === '') {
        return;
    }

    updateTracking(orderId, trackingNumber.trim());
}

// Update delivery status
function updateDeliveryStatus(orderId, currentStatus) {
    const newStatus = prompt(
        `Current delivery status: ${currentStatus}\n\nAvailable statuses:\n- processing\n- out_for_delivery\n- delivered\n\nEnter new status:`,
        currentStatus
    );

    if (newStatus === null) return;

    const validStatuses = ['processing', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(newStatus)) {
        showToast('Invalid delivery status. Please enter one of: processing, out_for_delivery, delivered', 'error');
        return;
    }

    updateDelivery(orderId, newStatus);
}

// Mark delivered
function markDelivered(orderId) {
    if (!confirm('Mark this order as delivered?')) {
        return;
    }

    updateDelivery(orderId, 'delivered');
}

// Update tracking
async function updateTracking(orderId, trackingNumber) {
    try {
        await api.updateTracking(orderId, trackingNumber);
        showToast('Tracking number updated successfully!', 'success');
        loadAdminDeliveries();
    } catch (error) {
        console.error('Error updating tracking:', error);
        showToast('Error updating tracking: ' + error.message, 'error');
    }
}

// Update delivery
async function updateDelivery(orderId, deliveryStatus) {
    try {
        await api.updateDeliveryStatus(orderId, deliveryStatus);
        showToast('Delivery status updated successfully!', 'success');
        loadAdminDeliveries();
    } catch (error) {
        console.error('Error updating delivery status:', error);
        showToast('Error updating delivery status: ' + error.message, 'error');
    }
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const response = await api.getOrder(orderId);
        const order = response.data?.order || response.order;
        const items = response.data?.items || response.items || (order && order.items) || [];

        const modal = document.getElementById('order-details-modal');
        const content = document.getElementById('order-details-content');

        if (modal && content) {
            content.innerHTML = `
                <div class="order-info">
                    <h3>Order Information</h3>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>User ID:</strong> ${order.user_id}</p>
                    <p><strong>Total:</strong> $${order.total_price.toFixed(2)}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span></p>
                    <p><strong>Delivery Status:</strong> <span class="status-badge ${order.delivery_status}">${order.delivery_status.toUpperCase()}</span></p>
                    <p><strong>Tracking Number:</strong> ${order.tracking_number || 'Not assigned'}</p>
                    <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
                </div>
                
                <div class="order-items">
                    <h3>Items</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${escapeHtml(item.name)}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${item.price_at_purchase.toFixed(2)}</td>
                                    <td>$${(item.price_at_purchase * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showToast('Error loading order details: ' + error.message, 'error');
    }
}

// Setup event listeners for admin pages
function setupProductEventListeners() {
    // Search products
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchProducts(e.target.value);
        });
    }

    // Filter products
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filterProducts(e.target.value);
        });
    }
}

function setupOrderEventListeners() {
    // Search orders
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchOrders(e.target.value);
        });
    }

    // Filter orders
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filterOrders(e.target.value);
        });
    }
}

function setupDeliveryEventListeners() {
    // Search deliveries
    const searchInput = document.getElementById('delivery-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchDeliveries(e.target.value);
        });
    }

    // Filter deliveries
    const statusFilter = document.getElementById('delivery-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filterDeliveries(e.target.value);
        });
    }
}

// Search functions
function searchProducts(query) {
    // Implementation would filter products
}

function filterProducts(status) {
    // Implementation would filter products by status
}

function searchOrders(query) {
    // Implementation would filter orders
}

function filterOrders(status) {
    // Implementation would filter orders by status
}

function searchDeliveries(query) {
    // Implementation would filter deliveries
}

function filterDeliveries(status) {
    // Implementation would filter deliveries by status
}

// Close order details modal
function closeOrderDetails() {
    const modal = document.getElementById('order-details-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize admin module
function initAdmin() {
    // Load appropriate admin page based on URL
    const path = window.location.pathname;
    
    if (path.includes('admin.html')) {
        loadAdminDashboard();
    } else if (path.includes('admin-products.html')) {
        loadAdminProducts();
    } else if (path.includes('admin-orders.html')) {
        loadAdminOrders();
    } else if (path.includes('admin-deliveries.html')) {
        loadAdminDeliveries();
    }

    // Setup common event listeners
    window.onclick = function(event) {
        const modal = document.getElementById('order-details-modal');
        if (modal && event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadAdminDashboard,
        displayDashboardStats,
        displayLowStockProducts,
        loadAdminProducts,
        displayAdminProducts,
        loadAdminOrders,
        displayAdminOrders,
        loadAdminDeliveries,
        displayAdminDeliveries,
        editProduct,
        updateStock,
        restockProduct,
        updateProductStock,
        deleteProduct,
        updateOrderStatus,
        cancelOrder,
        updateOrder,
        assignTracking,
        updateDeliveryStatus,
        markDelivered,
        updateTracking,
        updateDelivery,
        viewOrderDetails,
        setupProductEventListeners,
        setupOrderEventListeners,
        setupDeliveryEventListeners,
        searchProducts,
        filterProducts,
        searchOrders,
        filterOrders,
        searchDeliveries,
        filterDeliveries,
        closeOrderDetails,
        initAdmin
    };
}