// Products Module

let allProducts = [];
let currentCategory = '';
let currentSort = 'name';

// Load products with filters and search
async function loadProducts() {
    try {
        const response = await api.getProducts();
        allProducts = response.products;
        
        applyFilters();
        setupEventListeners();
        
        return allProducts;
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
        return [];
    }
}

// Perform search with debouncing
const performSearch = debounce(async (query) => {
    if (query.length < 3) {
        applyFilters();
        return;
    }
    
    try {
        const response = await api.searchProducts(query);
        displayProducts(response.products);
    } catch (error) {
        console.error('Error searching products:', error);
        showToast('Search failed', 'error');
        applyFilters();
    }
}, 300);

// Apply filters and sorting
function applyFilters() {
    let filteredProducts = [...allProducts];

    // Filter by category
    if (currentCategory) {
        filteredProducts = filteredProducts.filter(product => 
            product.category.toLowerCase() === currentCategory.toLowerCase()
        );
    }

    // Sort products
    filteredProducts.sort((a, b) => {
        switch (currentSort) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'date':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'name':
            default:
                return a.name.localeCompare(b.name);
        }
    });

    displayProducts(filteredProducts);
}

// Display products in grid
function displayProducts(products) {
    const grid = document.getElementById('products-grid') || document.getElementById('featured-products-grid');
    
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No products found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image_url || 'assets/placeholder.jpg'}" alt="${escapeHtml(product.name)}">
                ${product.stock < 5 ? '<div class="low-stock-badge">Low Stock</div>' : ''}
            </div>
            <div class="product-info">
                <h3>${escapeHtml(product.name)}</h3>
                <p class="product-description">${escapeHtml(truncateText(product.description, 100))}</p>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-stock">Stock: ${product.stock}</p>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="addToCart('${product._id}', 1)">
                        Add to Cart
                    </button>
                    <button class="btn btn-secondary" onclick="viewProduct('${product._id}')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Add product to cart
async function addToCart(productId, quantity) {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        await api.addToCart(productId, quantity);
        showToast('Product added to cart!', 'success');
        
        // Update cart count in header if exists
        updateCartCount();
    } catch (error) {
        if (error.status === 400) {
            showToast(error.message || 'Cannot add more items than available stock', 'error');
        } else {
            showToast('Failed to add product to cart', 'error');
        }
    }
}

// View product details
function viewProduct(productId) {
    window.location.href = `product-details.html?id=${productId}`;
}

// Setup event listeners
function setupEventListeners() {
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            applyFilters();
        });
    }

    // Sort filter
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFilters();
        });
    }

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Update cart count in header
async function updateCartCount() {
    try {
        const cart = await api.getCart();
        const cartCount = cart.cart.items.reduce((total, item) => total + item.quantity, 0);
        
        // Update cart count in header if element exists
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
            cartCountElement.style.display = cartCount > 0 ? 'inline' : 'none';
        }
    } catch (error) {
        // Cart might be empty or user not logged in
    }
}

// Get product by ID
async function getProduct(productId) {
    try {
        const response = await api.getProduct(productId);
        return response.product;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

// Get products by category
async function getProductsByCategory(category) {
    try {
        const response = await api.getProducts(category);
        return response.products;
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return [];
    }
}

// Get low stock products
async function getLowStockProducts(threshold = 5) {
    try {
        const response = await api.getLowStockProducts(threshold);
        return response.products;
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        return [];
    }
}

// Initialize products module
function initProducts() {
    // Load products on page load
    if (document.getElementById('products-grid') || document.getElementById('featured-products-grid')) {
        loadProducts();
    }
    
    // Update cart count on page load
    if (isAuthenticated()) {
        updateCartCount();
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadProducts,
        performSearch,
        applyFilters,
        displayProducts,
        addToCart,
        viewProduct,
        setupEventListeners,
        getProduct,
        getProductsByCategory,
        getLowStockProducts,
        updateCartCount,
        initProducts
    };
}