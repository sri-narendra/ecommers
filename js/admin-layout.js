/**
 * Admin Layout Component
 * Centralizes the admin sidebar and top navigation.
 * Implements strict isAdmin() guard before rendering.
 */
const AdminLayout = {
    render: function() {
        if (!isAdmin()) {
            router.navigate('index.html');
            return;
        }

        const headerPlaceholder = document.getElementById('admin-header-placeholder');
        const sidebarPlaceholder = document.getElementById('admin-sidebar-placeholder');
        const isDark = document.documentElement.classList.contains('dark');

        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = `
                <header class="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 md:px-6 py-3">
                    <div class="flex items-center gap-4 md:gap-8">
                        <!-- Mobile Sidebar Toggle -->
                        <button id="admin-mobile-menu-toggle" class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-slate-600 lg:hidden">
                            <span class="material-symbols-outlined">menu</span>
                        </button>
                        <div class="flex items-center gap-2 text-primary cursor-pointer" onclick="router.navigate('admin.html')">
                            <div class="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                                <span class="material-symbols-outlined text-[20px]">analytics</span>
                            </div>
                            <h2 class="text-slate-900 dark:text-slate-100 text-lg md:text-xl font-bold tracking-tight">ShopAdmin</h2>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 md:gap-4">
                        <div class="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                            <button onclick="api.logout()" class="flex items-center gap-2 px-2 md:px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                                <span class="material-symbols-outlined text-[20px]">logout</span>
                                <span class="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>
            `;
        }

        if (sidebarPlaceholder) {
            const currentPage = router.getCurrentPage();
            const navItems = `
                <nav class="flex flex-col gap-1">
                    ${this.createNavItem('Dashboard', 'dashboard', 'admin.html', currentPage === 'admin.html')}
                    ${this.createNavItem('Products', 'inventory_2', 'admin-products.html', currentPage === 'admin-products.html')}
                    ${this.createNavItem('Orders', 'shopping_cart', 'admin-orders.html', currentPage === 'admin-orders.html')}
                    ${this.createNavItem('Deliveries', 'local_shipping', 'admin-deliveries.html', currentPage === 'admin-deliveries.html')}
                </nav>
            `;

            sidebarPlaceholder.innerHTML = `
                <!-- Desktop Sidebar -->
                <aside class="w-64 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-8 bg-white dark:bg-background-dark hidden lg:flex h-[calc(100vh-65px)] sticky top-[65px]">
                    <div class="space-y-4">
                        <h1 class="text-slate-900 dark:text-slate-100 text-xs font-bold uppercase tracking-wider opacity-50">Management</h1>
                        ${navItems}
                    </div>
                    <div class="mt-auto space-y-4">
                        <div class="flex flex-col gap-1 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <a class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-primary transition-colors cursor-pointer" onclick="router.navigate('index.html')">
                                <span class="material-symbols-outlined text-[20px]">storefront</span>
                                <span class="text-sm font-medium">View Store</span>
                            </a>
                            <button onclick="api.logout()" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-red-500 transition-colors w-full text-left">
                                <span class="material-symbols-outlined text-[20px]">logout</span>
                                <span class="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </aside>

                <!-- Mobile Sidebar Drawer -->
                <div id="admin-mobile-sidebar" class="fixed inset-0 z-[60] hidden">
                    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" id="admin-mobile-overlay"></div>
                    <div class="absolute inset-y-0 left-0 w-3/4 max-w-xs bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col gap-8">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 text-primary">
                                <div class="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                                    <span class="material-symbols-outlined text-[20px]">analytics</span>
                                </div>
                                <h2 class="text-slate-900 dark:text-slate-100 text-lg font-bold tracking-tight">ShopAdmin</h2>
                            </div>
                            <button id="admin-mobile-close" class="text-slate-500"><span class="material-symbols-outlined">close</span></button>
                        </div>
                        <div class="space-y-4">
                            <h1 class="text-slate-900 dark:text-slate-100 text-xs font-bold uppercase tracking-wider opacity-50">Management</h1>
                            ${navItems}
                        </div>
                        <div class="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
                             <a class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-primary transition-colors cursor-pointer mb-2" onclick="router.navigate('index.html')">
                                <span class="material-symbols-outlined text-[20px]">storefront</span>
                                <span class="text-sm font-medium">View Store</span>
                            </a>
                            <button onclick="api.logout()" class="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 font-bold w-full text-left">
                                <span class="material-symbols-outlined text-[20px]">logout</span>Logout
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            this.setupEventListeners();
        }
    },

    setupEventListeners: function() {
        const toggle = document.getElementById('admin-mobile-menu-toggle');
        const close = document.getElementById('admin-mobile-close');
        const overlay = document.getElementById('admin-mobile-overlay');
        const sidebar = document.getElementById('admin-mobile-sidebar');

        const toggleSidebar = () => {
            if (sidebar) sidebar.classList.toggle('hidden');
            document.body.classList.toggle('overflow-hidden');
        };

        [toggle, close, overlay].forEach(el => {
            if (el) el.onclick = toggleSidebar;
        });
    },

    createNavItem: function(label, icon, path, isActive) {
        const activeClass = isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800';
        const fontClass = isActive ? 'font-semibold' : 'font-medium';
        return `
            <a class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${activeClass}" onclick="router.navigate('${path}')">
                <span class="material-symbols-outlined text-[20px]">${icon}</span>
                <span class="text-sm ${fontClass}">${label}</span>
            </a>
        `;
    }
};

window.adminLayout = AdminLayout;

window.adminLayout = AdminLayout;
