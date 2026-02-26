// Checkout Module

let selectedOrder = null;

// Load checkout page
async function loadCheckout() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');

    if (orderId) {
        // Load existing order
        try {
            const response = await api.getOrder(orderId);
            selectedOrder = response.data?.order || response.order;
            displayOrderSummary(selectedOrder);
        } catch (error) {
            console.error('Error loading order:', error);
            showToast('Failed to load order', 'error');
            window.location.href = 'cart.html';
        }
    } else {
        // Load cart for new checkout
        try {
            const cart = await api.getCart();
            if (cart.cart.items.length === 0) {
                window.location.href = 'cart.html';
                return;
            }
            displayCartSummary(cart.cart);
        } catch (error) {
            console.error('Error loading cart:', error);
            showToast('Failed to load cart', 'error');
            window.location.href = 'cart.html';
        }
    }

    setupEventListeners();
}

// Display order summary
function displayOrderSummary(order) {
    const summaryContainer = document.getElementById('order-summary');
    const checkoutForm = document.getElementById('checkout-form');
    const orderSuccess = document.getElementById('order-success');

    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div class="summary-item">
                <h3>Order #${order.id}</h3>
                <span class="summary-item-price">$${order.total_price.toFixed(2)}</span>
            </div>
            <div class="summary-total">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>$${order.total_price.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Shipping</span>
                    <span>$0.00</span>
                </div>
                <div class="total-row total-grand">
                    <span>Total</span>
                    <span>$${order.total_price.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    if (checkoutForm) {
        checkoutForm.style.display = 'none';
    }

    if (orderSuccess) {
        orderSuccess.style.display = 'block';
        document.getElementById('success-order-id').textContent = order.id;
        document.getElementById('success-total').textContent = `$${order.total_price.toFixed(2)}`;
        document.getElementById('success-date').textContent = formatDate(order.created_at);
    }
}

// Display cart summary for checkout
function displayCartSummary(cart) {
    const summaryContainer = document.getElementById('order-summary');
    const checkoutForm = document.getElementById('checkout-form');

    if (summaryContainer) {
        summaryContainer.innerHTML = `
            ${cart.items.map(item => `
                <div class="summary-item">
                    <img src="${item.image_url || 'assets/placeholder.jpg'}" alt="${escapeHtml(item.name)}">
                    <div class="summary-item-info">
                        <h4>${escapeHtml(item.name)}</h4>
                        <p>${item.quantity} x $${item.price.toFixed(2)}</p>
                    </div>
                    <div class="summary-item-price">$${item.total.toFixed(2)}</div>
                </div>
            `).join('')}
            <div class="summary-total">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>$${cart.subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Shipping</span>
                    <span>$0.00</span>
                </div>
                <div class="total-row total-grand">
                    <span>Total</span>
                    <span>$${cart.total.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    if (checkoutForm) {
        checkoutForm.style.display = 'block';
    }
}

// Setup event listeners
function setupEventListeners() {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }

    const paymentMethod = document.getElementById('payment-method');
    if (paymentMethod) {
        paymentMethod.addEventListener('change', togglePaymentFields);
    }
}

// Handle checkout form submission
async function handleCheckout(e) {
    e.preventDefault();

    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const formData = new FormData(e.target);
    const orderData = {
        shipping_address: {
            street: formData.get('street'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip_code: formData.get('zip_code'),
            country: formData.get('country')
        },
        payment_method: formData.get('payment-method'),
        payment_details: {
            card_number: formData.get('card-number'),
            expiry_date: formData.get('expiry-date'),
            cvv: formData.get('cvv'),
            name_on_card: formData.get('name-on-card')
        }
    };

    try {
        const response = await api.checkout();
        showToast('Order placed successfully!', 'success');
        
        // Redirect to order success page
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

// Toggle payment fields based on payment method
function togglePaymentFields(e) {
    const paymentMethod = e.target.value;
    const cardFields = document.getElementById('card-fields');
    const paypalFields = document.getElementById('paypal-fields');

    if (paymentMethod === 'credit_card') {
        cardFields.style.display = 'block';
        paypalFields.style.display = 'none';
    } else if (paymentMethod === 'paypal') {
        cardFields.style.display = 'none';
        paypalFields.style.display = 'block';
    } else {
        cardFields.style.display = 'none';
        paypalFields.style.display = 'none';
    }
}

// Validate checkout form
function validateCheckoutForm() {
    const form = document.getElementById('checkout-form');
    const requiredFields = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showError(field, 'This field is required');
            isValid = false;
        } else {
            hideError(field);
        }
    });

    // Validate card number if credit card is selected
    const paymentMethod = document.getElementById('payment-method').value;
    if (paymentMethod === 'credit_card') {
        const cardNumber = document.getElementById('card-number').value;
        if (!validateCardNumber(cardNumber)) {
            showError(document.getElementById('card-number'), 'Invalid card number');
            isValid = false;
        }
    }

    return isValid;
}

// Validate card number (Luhn algorithm)
function validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

// Print order receipt
function printOrder() {
    window.print();
}

// Download order receipt
function downloadReceipt() {
    const order = selectedOrder;
    if (!order) return;

    const content = `
        Order Receipt
        =============
        
        Order ID: ${order.id}
        Date: ${formatDate(order.created_at)}
        Customer: ${getUser().name}
        
        Items:
        ${order.items.map(item => 
            `${item.name} x ${item.quantity} - $${item.total.toFixed(2)}`
        ).join('\n')}
        
        Total: $${order.total_price.toFixed(2)}
        Status: ${order.status}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order.id}-receipt.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Share order
async function shareOrder() {
    if (!navigator.share) {
        showToast('Sharing not supported on this device', 'error');
        return;
    }

    const order = selectedOrder;
    if (!order) return;

    try {
        await navigator.share({
            title: `Order #${order.id}`,
            text: `My order total is $${order.total_price.toFixed(2)}`,
            url: window.location.href
        });
    } catch (error) {
        console.error('Error sharing:', error);
    }
}

// Initialize checkout module
function initCheckout() {
    loadCheckout();
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadCheckout,
        displayOrderSummary,
        displayCartSummary,
        setupEventListeners,
        handleCheckout,
        togglePaymentFields,
        validateCheckoutForm,
        validateCardNumber,
        printOrder,
        downloadReceipt,
        shareOrder,
        initCheckout
    };
}