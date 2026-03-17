// ============================================
// Operation Epic Güte — Merch Store
// Cart Logic & PayPal Integration
// ============================================

// --- Product Data ---
const products = [
    {
        id: 'black-tshirt',
        name: 'Black T-Shirt',
        description: 'Operation Epic Güte',
        price: 199,
        originalPrice: 200,
        image: 'images/black-tshirt.png',
        onSale: true,
        hasSizes: true,
        category: 'T-Shirt'
    },
    {
        id: 'white-tshirt',
        name: 'White T-Shirt',
        description: 'Operation Epic Güte',
        price: 199,
        originalPrice: 200,
        image: 'images/white-tshirt.png',
        onSale: true,
        hasSizes: true,
        category: 'T-Shirt'
    },
    {
        id: 'black-cap',
        name: 'Black Cap',
        description: 'Operation Epic Güte',
        price: 49,
        originalPrice: null,
        image: 'images/black-cap.png',
        onSale: false,
        hasSizes: false,
        category: 'Accessory'
    },
    {
        id: 'black-hoodie',
        name: 'Black Hoodie',
        description: 'Operation Epic Güte',
        price: 299,
        originalPrice: null,
        image: 'images/black-hoodie.png',
        onSale: false,
        hasSizes: true,
        category: 'Hoodie'
    },
    {
        id: 'white-totebag',
        name: 'White Tote Bag',
        description: 'Operation Epic Güte',
        price: 39,
        originalPrice: null,
        image: 'images/white-totebag.png',
        onSale: false,
        hasSizes: false,
        category: 'Accessory'
    },
    {
        id: 'sticker-pack',
        name: 'Sticker Pack',
        description: 'Operation Epic Güte — 8 pcs',
        price: 9,
        originalPrice: null,
        image: 'images/stickers.png',
        onSale: false,
        hasSizes: false,
        category: 'Accessory'
    }
];

// --- Cart State ---
let cart = [];

// --- DOM Elements ---
const productsGrid = document.getElementById('products-grid');
const cartPanel = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsEl = document.getElementById('cart-items');
const cartEmptyEl = document.getElementById('cart-empty');
const cartFooter = document.getElementById('cart-footer');
const cartCountEl = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total-amount');
const toastEl = document.getElementById('toast');
const toastTextEl = document.getElementById('toast-text');

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    setupCartToggle();
    setupPayPal();
});

// --- Render Products ---
function renderProducts() {
    productsGrid.innerHTML = products.map(product => {
        const sizeHTML = product.hasSizes ? `
            <div class="size-selector" data-product-id="${product.id}">
                <button class="size-btn" data-size="S">S</button>
                <button class="size-btn active" data-size="M">M</button>
                <button class="size-btn" data-size="L">L</button>
                <button class="size-btn" data-size="XL">XL</button>
            </div>
        ` : '';

        const saleBadge = product.onSale ? '<div class="sale-badge">Sale</div>' : '';

        const priceHTML = product.onSale
            ? `<span class="price-current">€${product.price}</span>
               <span class="price-original">€${product.originalPrice}</span>
               <span class="price-save">SAVE €${product.originalPrice - product.price}</span>`
            : `<span class="price-current">€${product.price}</span>`;

        return `
            <article class="product-card" data-product-id="${product.id}">
                <div class="product-image-wrapper">
                    ${saleBadge}
                    <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        ${priceHTML}
                    </div>
                    ${sizeHTML}
                    <button class="add-to-cart" data-product-id="${product.id}" id="add-${product.id}">
                        Add to Cart
                    </button>
                </div>
            </article>
        `;
    }).join('');

    // Size selector logic
    document.querySelectorAll('.size-selector').forEach(selector => {
        selector.addEventListener('click', (e) => {
            const btn = e.target.closest('.size-btn');
            if (!btn) return;
            selector.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.productId;
            const product = products.find(p => p.id === productId);
            const card = btn.closest('.product-card');
            const sizeEl = card.querySelector('.size-btn.active');
            const size = sizeEl ? sizeEl.dataset.size : null;
            addToCart(product, size);

            // Button feedback
            btn.textContent = '✓ Added!';
            btn.classList.add('added');
            setTimeout(() => {
                btn.textContent = 'Add to Cart';
                btn.classList.remove('added');
            }, 1500);
        });
    });
}

