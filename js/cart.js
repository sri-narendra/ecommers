// Cart Module

// Load cart items
async function loadCart() {
    try {
        const response = await api.getCart();
        const cart = response.data?.cart || response.cart;

        displayCartItems(cart.items);
        updateCartTotal(cart.total);
        updateCartCount();
        
        return cart;
    } catch (error) {
        console.error('Error loading cart:', error);
        handleCartError(error);
        return null;
    }
}

// Display cart items
function displayCartItems(items) {
    const cartItemsList = document.getElementById('cart-items-list');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-items');

    if (!cartItemsList) return;

    if (items.length === 0) {
        cartContent.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }

    cartContent.style.display = 'block';
    emptyCart.style.display = 'none';

    cartItemsList.innerHTML = items.map(item => {
        const isLowStock = item.stock < item.quantity;
        const maxQuantity = Math.max(0, item.stock);
        
        return `
            <div class="cart-item" data-product-id="${item.product_id}">
                <div class="cart-item-info">
                    <img src="${item.image_url || 'assets/placeholder.jpg'}" alt="${escapeHtml(item.name)}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4>${escapeHtml(item.name)}</h4>
                        ${isLowStock ? '<span class="low-stock-warning">Low stock available</span>' : ''}
                    </div>
                </div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <input type="number" 
                           value="${item.quantity}" 
                           min="1" 
                           max="${maxQuantity}"
                           data-product-id="${item.product_id}"
                           class="quantity-input">
                </div>
                <div class="cart-item-total">$${item.total.toFixed(2)}</div>
                <div class="cart-item-actions">
                    <button class="btn btn-danger btn-sm" onclick="removeFromCart('${item.product_id}')">
                        Remove
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners for quantity inputs
    const quantityInputs = cartItemsList.querySelectorAll('.quantity-input');
    quantityInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const productId = e.target.dataset.productId;
            const quantity = parseInt(e.target.value);
            updateCartItem(productId, quantity);
        });
    });
}

// Update cart total
function updateCartTotal(total) {
    const totalElement = document.getElementById('cart-total-amount');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
}

// Update cart count in header
async function updateCartCount() {
    if (!isAuthenticated()) return;

    try {
        const cart = await api.getCart();
        const cartCount = cart.cart.items.reduce((total, item) => total + item.quantity, 0);
        
        // Update cart count in header
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
            cartCountElement.style.display = cartCount > 0 ? 'inline' : 'none';
        }
    } catch (error) {
        // Cart might be empty
    }
}

// Update cart item quantity
async function updateCartItem(productId, quantity) {
    try {
        await api.updateCartItem(productId, quantity);
        showToast('Cart updated', 'success');
        loadCart(); // Reload to update totals
    } catch (error) {
        console.error('Error updating cart item:', error);
        if (error.status === 400) {
            showToast('Cannot update quantity: ' + error.message, 'error');
        } else {
            showToast('Failed to update cart item', 'error');
        }
        loadCart(); // Reload to sync state
    }
}

// Remove item from cart
async function removeFromCart(productId) {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
        return;
    }

    try {
        await api.removeFromCart(productId);
        showToast('Item removed from cart', 'success');
        loadCart();
    } catch (error) {
        console.error('Error removing item from cart:', error);
        showToast('Failed to remove item from cart', 'error');
        loadCart(); // Reload to sync state
    }
}

// Clear entire cart
async function clearCart() {
    if (!confirm('Are you sure you want to clear your cart?')) {
        return;
    }

    try {
        await api.clearCart();
        showToast('Cart cleared', 'success');
        loadCart();
    } catch (error) {
        console.error('Error clearing cart:', error);
        showToast('Failed to clear cart', 'error');
    }
}

// Proceed to checkout
async function checkout() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await api.checkout();
        showToast('Order placed successfully!', 'success');
        const orderObj = response.data?.order || response.order;
        window.location.href = `checkout.html?order_id=${orderObj?.id || orderObj?._id}`;
    } catch (error) {
        console.error('Error during checkout:', error);
        if (error.status === 400) {
            showToast('Checkout failed: ' + error.message, 'error');
        } else {
            showToast('Failed to complete checkout', 'error');
        }
    }
}

// Handle cart errors
function handleCartError(error) {
    const errorDiv = document.getElementById('cart-error');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-items');

    if (errorDiv && error.status === 401) {
        cartContent.style.display = 'none';
        emptyCart.style.display = 'none';
        errorDiv.style.display = 'block';
    } else {
        cartContent.style.display = 'none';
        emptyCart.style.display = 'block';
    }
}

// Get cart summary
async function getCartSummary() {
    try {
        const cart = await api.getCart();
        return {
            items: cart.cart.items,
            total: cart.cart.total,
            itemCount: cart.cart.items.reduce((total, item) => total + item.quantity, 0)
        };
    } catch (error) {
        return { items: [], total: 0, itemCount: 0 };
    }
}

// Validate cart before checkout
async function validateCart() {
    try {
        const cart = await api.getCart();
        
        // Check if cart is empty
        if (cart.cart.items.length === 0) {
            showToast('Your cart is empty', 'error');
            return false;
        }

        // Check stock availability
        for (const item of cart.cart.items) {
            const product = await api.getProduct(item.product_id);
            if (product && product.stock < item.quantity) {
                showToast(`Insufficient stock for ${item.name}. Available: ${product.stock}`, 'error');
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error validating cart:', error);
        showToast('Failed to validate cart', 'error');
        return false;
    }
}

// Add item to cart with validation
async function addToCart(productId, quantity = 1) {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        // Check if product exists and has stock
        const product = await api.getProduct(productId);
        if (!product) {
            showToast('Product not found', 'error');
            return false;
        }

        if (product.stock < quantity) {
            showToast(`Insufficient stock. Available: ${product.stock}`, 'error');
            return false;
        }

        await api.addToCart(productId, quantity);
        showToast('Product added to cart!', 'success');
        
        // Update cart count
        updateCartCount();
        
        return true;
    } catch (error) {
        console.error('Error adding to cart:', error);
        if (error.status === 400) {
            showToast(error.message || 'Cannot add more items than available stock', 'error');
        } else {
            showToast('Failed to add product to cart', 'error');
        }
        return false;
    }
}

// Initialize cart module
function initCart() {
    // Load cart on page load
    if (document.getElementById('cart-items-list')) {
        loadCart();
    }
    
    // Update cart count on page load
    if (isAuthenticated()) {
        updateCartCount();
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadCart,
        displayCartItems,
        updateCartTotal,
        updateCartCount,
        updateCartItem,
        removeFromCart,
        clearCart,
        checkout,
        getCartSummary,
        validateCart,
        addToCart,
        initCart
    };
}