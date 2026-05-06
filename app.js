/**
 * SkyShop - E-Commerce Product Listing Application
 * Logic for fetching and rendering products from FreeAPI
 */

const API_URL = 'https://api.freeapi.app/api/v1/public/randomproducts';
const PRODUCTS_PER_LOAD = 100; // Fetch a large batch to have enough for categories

// Department Mapping
const DEPARTMENT_MAP = {
    'electronics': ['smartphones', 'laptops', 'lighting'],
    'groceries': ['groceries'],
    'beauty': ['fragrances', 'skincare'],
    'fashion': ['tops', 'womens-dresses', 'womens-shoes', 'mens-shirts', 'mens-shoes', 'mens-watches', 'womens-watches', 'womens-bags', 'womens-jewellery', 'sunglasses'],
    'home': ['home-decoration', 'furniture'],
    'automotive': ['automotive', 'motorcycle']
};

const DEPT_NAMES = {
    'electronics': 'Electronics & Tech',
    'groceries': 'Fresh Groceries',
    'beauty': 'Beauty & Personal Care',
    'fashion': 'Fashion & Accessories',
    'home': 'Home & Furniture',
    'automotive': 'Automotive & Industrial'
};

// State Management
let allProducts = [];
let cartCount = 0;
let isLoadingMore = false;
let currentDept = 'all'; // 'all' (home) or specific dept slug
let searchQuery = '';
let currentPage = 1;

// DOM Elements
const viewContent = document.getElementById('view-content');
const productGrid = document.getElementById('product-grid');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const retryButton = document.getElementById('retry-button');
const searchInput = document.getElementById('search-input');
const searchInputMobile = document.getElementById('search-input-mobile');
const cartBadge = document.querySelector('header button span');
const headerCategorySelect = document.getElementById('header-category-select');

// Load More Elements
const loadMoreContainer = document.getElementById('load-more-container');
const loadMoreButton = document.getElementById('load-more-button');
const loadMoreSpinner = document.getElementById('load-more-spinner');
const loadMoreText = document.getElementById('load-more-text');

// Theme & Navigation
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const mobileMenuBtn = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const burgerIcon = document.getElementById('burger-icon');
const closeIcon = document.getElementById('close-icon');

/**
 * Main application controller
 */
async function init() {
    syncThemeIcons();
    setupEventListeners();
    await fetchProducts();
}

function syncThemeIcons() {
    if (document.documentElement.classList.contains('dark')) {
        themeToggleLightIcon?.classList.remove('hidden');
        themeToggleDarkIcon?.classList.add('hidden');
    } else {
        themeToggleDarkIcon?.classList.remove('hidden');
        themeToggleLightIcon?.classList.add('hidden');
    }
}