// --- Cart Toggle ---
function setupCartToggle() {
    document.getElementById('cart-toggle').addEventListener('click', openCart);
    document.getElementById('cart-close').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
}

function openCart() {
    cartPanel.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

// --- Add to Cart ---
function addToCart(product, size) {
    const cartKey = size ? `${product.id}-${size}` : product.id;
    const existing = cart.find(item => item.cartKey === cartKey);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            cartKey,
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size,
            qty: 1
        });
    }

    updateCartUI();
    showToast(`${product.name}${size ? ` (${size})` : ''} added to cart`);
}

// --- Remove from Cart ---
function removeFromCart(cartKey) {
    cart = cart.filter(item => item.cartKey !== cartKey);
    updateCartUI();
}

// --- Update Quantity ---
function updateQty(cartKey, delta) {
    const item = cart.find(i => i.cartKey === cartKey);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(cartKey);
        return;
    }

    updateCartUI();
}

// --- Update Cart UI ---
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Cart count badge
    cartCountEl.textContent = totalItems;
    cartCountEl.classList.toggle('show', totalItems > 0);

    // Cart items
    if (cart.length === 0) {
        cartEmptyEl.style.display = 'flex';
        cartFooter.style.display = 'none';
        // Clear existing cart items but keep the empty div
        const existingItems = cartItemsEl.querySelectorAll('.cart-item');
        existingItems.forEach(el => el.remove());
    } else {
        cartEmptyEl.style.display = 'none';
        cartFooter.style.display = 'block';

        // Re-render cart items
        const existingItems = cartItemsEl.querySelectorAll('.cart-item');
        existingItems.forEach(el => el.remove());

        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-meta">${item.size ? `Size: ${item.size}` : item.id === 'sticker-pack' ? '8 pcs' : 'One size'}</div>
                    <div class="cart-item-bottom">
                        <span class="cart-item-price">€${item.price * item.qty}</span>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateQty('${item.cartKey}', -1)">−</button>
                            <span class="qty-value">${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty('${item.cartKey}', 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
            cartItemsEl.appendChild(itemEl);
        });

        // Total
        cartTotalEl.textContent = `€${totalPrice}`;
    }
}

// --- Toast ---
function showToast(message) {
    toastTextEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2500);
}

// --- PayPal Integration ---
function setupPayPal() {
    if (typeof paypal === 'undefined') {
        console.warn('PayPal SDK not loaded. Checkout will not work.');
        return;
    }

    paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'white',
            shape: 'pill',
            label: 'paypal',
            height: 48
        },
        createOrder: function(data, actions) {
            const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

            if (totalPrice <= 0) {
                showToast('Your cart is empty!');
                return;
            }

            const items = cart.map(item => ({
                name: item.name + (item.size ? ` (${item.size})` : ''),
                unit_amount: {
                    currency_code: 'EUR',
                    value: item.price.toFixed(2)
                },
                quantity: item.qty.toString()
            }));

            return actions.order.create({
                purchase_units: [{
                    payee: {
                        email_address: 'yihshiou.lo@gmail.com'
                    },
                    description: 'Operation Epic Güte Merch',
                    amount: {
                        currency_code: 'EUR',
                        value: totalPrice.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: 'EUR',
                                value: totalPrice.toFixed(2)
                            }
                        }
                    },
                    items: items
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                cart = [];
                updateCartUI();
                closeCart();
                showToast(`Thank you, ${details.payer.name.given_name}! Order placed.`);
            });
        },
        onError: function(err) {
            console.error('PayPal error:', err);
            showToast('Payment failed. Please try again.');
        }
    }).render('#paypal-button-container');
}
