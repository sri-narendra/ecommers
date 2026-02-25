/**
 * Navbar - Shared Navigation Component
 */

class Navbar {
    constructor() {
        this.placeholderId = 'navbar-placeholder';
    }

    render() {
        try {
            const placeholder = document.getElementById(this.placeholderId);
            if (!placeholder) return;

            const user = getUser();
            const isAdminUser = user && user.role === 'admin';
            const isAuthed = !!localStorage.getItem('token');

            placeholder.innerHTML = `
<header class="sticky top-0 z-50 w-full border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
  <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
    <div class="flex items-center gap-4 md:gap-10">
      <!-- Mobile Menu Toggle -->
      <button id="mobile-menu-toggle" class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-slate-600 md:hidden">
        <span class="material-symbols-outlined">menu</span>
      </button>

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
    <div class="flex flex-1 justify-end items-center gap-3 md:gap-6">
      <div class="relative hidden lg:block w-full max-w-xs">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <span class="material-symbols-outlined text-[20px]">search</span>
        </span>
        <input class="h-10 w-full rounded-full border-none bg-primary/5 pl-10 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 text-slate-900 dark:text-white" placeholder="Search products..." type="text" id="header-search"/>
      </div>
      <div class="flex items-center gap-3">
        <button id="mobile-search-toggle" class="lg:hidden flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-slate-600">
          <span class="material-symbols-outlined">search</span>
        </button>
        <a href="cart.html" class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 hover:bg-primary/10 text-slate-700 dark:text-slate-200 transition-colors relative">
          <span class="material-symbols-outlined">shopping_cart</span>
          <span id="cart-badge" class="absolute -top-1 -right-1 hidden flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">0</span>
        </a>
        <div id="auth-nav-container">
            ${isAuthed ? `
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
  <!-- Mobile Search Bar (Expandable) -->
  <div id="mobile-search-container" class="hidden border-t border-primary/5 bg-white px-6 py-4 lg:hidden">
    <div class="relative">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
        <span class="material-symbols-outlined text-[20px]">search</span>
      </span>
      <input class="h-10 w-full rounded-xl border-none bg-primary/5 pl-10 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 text-slate-900" placeholder="Search products..." type="text" id="header-search-mobile"/>
    </div>
  </div>
  <!-- Mobile Menu Drawer -->
  <div id="mobile-menu-drawer" class="fixed inset-0 z-[60] hidden">
    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" id="mobile-menu-overlay"></div>
    <div class="absolute inset-y-0 left-0 w-3/4 max-w-sm bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col gap-8">
      <div class="flex items-center justify-between">
        <a class="flex items-center gap-2" href="index.html" onclick="event.preventDefault(); router.navigate('index.html')">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <span class="material-symbols-outlined text-sm">shopping_bag</span>
          </div>
          <span class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">ShopEase</span>
        </a>
        <button id="mobile-menu-close" class="text-slate-500"><span class="material-symbols-outlined">close</span></button>
      </div>
      <nav class="flex flex-col gap-4">
        <a class="nav-link flex items-center justify-between py-2 text-base font-bold ${this.isActive('index.html') ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}" href="index.html">Home <span class="material-symbols-outlined text-sm">chevron_right</span></a>
        <a class="nav-link flex items-center justify-between py-2 text-base font-bold ${this.isActive('products.html') ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}" href="products.html">Shop <span class="material-symbols-outlined text-sm">chevron_right</span></a>
        <a class="nav-link flex items-center justify-between py-2 text-base font-bold ${this.isActive('cart.html') ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}" href="cart.html">Cart <span class="material-symbols-outlined text-sm">chevron_right</span></a>
        ${isAdminUser ? `<a class="nav-link flex items-center justify-between py-2 text-base font-bold ${this.isActive('admin.html') ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}" href="admin.html">Admin Panel <span class="material-symbols-outlined text-sm">chevron_right</span></a>` : ''}
      </nav>
      <div class="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
        ${isAuthed ? `
          <div class="flex flex-col gap-4">
            <a href="profile.html" class="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium"><span class="material-symbols-outlined">person</span>Profile</a>
            <button onclick="logout()" class="flex items-center gap-3 text-red-600 font-bold"><span class="material-symbols-outlined">logout</span>Logout</button>
          </div>
        ` : `
          <a href="login.html" class="block w-full rounded-lg bg-primary py-3 text-center font-bold text-white shadow-lg">Login</a>
        `}
      </div>
    </div>
  </div>
</header>
        `;

            this.setupEventListeners();
            this.updateCartBadge();
        } catch (e) {
            console.error('Navbar render failed:', e);
        }
    }

    isActive(page) {
        return router.getCurrentPage() === page;
    }

    setupEventListeners() {
        const searchInput = document.getElementById('header-search');
        const mobileSearchInput = document.getElementById('header-search-mobile');
        
        const handleSearch = (input) => {
            if (!input) return;
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const query = input.value.trim();
                    if (query) {
                        router.navigate('products.html', { search: query });
                    }
                }
            });
        };

        handleSearch(searchInput);
        handleSearch(mobileSearchInput);

        // Mobile Search Toggle
        const searchToggle = document.getElementById('mobile-search-toggle');
        const searchContainer = document.getElementById('mobile-search-container');
        if (searchToggle && searchContainer) {
            searchToggle.addEventListener('click', () => {
                searchContainer.classList.toggle('hidden');
                if (!searchContainer.classList.contains('hidden')) {
                    mobileSearchInput.focus();
                }
            });
        }

        // Mobile Menu Drawer Toggles
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const menuClose = document.getElementById('mobile-menu-close');
        const menuOverlay = document.getElementById('mobile-menu-overlay');
        const menuDrawer = document.getElementById('mobile-menu-drawer');

        const toggleMenu = () => {
            if (menuDrawer) menuDrawer.classList.toggle('hidden');
            document.body.classList.toggle('overflow-hidden');
        };

        [menuToggle, menuClose, menuOverlay].forEach(el => {
            if (el) el.addEventListener('click', toggleMenu);
        });

        // Handle link clicks with router
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href');
                if (menuDrawer && !menuDrawer.classList.contains('hidden')) {
                    toggleMenu();
                }
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
            const cart = response.data?.cart || response.cart;
            const count = cart?.items?.length || 0;
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
