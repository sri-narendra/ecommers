/**
 * Router - Centralized Routing & Navigation Logic
 */

const ROUTES = {
    public: ['index.html', 'products.html', 'product-details.html', 'order-success.html'],
    guestOnly: ['login.html', 'register.html'],
    protected: ['profile.html', 'cart.html', 'checkout.html'],
    admin: ['admin.html', 'admin-products.html', 'admin-orders.html', 'admin-deliveries.html']
};

const ALL_ROUTES = Object.values(ROUTES).flat();

class Router {
    constructor() {
        this.basePath = this.calculateBasePath();
    }

    /**
     * Calculates the base path for deployment (e.g., /ecommers/)
     * Supports both root deployment and subfolder deployment (GitHub Pages)
     */
    calculateBasePath() {
        const path = window.location.pathname;
        const parts = path.split('/');
        // If we are on a page (ending in .html), the folder is everything before the last part
        if (path.endsWith('.html')) {
            return parts.slice(0, -1).join('/') + '/';
        }
        return path.endsWith('/') ? path : path + '/';
    }

    /**
     * Gets current page name (e.g., 'index.html')
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop();
        return page || 'index.html';
    }

    /**
     * Navigates to a page safely using the calculated base path
     */
    navigate(page, params = {}) {
        if (!ALL_ROUTES.includes(page) && page !== 'index.html') {
            console.warn(`Attempted to navigate to unknown route: ${page}`);
        }

        let url = `${this.basePath}${page}`;
        const query = new URLSearchParams(params).toString();
        if (query) url += `?${query}`;

        window.location.replace(url);
    }

    /**
     * Validates a redirect intent from query parameters
     */
    getValidatedRedirect() {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        
        if (redirect && ALL_ROUTES.includes(redirect)) {
            return redirect;
        }
        return null;
    }

    /**
     * Centralized Guard Logic
     * Runs authentication and role checks based on the ROUTES config
     */
    async checkGuard() {
        const currentPage = this.getCurrentPage();
        const isAuthenticated = !!localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const isAdmin = user && user.role === 'admin';

        // 404 Protection
        if (!ALL_ROUTES.includes(currentPage)) {
            console.error(`404: Page ${currentPage} not recognized.`);
            this.navigate('index.html');
            return false;
        }

        // Guest Only Pages (Login/Register)
        if (ROUTES.guestOnly.includes(currentPage) && isAuthenticated) {
            this.navigate('index.html');
            return false;
        }

        // Protected Pages
        if (ROUTES.protected.includes(currentPage) && !isAuthenticated) {
            this.navigate('login.html', { redirect: currentPage });
            return false;
        }

        // Admin Pages
        if (ROUTES.admin.includes(currentPage)) {
            if (!isAuthenticated) {
                this.navigate('login.html', { redirect: currentPage });
                return false;
            }
            if (!isAdmin) {
                alert('Access Denied: Admin privileges required.');
                this.navigate('index.html');
                return false;
            }
        }

        return true;
    }
}

const router = new Router();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { router, ROUTES, ALL_ROUTES };
}
