/**
 * Navbar - Shared Navigation Component
 */

class Navbar {
    constructor() {
        this.placeholderId = 'navbar-placeholder';
    }

    render() {
        const placeholder = document.getElementById(this.placeholderId);
        if (!placeholder) return;

        const isAuthenticated = !!localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const isAdminUser = user && user.role === 'admin';

        placeholder.innerHTML = `
<header class="sticky top-0 z-50 w-full border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
  <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
    <div class="flex items-center gap-10">
      <a class="flex items-center gap-2" href="index.html" onclick="event.preventDefault(); router.navigate('index.html')">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
          <span class="material-symbols-outlined">shopping_bag</span>
        </div>
        <span class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ShopEase</span>
      </a>
      <nav class="hidden md:flex items-center gap-8">
        <a class="nav-link text-sm font-medium ${this.isActive('index.html') ? 'text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-primary'}" href="index.html">Home</a>
        <a class="nav-link text-sm font-medium ${this.isActive('products.html') ? 'text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-primary'}" href="products.html">Shop</a>
        <a class="nav-link text-sm font-medium ${this.isActive('cart.html') ? 'text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-primary'}" href="cart.html">Cart</a>
        ${isAdminUser ? `<a class="nav-link text-sm font-medium ${this.isActive('admin.html') ? 'text-primary font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-primary'}" href="admin.html">Admin</a>` : ''}
      </nav>
    </div>
    <div class="flex flex-1 justify-end items-center gap-6">
      <div class="relative hidden lg:block w-full max-w-xs">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <span class="material-symbols-outlined text-[20px]">search</span>
        </span>
        <input class="h-10 w-full rounded-full border-none bg-primary/5 pl-10 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 text-slate-900 dark:text-white" placeholder="Search products..." type="text" id="header-search"/>
      </div>
      <div class="flex items-center gap-3">
        <a href="cart.html" class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 hover:bg-primary/10 text-slate-700 dark:text-slate-200 transition-colors relative">
          <span class="material-symbols-outlined">shopping_cart</span>
          <span id="cart-badge" class="absolute -top-1 -right-1 hidden flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">0</span>
        </a>
        <div id="auth-nav-container">
            ${isAuthenticated ? `
                <div class="group relative">
                    <button class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 hover:bg-primary/10 text-slate-700 dark:text-slate-200 transition-colors">
                        <span class="material-symbols-outlined">person</span>
                    </button>
                    <div class="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-slate-800 p-2 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 hidden group-hover:block transition-all z-50">
                        <a href="profile.html" class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary rounded-lg">Profile</a>
                        ${isAdminUser ? `<a href="admin.html" class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-primary/10 hover:text-primary rounded-lg">Admin Dashboard</a>` : ''}
                        <button onclick="logout()" class="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Logout</button>
                    </div>
                </div>
            ` : `
                <a href="login.html" class="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-sm shadow-primary/20">Login</a>
            `}
        </div>
      </div>
    </div>
  </div>
</header>
        `;

        this.setupEventListeners();
        this.updateCartBadge();
    }

    isActive(page) {
        return router.getCurrentPage() === page;
    }

    setupEventListeners() {
        const searchInput = document.getElementById('header-search');
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        router.navigate('products.html', { search: query });
                    }
                }
            });
        }

        // Handle link clicks with router
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href');
                router.navigate(page);
            });
        });
    }

    async updateCartBadge() {
        const badge = document.getElementById('cart-badge');
        if (!badge) return;

        if (!isAuthenticated()) {
            badge.classList.add('hidden');
            return;
        }

        try {
            const response = await api.getCart();
            const count = response.cart?.items?.length || 0;
            if (count > 0) {
                badge.textContent = count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        } catch (e) {
            console.error('Failed to update cart badge:', e);
            badge.classList.add('hidden');
        }
    }
}


function logout() {
    if (confirm('Are you sure you want to logout?')) {
        api.logout();
    }
}

const navbar = new Navbar();
window.updateCartBadge = () => navbar.updateCartBadge();
document.addEventListener('DOMContentLoaded', () => navbar.render());
