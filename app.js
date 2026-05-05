/**
 * TechStore - E-Commerce Product Listing Application
 * Logic for fetching and rendering products from FreeAPI
 */

const API_URL = 'https://api.freeapi.app/api/v1/public/randomproducts';

// State Management
let allProducts = [];
let cartCount = 0;

// DOM Elements
const productGrid = document.getElementById('product-grid');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const retryButton = document.getElementById('retry-button');
const searchInput = document.getElementById('search-input');
const cartBadge = document.querySelector('header button span');

// Theme Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

// Mobile Menu Elements
const mobileMenuBtn = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const burgerIcon = document.getElementById('burger-icon');
const closeIcon = document.getElementById('close-icon');
const searchInputMobile = document.getElementById('search-input-mobile');

/**
 * Main application controller
 */
async function init() {
    syncThemeIcons();
    setupEventListeners();
    await fetchProducts();
}

/**
 * Syncs the theme toggle icons based on the class set in the head
 */
function syncThemeIcons() {
    if (document.documentElement.classList.contains('dark')) {
        themeToggleLightIcon.classList.remove('hidden');
        themeToggleDarkIcon.classList.add('hidden');
    } else {
        themeToggleDarkIcon.classList.remove('hidden');
        themeToggleLightIcon.classList.add('hidden');
    }
}

/**
 * Attaches event listeners to interactive elements
 */
function setupEventListeners() {
    if (retryButton) {
        retryButton.addEventListener('click', async () => {
            await fetchProducts();
        });
    }

    // Sync search inputs
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (searchInputMobile) searchInputMobile.value = e.target.value;
            filterAndSortProducts();
        });
    }

    if (searchInputMobile) {
        searchInputMobile.addEventListener('input', (e) => {
            if (searchInput) searchInput.value = e.target.value;
            filterAndSortProducts();
        });
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            filterAndSortProducts();
        });
    }

    // Theme Toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            themeToggleDarkIcon.classList.toggle('hidden');
            themeToggleLightIcon.classList.toggle('hidden');

            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            }
        });
    }

    // Mobile Menu Toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            // Allow animation to trigger if active class is used in CSS
            setTimeout(() => {
                mobileMenu.classList.toggle('active');
            }, 10);
            burgerIcon.classList.toggle('hidden');
            closeIcon.classList.toggle('hidden');
        });
    }
}

/**
 * Fetches product data from the API and manages UI states
 */
async function fetchProducts() {
    showState('loading');
    
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data && Array.isArray(result.data.data)) {
            allProducts = result.data.data;
            filterAndSortProducts();
            showState('products');
        } else {
            throw new Error('Malformed data received from API');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showState('error');
    }
}

/**
 * Filters and sorts the stored product list
 */
function filterAndSortProducts() {
    const query = searchInput ? searchInput.value : '';
    const sortType = document.getElementById('sort-select')?.value || 'default';
    
    const searchTerm = query.toLowerCase().trim();
    let filtered = allProducts.filter(product => 
        product.title.toLowerCase().includes(searchTerm) || 
        (product.category && product.category.toLowerCase().includes(searchTerm)) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm))
    );

    // Sorting logic
    if (sortType === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortType === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortType === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
    }

    renderProducts(filtered);
}

/**
 * Toggles visibility between different UI states
 * @param {'loading' | 'products' | 'error'} state 
 */
function showState(state) {
    if (loadingState) loadingState.classList.add('hidden');
    if (productGrid) productGrid.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
    
    if (state === 'loading') {
        if (loadingState) loadingState.classList.remove('hidden');
    } else if (state === 'products') {
        if (productGrid) productGrid.classList.remove('hidden');
    } else if (state === 'error') {
        if (errorState) errorState.classList.remove('hidden');
    }
}

/**
 * Formats a number as USD currency
 * @param {number} price 
 * @returns {string}
 */
function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price || 0);
}

/**
 * Renders product cards into the DOM
 * @param {Array} products 
 */
function renderProducts(products) {
    if (!productGrid) return;
    
    // Clear existing products
    productGrid.innerHTML = '';
    
    if (products.length === 0) {
        const query = searchInput ? searchInput.value : '';
        productGrid.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <div class="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
                <p class="text-gray-500 dark:text-gray-400">We couldn't find any products matching "${query}".</p>
                <button onclick="document.getElementById('search-input').value = ''; filterAndSortProducts();" class="mt-6 text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                    Clear search and try again
                </button>
            </div>
        `;
        return;
    }
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });
}

/**
 * Generates star rating HTML
 * @param {number} rating 
 * @returns {string}
 */
function getRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHtml = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" opacity="0.5"/></svg>';
        } else {
            starsHtml += '<svg class="w-4 h-4 text-gray-300 dark:text-gray-600 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
        }
    }
    return starsHtml;
}

/**
 * Creates a single product card DOM element
 * @param {Object} product 
 * @returns {HTMLElement}
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300';
    
    const imageUrl = product.thumbnail || 'https://via.placeholder.com/400x300?text=No+Image';
    const discount = product.discountPercentage > 0 ? `<div class="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">-${Math.round(product.discountPercentage)}%</div>` : '';
    
    card.innerHTML = `
        <div class="relative overflow-hidden aspect-video sm:aspect-square">
            <img 
                src="${imageUrl}" 
                alt="${product.title}" 
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onerror="this.src='https://via.placeholder.com/400x300?text=Image+Load+Error'"
            >
            <div class="absolute top-3 left-3">
                <span class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm transition-colors">
                    ${product.category || 'General'}
                </span>
            </div>
            ${discount}
        </div>
        <div class="p-5 flex flex-col flex-grow">
            <div class="flex-grow">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest transition-colors">${product.brand || 'TechBrand'}</span>
                    <div class="flex items-center">
                        ${getRatingStars(product.rating)}
                        <span class="text-[10px] text-gray-400 dark:text-gray-500 ml-1">(${product.rating})</span>
                    </div>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate mb-1" title="${product.title}">
                    ${product.title}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 transition-colors">
                    ${product.description || 'No description available for this item.'}
                </p>
            </div>
            <div class="flex items-center justify-between mt-auto">
                <div>
                    <span class="text-xl font-extrabold text-gray-900 dark:text-white transition-colors">
                        ${formatPrice(product.price)}
                    </span>
                    ${product.discountPercentage > 0 ? `<span class="block text-[10px] text-gray-400 dark:text-gray-500 line-through transition-colors">${formatPrice(product.price / (1 - product.discountPercentage / 100))}</span>` : ''}
                </div>
                <button onclick="addToCart(event)" class="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 shadow-md shadow-indigo-100 dark:shadow-none">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Handles adding an item to the cart
 * @param {Event} e 
 */
function addToCart(e) {
    e.stopPropagation();
    cartCount++;
    if (cartBadge) {
        cartBadge.textContent = cartCount;
        // Add a little animation to the badge
        cartBadge.classList.add('scale-125', 'bg-green-500');
        setTimeout(() => {
            cartBadge.classList.remove('scale-125', 'bg-green-500');
        }, 300);
    }
}

// Start the application
init();