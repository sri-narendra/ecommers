// Profile Module

// Load user profile
async function loadProfile() {
    try {
        const response = await api.getProfile();
        const user = response.user;

        displayUserProfile(user);
        loadUserOrders();
        
        return user;
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile', 'error');
        return null;
    }
}

// Display user profile
function displayUserProfile(user) {
    const profileInfo = document.getElementById('profile-info');
    const editForm = document.getElementById('edit-form');
    const passwordForm = document.getElementById('password-form');

    if (profileInfo) {
        profileInfo.innerHTML = `
            <div class="info-group">
                <label>Name</label>
                <span>${escapeHtml(user.name)}</span>
            </div>
            <div class="info-group">
                <label>Email</label>
                <span>${escapeHtml(user.email)}</span>
            </div>
            <div class="info-group">
                <label>Role</label>
                <span><span class="role-badge">${user.role}</span></span>
            </div>
            <div class="info-group">
                <label>Member Since</label>
                <span>${formatDate(user.created_at)}</span>
            </div>
        `;
    }

    if (editForm) {
        editForm.innerHTML = `
            <h2>Edit Profile</h2>
            <form id="profile-edit-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-name">Name</label>
                        <input type="text" id="edit-name" name="name" value="${escapeHtml(user.name)}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-email">Email</label>
                        <input type="email" id="edit-email" name="email" value="${escapeHtml(user.email)}" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Update Profile</button>
                    <button type="button" class="btn btn-secondary" onclick="cancelEdit()">Cancel</button>
                </div>
            </form>
        `;
    }

    if (passwordForm) {
        passwordForm.innerHTML = `
            <h2>Change Password</h2>
            <form id="password-change-form">
                <div class="form-group">
                    <label for="current-password">Current Password</label>
                    <input type="password" id="current-password" name="current_password" required>
                </div>
                <div class="form-group">
                    <label for="new-password">New Password</label>
                    <input type="password" id="new-password" name="new_password" required>
                    <div class="password-strength" id="password-strength"></div>
                </div>
                <div class="form-group">
                    <label for="confirm-password">Confirm New Password</label>
                    <input type="password" id="confirm-password" name="confirm_password" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Change Password</button>
                    <button type="button" class="btn btn-secondary" onclick="cancelPasswordChange()">Cancel</button>
                </div>
            </form>
        `;

        // Setup password strength indicator
        const passwordInput = document.getElementById('new-password');
        const strengthIndicator = document.getElementById('password-strength');
        if (passwordInput && strengthIndicator) {
            setupPasswordStrength(passwordInput, strengthIndicator);
        }
    }
}

// Load user orders
async function loadUserOrders() {
    try {
        const response = await api.getOrders();
        const orders = response.orders;

        displayUserOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Failed to load orders', 'error');
    }
}

// Display user orders
function displayUserOrders(orders) {
    const ordersList = document.getElementById('orders-list');

    if (!ordersList) return;

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <h3>No orders found</h3>
                <p>Start shopping to see your orders here</p>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <span class="order-id">Order #${order.id}</span>
                    <span class="order-date">${formatDate(order.created_at)}</span>
                </div>
                <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-details">
                <div>
                    <strong>Total:</strong> $${order.total_price.toFixed(2)}
                </div>
                <div>
                    <strong>Items:</strong> ${order.items.length}
                </div>
                <div>
                    <strong>Delivery Status:</strong> ${order.delivery_status}
                </div>
                ${order.tracking_number ? `<div><strong>Tracking:</strong> ${order.tracking_number}</div>` : ''}
            </div>
            <div class="view-order-actions">
                <button class="btn btn-secondary btn-sm" onclick="viewOrderDetails('${order.id}')">View Details</button>
                ${order.status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="cancelOrder('${order.id}')">Cancel Order</button>` : ''}
            </div>
        </div>
    `).join('');
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const response = await api.getOrder(orderId);
        const order = response.order;
        const items = response.items;

        // Create modal or redirect to order page
        const modal = document.getElementById('order-details-modal');
        const content = document.getElementById('order-details-content');

        if (modal && content) {
            content.innerHTML = `
                <div class="order-info">
                    <h3>Order Information</h3>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Total:</strong> $${order.total_price.toFixed(2)}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span></p>
                    <p><strong>Delivery Status:</strong> <span class="status-badge ${order.delivery_status}">${order.delivery_status.toUpperCase()}</span></p>
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
        } else {
            window.location.href = `checkout.html?order_id=${order.id}`;
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showToast('Failed to load order details', 'error');
    }
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    try {
        await api.cancelOrder(orderId);
        showToast('Order cancelled successfully', 'success');
        loadUserOrders(); // Refresh orders list
    } catch (error) {
        console.error('Error cancelling order:', error);
        showToast('Failed to cancel order', 'error');
    }
}

// Edit profile
async function editProfile() {
    const editForm = document.getElementById('edit-form');
    const profileInfo = document.getElementById('profile-info');

    if (editForm) {
        editForm.style.display = 'block';
    }
    if (profileInfo) {
        profileInfo.style.display = 'none';
    }
}

// Cancel edit
function cancelEdit() {
    const editForm = document.getElementById('edit-form');
    const profileInfo = document.getElementById('profile-info');

    if (editForm) {
        editForm.style.display = 'none';
    }
    if (profileInfo) {
        profileInfo.style.display = 'block';
    }
}

// Save profile changes
async function saveProfile() {
    const form = document.getElementById('profile-edit-form');
    if (!form) return;

    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email')
    };

    try {
        const response = await api.updateProfile(data);
        localStorage.setItem('user', JSON.stringify(response.user));
        showToast('Profile updated successfully', 'success');
        cancelEdit();
        displayUserProfile(response.user);
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Failed to update profile', 'error');
    }
}

// Change password
async function changePassword() {
    const form = document.getElementById('password-change-form');
    if (!form) return;

    const formData = new FormData(form);
    const currentPassword = formData.get('current_password');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
        showToast('Password does not meet strength requirements', 'error');
        return;
    }

    try {
        await api.changePassword(currentPassword, newPassword);
        showToast('Password changed successfully', 'success');
        cancelPasswordChange();
    } catch (error) {
        console.error('Error changing password:', error);
        showToast('Failed to change password', 'error');
    }
}

// Cancel password change
function cancelPasswordChange() {
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.style.display = 'none';
    }
}

// Close order details modal
function closeOrderDetails() {
    const modal = document.getElementById('order-details-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize profile module
function initProfile() {
    if (document.getElementById('profile-info')) {
        loadProfile();
    }

    // Setup event listeners
    const editBtn = document.getElementById('edit-profile-btn');
    const saveBtn = document.getElementById('save-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const savePasswordBtn = document.getElementById('save-password-btn');
    const cancelPasswordBtn = document.getElementById('cancel-password-btn');

    if (editBtn) editBtn.addEventListener('click', editProfile);
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEdit);
    if (changePasswordBtn) changePasswordBtn.addEventListener('click', changePassword);
    if (savePasswordBtn) savePasswordBtn.addEventListener('click', changePassword);
    if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', cancelPasswordChange);

    // Close modal when clicking outside
    const modal = document.getElementById('order-details-modal');
    if (modal) {
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadProfile,
        displayUserProfile,
        loadUserOrders,
        displayUserOrders,
        viewOrderDetails,
        cancelOrder,
        editProfile,
        cancelEdit,
        saveProfile,
        changePassword,
        cancelPasswordChange,
        closeOrderDetails,
        initProfile
    };
}