function setupEventListeners() {
    // Retry Logic
    retryButton?.addEventListener('click', () => fetchProducts());

    // Load More
    loadMoreButton?.addEventListener('click', async () => {
        if (!isLoadingMore) {
            setLoadMoreLoading(true);
            await fetchProducts(true);
            setLoadMoreLoading(false);
        }
    });

    // Navigation
    document.querySelectorAll('.nav-dept').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const dept = e.currentTarget.getAttribute('data-dept');
            switchDept(dept);
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenuBtn?.click();
            }
        });
    });

    // Search
    const handleSearch = (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        if (searchInputMobile) searchInputMobile.value = e.target.value;
        if (searchInput) searchInput.value = e.target.value;
        renderView();
    };

    searchInput?.addEventListener('input', handleSearch);
    searchInputMobile?.addEventListener('input', handleSearch);

    headerCategorySelect?.addEventListener('change', (e) => {
        switchDept(e.target.value);
    });

    // Theme Toggle
    themeToggleBtn?.addEventListener('click', function() {
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

    // Mobile Menu
    mobileMenuBtn?.addEventListener('click', () => {
        mobileMenu?.classList.toggle('hidden');
        burgerIcon?.classList.toggle('hidden');
        closeIcon?.classList.toggle('hidden');
    });
}

/**
 * Switches the active department/view
 */
function switchDept(dept) {
    currentDept = dept;
    if (headerCategorySelect) headerCategorySelect.value = dept;
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderView();
}

/**
 * Fetches product data from the API
 */
async function fetchProducts(isAppend = false) {
    if (!isAppend) {
        showState('loading');
        allProducts = [];
        currentPage = 1;
    } else {
        currentPage++;
    }
    
    try {
        const response = await fetch(`${API_URL}?limit=${PRODUCTS_PER_LOAD}&page=${currentPage}`);
        const result = await response.json();
        
        if (result.success && result.data && Array.isArray(result.data.data)) {
            const newProducts = result.data.data;
            const existingIds = new Set(allProducts.map(p => p.id));
            const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
            
            allProducts = [...allProducts, ...uniqueNewProducts];
            renderView();
            showState('content');

            if (isAppend && uniqueNewProducts.length === 0) {
                if (loadMoreText) loadMoreText.textContent = "No more products available";
                setTimeout(() => {
                    if (loadMoreText) loadMoreText.textContent = "See more results";
                }, 3000);
            }
        } else {
            throw new Error('Data error');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        if (!isAppend) showState('error');
    }
}

/**
 * Orchestrates the rendering based on currentDept and searchQuery
 */
function renderView() {
    if (searchQuery) {
        renderSearchResults();
        return;
    }

    if (currentDept === 'all') {
        renderHome();
    } else {
        renderDepartment(currentDept);
    }
}

/**
 * Renders the Amazon-like segmented homepage
 */
function renderHome() {
    viewContent.innerHTML = '';
    viewContent.classList.remove('hidden');
    productGrid.classList.add('hidden');
    loadMoreContainer.classList.add('hidden');

    Object.keys(DEPARTMENT_MAP).forEach(deptSlug => {
        const deptProducts = filterByDept(allProducts, deptSlug).slice(0, 5); // Show 5 per row
        if (deptProducts.length > 0) {
            const section = document.createElement('section');
            section.className = 'bg-white dark:bg-gray-800 p-6 rounded-sm shadow-sm';
            section.innerHTML = `
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white">${DEPT_NAMES[deptSlug]}</h3>
                    <a href="#" class="text-sm font-semibold text-cyan-600 hover:text-orange-600 hover:underline" onclick="event.preventDefault(); switchDept('${deptSlug}')">Shop all</a>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"></div>
            `;
            const grid = section.querySelector('div.grid');
            deptProducts.forEach(p => grid.appendChild(createProductCard(p)));
            viewContent.appendChild(section);
        }
    });
}

/**
 * Renders a specific department grid
 */
function renderDepartment(deptSlug) {
    viewContent.innerHTML = '';
    viewContent.classList.add('hidden');
    productGrid.innerHTML = '';
    productGrid.classList.remove('hidden');
    loadMoreContainer.classList.remove('hidden');

    const products = filterByDept(allProducts, deptSlug);
    
    // Add Header for the Department
    const header = document.createElement('div');
    header.className = 'col-span-full mb-4 border-b border-gray-200 pb-4';
    header.innerHTML = `
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Results for <span class="text-orange-700">"${DEPT_NAMES[deptSlug]}"</span></h2>
        <p class="text-sm text-gray-500 mt-1">Showing 1-${products.length} of over ${products.length} results</p>
    `;
    productGrid.appendChild(header);

    products.forEach(p => productGrid.appendChild(createProductCard(p)));
}

/**
 * Renders search results across all departments
 */
function renderSearchResults() {
    viewContent.innerHTML = '';
    viewContent.classList.add('hidden');
    productGrid.innerHTML = '';
    productGrid.classList.remove('hidden');
    loadMoreContainer.classList.add('hidden');

    const filtered = allProducts.filter(p => 
        p.title.toLowerCase().includes(searchQuery) || 
        (p.category && p.category.toLowerCase().includes(searchQuery))
    );

    if (filtered.length === 0) {
        productGrid.innerHTML = `<div class="col-span-full py-20 text-center">
            <h3 class="text-xl font-bold">No results for "${searchQuery}"</h3>
            <p class="text-gray-500 mt-2">Try checking your spelling or using more general terms.</p>
        </div>`;
        return;
    }

    const header = document.createElement('div');
    header.className = 'col-span-full mb-4 border-b border-gray-200 pb-4';
    header.innerHTML = `<h2 class="text-xl font-bold">Search results for "${searchQuery}"</h2>`;
    productGrid.appendChild(header);

    filtered.forEach(p => productGrid.appendChild(createProductCard(p)));
}

/**
 * Utility to filter products by department mapping
 */
function filterByDept(products, deptSlug) {
    const allowedCategories = DEPARTMENT_MAP[deptSlug] || [];
    return products.filter(p => allowedCategories.includes(p.category));
}

/**
 * UI State Toggler
 */
function showState(state) {
    loadingState?.classList.add('hidden');
    viewContent?.classList.add('hidden');
    productGrid?.classList.add('hidden');
    errorState?.classList.add('hidden');
    loadMoreContainer?.classList.add('hidden');
    
    if (state === 'loading') {
        loadingState?.classList.remove('hidden');
    } else if (state === 'content') {
        renderView();
    } else if (state === 'error') {
        errorState?.classList.remove('hidden');
    }
}

function setLoadMoreLoading(isLoading) {
    isLoadingMore = isLoading;
    if (isLoading) {
        loadMoreSpinner?.classList.remove('hidden');
        if (loadMoreText) loadMoreText.textContent = "Loading more...";
        loadMoreButton?.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        loadMoreSpinner?.classList.add('hidden');
        if (loadMoreText) loadMoreText.textContent = "See more results";
        loadMoreButton?.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price || 0);
}

function getRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<svg class="w-4 h-4 text-[#f08804] fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '<svg class="w-4 h-4 text-[#f08804] fill-current" viewBox="0 0 20 20" opacity="0.5"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
        } else {
            starsHtml += '<svg class="w-4 h-4 text-gray-300 dark:text-gray-600 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
        }
    }
    return starsHtml;
}

