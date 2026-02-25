// Authentication Module

// Load authentication buttons based on login status
function loadAuthButtons() {
    const authNav = document.getElementById('auth-nav');
    const user = getUser();
    
    if (user) {
        // User is logged in
        authNav.innerHTML = `
            <li><a href="profile.html">Profile</a></li>
            ${user.role === 'admin' ? '<li><a href="admin.html">Admin</a></li>' : ''}
            <li><button class="btn btn-secondary" onclick="logout()">Logout</button></li>
        `;
    } else {
        // User is not logged in
        authNav.innerHTML = `
            <li><a href="login.html" class="btn btn-secondary">Login</a></li>
            <li><a href="register.html" class="btn btn-primary">Register</a></li>
        `;
    }
}

// Login function
async function login(email, password) {
    try {
        const response = await api.login(email, password);
        
        // Store token and user info
        if (response.success && response.data) {
            api.setToken(response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            showToast('Login successful!', 'success');
            
            // Redirect to appropriate page
            const user = response.data.user;
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            throw new Error(response.error || 'Login failed');
        }
        
        return true;
    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
        return false;
    }
}

// Register function
async function register(name, email, password) {
    try {
        const response = await api.register(name, email, password);
        
        showToast('Registration successful! Please login.', 'success');
        window.location.href = 'login.html';
        
        return true;
    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
        return false;
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        api.clearToken();
        showToast('Logged out successfully', 'info');
        window.location.href = 'index.html';
    }
}

// Check authentication on page load
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token is still valid by making a request
        api.getProfile().catch(() => {
            // Token is invalid, clear it
            api.clearToken();
            loadAuthButtons();
        });
    }
    loadAuthButtons();
}

// Protect admin pages
function protectAdminPage() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    
    const user = getUser();
    if (!user || user.role !== 'admin') {
        showToast('Access denied. Admin privileges required.', 'error');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Password strength indicator
function setupPasswordStrength(passwordInput, strengthIndicator) {
    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const validation = validatePassword(password);
        
        if (strengthIndicator) {
            strengthIndicator.textContent = validation.message;
            strengthIndicator.className = `password-strength ${getStrengthClass(validation.strength)}`;
        }
    });
}

function getStrengthClass(strength) {
    switch (strength) {
        case 0:
        case 1:
            return 'strength-weak';
        case 2:
            return 'strength-medium';
        case 3:
        case 4:
        case 5:
            return 'strength-strong';
        default:
            return '';
    }
}

// Form validation
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        const errorElement = input.parentElement.querySelector('.error-message');
        
        if (!input.value.trim()) {
            showError(input, 'This field is required');
            isValid = false;
        } else if (input.type === 'email' && !validateEmail(input.value)) {
            showError(input, 'Please enter a valid email address');
            isValid = false;
        } else if (input.type === 'password') {
            const validation = validatePassword(input.value);
            if (!validation.isValid && input.name === 'password') {
                showError(input, 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters');
                isValid = false;
            } else {
                hideError(input);
            }
        } else {
            hideError(input);
        }
    });
    
    return isValid;
}

function showError(input, message) {
    const parent = input.parentElement;
    let errorElement = parent.querySelector('.error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        parent.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    input.classList.add('error');
}

function hideError(input) {
    const parent = input.parentElement;
    const errorElement = parent.querySelector('.error-message');
    
    if (errorElement) {
        errorElement.remove();
    }
    input.classList.remove('error');
}

// Auto-logout after session timeout
function setupSessionTimeout() {
    const timeout = 30 * 60 * 1000; // 30 minutes
    
    let timeoutId;
    
    function resetTimeout() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            if (isAuthenticated()) {
                showToast('Session expired. Please login again.', 'error');
                logout();
            }
        }, timeout);
    }
    
    // Reset timeout on user activity
    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keypress', resetTimeout);
    window.addEventListener('click', resetTimeout);
    
    // Initialize timeout
    resetTimeout();
}

// Initialize auth module
function initAuth() {
    // Check authentication status
    checkAuth();
    
    // Setup session timeout
    setupSessionTimeout();
    
    // Add connection listeners
    addConnectionListeners();
    
    // Setup password strength indicators if present
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        const strengthIndicator = input.parentElement.querySelector('.password-strength');
        if (strengthIndicator) {
            setupPasswordStrength(input, strengthIndicator);
        }
    });
    
    // Setup form validation for login/register forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            if (!validateForm(loginForm)) {
                e.preventDefault();
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            if (!validateForm(registerForm)) {
                e.preventDefault();
            }
        });
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadAuthButtons,
        login,
        register,
        logout,
        checkAuth,
        protectAdminPage,
        setupPasswordStrength,
        validateForm,
        showError,
        hideError,
        setupSessionTimeout,
        initAuth
    };
}