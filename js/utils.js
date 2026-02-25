// Utility Functions

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Validate email
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

// Validate password strength
function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let strength = 0;
    if (minLength) strength++;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumbers) strength++;
    if (hasSpecialChar) strength++;

    return {
        isValid: strength >= 3,
        strength: strength,
        message: getPasswordStrengthMessage(strength)
    };
}

function getPasswordStrengthMessage(strength) {
    switch (strength) {
        case 0:
        case 1:
            return "Very Weak";
        case 2:
            return "Weak";
        case 3:
            return "Medium";
        case 4:
            return "Strong";
        case 5:
            return "Very Strong";
        default:
            return "Invalid";
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add styles
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '5px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px'
    });

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Loading spinner
function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.style.marginLeft = '10px';
    
    Object.assign(spinner.style, {
        width: '20px',
        height: '20px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    });

    // Add keyframes if not exists
    if (!document.getElementById('spin-keyframes')) {
        const style = document.createElement('style');
        style.id = 'spin-keyframes';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    element.appendChild(spinner);
    return spinner;
}

function hideLoading(spinner) {
    if (spinner && spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
    }
}

// Confirm dialog
function confirmAction(message) {
    return new Promise((resolve) => {
        const confirmed = confirm(message);
        resolve(confirmed);
    });
}

// Get file size in human readable format
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validate file type
function validateFileType(file, allowedTypes) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(fileExtension);
}

// Validate file size
function validateFileSize(file, maxSize) {
    return file.size <= maxSize;
}

// Generate unique ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Get user from localStorage
function getUser() {
    try {
        const user = localStorage.getItem('user');
        if (!user || user === 'undefined' || user === 'null') return null;
        return JSON.parse(user);
    } catch (e) {
        console.error('Failed to parse user from storage:', e);
        localStorage.removeItem('user');
        return null;
    }
}

// Check if user is admin
function isAdmin() {
    const user = getUser();
    const token = localStorage.getItem('token');
    return !!token && user && user.role === 'admin';
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        router.navigate('login.html', { redirect: router.getCurrentPage() });
        return false;
    }
    // Revalidate token on every load (Back Button Cache protection)
    api.getProfile().catch(() => {
        api.clearToken();
        router.navigate('login.html');
    });
    return true;
}

// Redirect to home if already authenticated
function preventAuth() {
    if (isAuthenticated()) {
        router.navigate('index.html');
        return false;
    }
    return true;
}

/**
 * Global Loader Management
 */
function showLoader() {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.innerHTML = `
            <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <div class="flex flex-col items-center gap-4">
                    <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p class="text-sm font-bold text-slate-600 dark:text-slate-400">Loading...</p>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.classList.remove('hidden');
}

function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

/**
 * Page Initialization Wrapper
 * Pattern: Show Loader -> Check Guard -> Init Page -> Hide Loader
 */
async function initPage(pageInitFunc) {
    showLoader();
    try {
        const passedGuard = await router.checkGuard();
        if (passedGuard && pageInitFunc) {
            await pageInitFunc();
        }
    } catch (error) {
        console.error('CRITICAL: Page initialization failed:', error);
        // If we fail during checkGuard, something is broken in auth/storage
        if (error.message && error.message.includes('Unexpected token')) {
            console.warn('Corruption detected. Clearing session.');
            api.clearToken();
        }
        showToast('Error loading page. Please refresh.', 'error');
    } finally {
        hideLoader();
    }
}

// Format product category
function formatCategory(category) {
    if (!category) return 'Uncategorized';
    return category.charAt(0).toUpperCase() + category.slice(1);
}

// Get stock status class
function getStockStatusClass(stock) {
    if (stock <= 0) return 'out-of-stock';
    if (stock < 5) return 'low-stock';
    return 'in-stock';
}

// Get stock status text
function getStockStatusText(stock) {
    if (stock <= 0) return 'Out of Stock';
    if (stock < 5) return `Only ${stock} left in stock`;
    return `${stock} in stock`;
}

// Scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Scroll to element
function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy text', 'error');
        return false;
    }
}

// Download file
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Check internet connection
function isOnline() {
    return navigator.onLine;
}

// Add offline/online event listeners
function addConnectionListeners() {
    window.addEventListener('online', () => {
        showToast('Connection restored', 'success');
    });

    window.addEventListener('offline', () => {
        showToast('You are now offline', 'error');
    });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency,
        formatDate,
        debounce,
        validateEmail,
        validatePassword,
        getPasswordStrengthMessage,
        showToast,
        showLoading,
        hideLoading,
        confirmAction,
        formatFileSize,
        validateFileType,
        validateFileSize,
        generateId,
        isAuthenticated,
        getUser,
        isAdmin,
        requireAuth,
        preventAuth,
        formatCategory,
        getStockStatusClass,
        getStockStatusText,
        scrollToTop,
        scrollToElement,
        copyToClipboard,
        downloadFile,
        isOnline,
        addConnectionListeners
    };
}