/**
 * Creates Amazon-style product card
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 p-4 flex flex-col group cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-gray-200 dark:hover:border-gray-700';
    
    let imageUrl = product.thumbnail;
    if (Array.isArray(product.images) && product.images.length > 0) imageUrl = product.images[0];
    
    const priceStr = formatPrice(product.price).split('.');
    const integerPart = priceStr[0];
    const decimalPart = priceStr[1] || '00';

    card.innerHTML = `
        <div class="relative bg-gray-100 dark:bg-gray-700/50 rounded-sm mb-4 aspect-square overflow-hidden flex items-center justify-center">
            <img src="${imageUrl}" alt="${product.title}" class="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal transform transition-transform group-hover:scale-105" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
            ${product.discountPercentage > 15 ? `<div class="absolute top-0 left-0 bg-[#CC0C39] text-white text-[12px] font-bold px-2 py-1">Limited time deal</div>` : ''}
        </div>
        <div class="flex flex-col flex-grow">
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug mb-1 group-hover:text-orange-700 transition-colors">
                ${product.title}
            </h3>
            <div class="flex items-center mb-1">
                <div class="flex">${getRatingStars(product.rating)}</div>
                <span class="text-xs text-cyan-600 dark:text-cyan-400 ml-1 hover:text-orange-600 hover:underline">${Math.floor(product.rating * 100)}</span>
            </div>
            <div class="flex items-baseline mb-2">
                <span class="text-sm align-top mt-1">$</span>
                <span class="text-2xl font-bold">${integerPart.replace('$', '')}</span>
                <span class="text-sm align-top mt-1 font-bold">${decimalPart}</span>
            </div>
            <div class="flex items-center text-xs text-gray-500 mb-4">
                <svg class="w-4 h-4 text-orange-500 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
                <span>Get it by <span class="font-bold text-gray-900 dark:text-gray-300">Tomorrow</span></span>
            </div>
            <button onclick="addToCart(event)" class="mt-auto w-full bg-[#ffd814] hover:bg-[#f7ca00] text-gray-900 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-[#fcd200] transition-colors">
                Add to Cart
            </button>
        </div>
    `;
    return card;
}

function addToCart(e) {
    e.stopPropagation();
    cartCount++;
    if (cartBadge) {
        cartBadge.textContent = cartCount;
        cartBadge.classList.add('scale-125');
        setTimeout(() => cartBadge.classList.remove('scale-125'), 300);
    }
}

init();