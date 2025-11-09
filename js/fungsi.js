document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const mainNav = document.querySelector('.main-nav');
    const searchBtn = document.getElementById('search-btn');
    const searchModal = document.querySelector('.search-modal');
    const searchInput = document.querySelector('.search-input');
    const cartBtn = document.getElementById('cart-btn');
    const cartCount = document.querySelector('.cart-count');
    const themeToggle = document.getElementById('theme-toggle');
    let themeIcon = themeToggle?.querySelector('i');

    // Theme functionality
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Determine which icon to show: when in light mode show moon (to switch to dark),
    // when in dark mode show sun (to switch to light).
    const setThemeIcon = (mode) => {
        const iconName = mode === 'dark' ? 'sun' : 'moon';

        // If an inline SVG already exists (feather.replace ran earlier), replace it
        const existingSvg = themeToggle?.querySelector('svg');
        if (existingSvg && window.feather && feather.icons && feather.icons[iconName]) {
            try {
                existingSvg.outerHTML = feather.icons[iconName].toSvg();
            } catch (err) {
                // fallback to creating/updating an <i> if something goes wrong
                // (handled below)
            }
        } else {
            // ensure an <i> element exists inside the button
            if (!themeIcon && themeToggle) {
                themeIcon = document.createElement('i');
                themeToggle.prepend(themeIcon);
            }
            if (themeIcon) {
                themeIcon.setAttribute('data-feather', iconName);
            }
            // render icons
            if (window.feather) feather.replace();
        }

        // update accessible label/title
        if (themeToggle) {
            themeToggle.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
            themeToggle.setAttribute('title', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        }
    };

    setThemeIcon(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            // Update icon + aria label
            setThemeIcon(newTheme);
        });
    }
    let cartItems = [];
    let overlay = null;

    if (!menuBtn || !mainNav) return;

    function openNav() {
        mainNav.classList.add('open');
        // create overlay
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
        // prevent background scroll
        document.body.style.overflow = 'hidden';
        overlay.addEventListener('click', closeNav);
    }

    function closeNav() {
        mainNav.classList.remove('open');
        if (overlay) {
            overlay.removeEventListener('click', closeNav);
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            overlay = null;
        }
        document.body.style.overflow = '';
    }

    menuBtn.addEventListener('click', () => {
        if (mainNav.classList.contains('open')) closeNav();
        else openNav();
    });

    // close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mainNav.classList.contains('open')) closeNav();
    });

    // cleanup when resizing to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 600) {
            closeNav();
        }
    });

    // Search functionality
    if (searchBtn) {
        const searchWrapper = searchBtn.closest('.search-wrapper');
        const searchInput = searchWrapper.querySelector('.search-input');

        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            searchWrapper.classList.toggle('active');
            if (searchWrapper.classList.contains('active')) {
                searchInput.focus();
            }
        });

        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchWrapper.contains(e.target)) {
                searchWrapper.classList.remove('active');
            }
        });

        // Close search on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchWrapper.classList.contains('active')) {
                searchWrapper.classList.remove('active');
            }
        });
    }

    // Cart functionality
    const cartWrapper = cartBtn?.closest('.cart-wrapper');
    const cartItemsContainer = document.querySelector('.cart-items');
    const totalAmount = document.querySelector('.total-amount');
    const buyBtn = document.querySelector('.buy-btn');
    const qrModal = document.querySelector('.qr-modal');
    const qrContainer = document.querySelector('.qr-code');
    const closeQrBtn = document.querySelector('.close-qr');
    const countdown = document.querySelector('.countdown');
    let timer = null;

    function updateCartCount() {
        if (cartCount) {
            cartCount.textContent = cartItems.length;
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartUI();
        }
    }

    function updateCartUI() {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';
        let total = 0;

        cartItems.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">${item.price}</div>
                </div>
                <button class="remove-item" data-index="${index}">×</button>
            `;
            cartItemsContainer.appendChild(cartItem);

            // Add to total
            total += parseFloat(item.price.replace('$', ''));
        });

        totalAmount.textContent = `$${total.toFixed(2)}`;
        buyBtn.disabled = cartItems.length === 0;
    }

    // Load cart items from localStorage
    const savedCartItems = localStorage.getItem('cartItems');
    if (savedCartItems) {
        cartItems = JSON.parse(savedCartItems);
        updateCartCount();
    }

    // Cart dropdown toggle
    if (cartBtn && cartWrapper) {
        cartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cartWrapper.classList.toggle('active');
        });

        // Close cart when clicking outside
        document.addEventListener('click', (e) => {
            // Daftar elemen yang tidak boleh menutup cart saat diklik
            const isClickingCart = e.target.closest('.cart-wrapper');
            const isClickingAddToCart = e.target.closest('.btn-primary');
            const isRemoveButton = e.target.classList.contains('remove-item');

            // Jika klik di luar cart dan bukan tombol add/remove
            if (!isClickingCart && !isClickingAddToCart && !isRemoveButton) {
                cartWrapper.classList.remove('active');
            }
        });
    }

    // Remove item from cart
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item')) {
                e.stopPropagation(); // Prevent event bubbling
                const index = parseInt(e.target.dataset.index);
                cartItems.splice(index, 1);
                updateCartCount();
                // Keep cart open after removing item
                cartWrapper.classList.add('active');
            }
        });
    }

    // Buy functionality
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            if (cartItems.length === 0) return;

            // Pilih salah satu template QR code di bawah
            // Template 1: QRIS
            const qrisTemplate = "https://example.com/qris-code.png"; // Ganti dengan URL gambar QRIS Anda

            // Template 2: OVO
            const ovoTemplate = "https://example.com/ovo-code.png"; // Ganti dengan URL gambar OVO Anda

            // Template 3: DANA
            const danaTemplate = "https://example.com/dana-code.png"; // Ganti dengan URL gambar DANA Anda

            // Template 4: GoPay
            const gopayTemplate = "https://example.com/gopay-code.png"; // Ganti dengan URL gambar GoPay Anda

            // Pilih template yang ingin digunakan (ganti variabel sesuai kebutuhan)
            const selectedQR = qrisTemplate; // Ganti dengan template yang diinginkan

            qrContainer.innerHTML = `
                <img src="${selectedQR}" 
                    alt="QR Code Payment"
                    style="width: 200px; height: 200px;">
            `;            // Show QR modal
            qrModal.classList.add('active');

            // Start countdown
            let timeLeft = 300; // 5 minutes
            countdown.textContent = '05:00';

            if (timer) clearInterval(timer);
            timer = setInterval(() => {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                countdown.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

                if (timeLeft === 0) {
                    clearInterval(timer);
                    qrModal.classList.remove('active');
                }
            }, 1000);
        });
    }

    // Close QR modal
    if (closeQrBtn) {
        closeQrBtn.addEventListener('click', () => {
            qrModal.classList.remove('active');
            if (timer) {
                clearInterval(timer);
            }
        });
    }

    // Add to cart button functionality
    document.querySelectorAll('.btn-primary').forEach(button => {
        if (button.textContent === 'Add to Cart') {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                const productCard = button.closest('.product-card');
                const product = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: productCard.querySelector('h2').textContent,
                    price: productCard.querySelector('.price').textContent,
                    image: productCard.querySelector('img').src
                };

                cartItems.push(product);
                updateCartCount();

                // Keep cart open when adding items
                if (cartWrapper) {
                    cartWrapper.classList.add('active');
                }

                // Feedback animation
                button.textContent = 'Added!';
                button.style.backgroundColor = '#4CAF50';
                setTimeout(() => {
                    button.textContent = 'Add to Cart';
                    button.style.backgroundColor = '';
                }, 1000);
            });
        }
    });
});
