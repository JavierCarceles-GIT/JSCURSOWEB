const INITIAL_PRODUCTS = [
    { id: "lol-01", name: "Skin Ahri Inmortalizada", desc: "Aspecto definitivo de colección histórica del Hall of Legends.", price: 250.00 },
    { id: "lol-02", name: "Skin Elementalista Lux", desc: "Aspecto definitivo con 10 transformaciones elementales elementales en partida.", price: 25.00 },
    { id: "lol-03", name: "Código 1380 Riot Points", desc: "Código digital global canjeable de inmediato por RP.", price: 10.99 },
    { id: "lol-04", name: "Skin Yasuo Portador de la Noche", desc: "Aspecto legendario que encarna el caos absoluto.", price: 15.00 },
    { id: "lol-05", name: "Skin Jinx Guardiana de las Estrellas", desc: "Aspecto legendario con efectos visuales cósmicos y mágicos.", price: 15.00 }
];

const CREATOR_CODES = {
    "FAKER": 0.20, 
    "IBAI": 0.15, 
    "SKT1": 0.10  
};

if (!localStorage.getItem('nexus_stock')) {
    const generatedStock = {};
    INITIAL_PRODUCTS.forEach((prod, index) => {
        if (index === 0) generatedStock[prod.id] = 0;      
        else if (index === 1) generatedStock[prod.id] = 3;   
        else generatedStock[prod.id] = Math.floor(Math.random() * 6) + 5; 
    });
    localStorage.setItem('nexus_stock', JSON.stringify(generatedStock));
}

let cart = JSON.parse(localStorage.getItem('nexus_cart')) || [];
let userPoints = parseInt(localStorage.getItem('nexus_user_points')) || 0;
let isDarkMode = localStorage.getItem('nexus_theme') !== 'light';

const productsGrid = document.getElementById('products-grid');
const cartMessage = document.getElementById('cart-message');
const cartCount = document.getElementById('cart-count');
const subtotalPriceEl = document.getElementById('subtotal-price');
const discountAmountEl = document.getElementById('discount-amount');
const totalPriceEl = document.getElementById('total-price');
const userLevelEl = document.getElementById('user-level');
const userPointsEl = document.getElementById('user-points');
const themeToggleBtn = document.getElementById('theme-toggle');
const checkoutForm = document.getElementById('checkout-form');
const checkoutResult = document.getElementById('checkout-result');
const creatorCodeInput = document.getElementById('creator-code');
const successCodeEl = document.getElementById('success-code');

function renderProducts() {
    const stockData = JSON.parse(localStorage.getItem('nexus_stock'));
    productsGrid.innerHTML = '';

    INITIAL_PRODUCTS.forEach(prod => {
        const currentStock = stockData[prod.id];
        let stockText = '';
        let stockClass = '';
        let isBtnDisabled = false;

        if (currentStock === 0) {
            stockText = "producto agotado";
            stockClass = "agotado";
            isBtnDisabled = true;
        } else if (currentStock < 5) {
            stockText = "Quedan pocas unidades";
            stockClass = "pocas";
        } else {
            stockText = "stock disponible";
            stockClass = "disponible";
        }

        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
            <div>
                <h3 class="prod-title">${prod.name}</h3>
                <p class="prod-desc">${prod.desc}</p>
            </div>
            <div>
                <span class="stock-badge ${stockClass}">${stockText} (${currentStock} ud)</span>
                <p class="prod-price">${prod.price.toFixed(2)}€</p>
                <button class="btn-add" ${isBtnDisabled ? 'disabled' : ''} data-id="${prod.id}">
                    ${currentStock === 0 ? 'Sin Stock' : 'Añadir al nexo'}
                </button>
            </div>
        `;
        productsGrid.appendChild(card);
    });

    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.onclick = (e) => addToCart(e.target.dataset.id);
    });
}

function addToCart(productId) {
    const stockData = JSON.parse(localStorage.getItem('nexus_stock'));

    if (stockData[productId] > 0) {
        cart.push(productId);
        stockData[productId] -= 1; 
        
        localStorage.setItem('nexus_cart', JSON.stringify(cart));
        localStorage.setItem('nexus_stock', JSON.stringify(stockData));
        
        renderProducts();
        updateCartState();
    }
}

function updateCartState() {
    const totalItems = cart.length;
    cartCount.textContent = totalItems;

    if (totalItems === 0) {
        cartMessage.textContent = "Tu carrito esta triste";
    } else if (totalItems === 1) {
        cartMessage.textContent = "Has añadido tu primer producto";
    } else if (totalItems >= 5) {
        cartMessage.textContent = "Esto ya parece una coleccion";
    } else {
        cartMessage.textContent = "Tu arsenal sigue creciendo";
    }

    let subtotal = 0;
    cart.forEach(itemId => {
        const product = INITIAL_PRODUCTS.find(p => p.id === itemId);
        if (product) subtotal += product.price;
    });

    const enteredCode = creatorCodeInput.value.trim().toUpperCase();
    let discountRate = 0;

    if (CREATOR_CODES.hasOwnProperty(enteredCode)) {
        discountRate = CREATOR_CODES[enteredCode];
        successCodeEl.textContent = `¡Código aplicado! Descuento del ${(discountRate * 100)}%`;
        successCodeEl.style.color = "var(--success)";
    } else {
        if (enteredCode !== "") {
            successCodeEl.textContent = "Código de creador no válido.";
            successCodeEl.style.color = "var(--error)";
        } else {
            successCodeEl.textContent = "";
        }
    }

    const discountAmount = subtotal * discountRate;
    const finalTotal = subtotal - discountAmount;

    subtotalPriceEl.textContent = subtotal.toFixed(2);
    discountAmountEl.textContent = discountAmount.toFixed(2);
    totalPriceEl.textContent = finalTotal.toFixed(2);

    updateUserUI();
}

function updateUserUI() {
    userPointsEl.textContent = userPoints;

    if (userPoints >= 20) {
        userLevelEl.textContent = "Premium";
        userLevelEl.style.color = "var(--accent)";
    } else if (userPoints >= 10) {
        userLevelEl.textContent = "Intermedio";
        userLevelEl.style.color = "var(--border-color)";
    } else {
        userLevelEl.textContent = "Principiante";
        userLevelEl.style.color = "var(--text-secondary)";
    }
}

checkoutForm.onsubmit = function(event) {
    event.preventDefault(); 

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const errorUsername = document.getElementById('error-username');
    const errorEmail = document.getElementById('error-email');

    let isFormValid = true;

    if (usernameInput.value.trim().length < 3) {
        errorUsername.textContent = "❌ El nombre del invocador debe tener al menos 3 caracteres.";
        usernameInput.setAttribute('aria-invalid', 'true');
        isFormValid = false;
    } else {
        errorUsername.textContent = "✅ Campo correcto.";
        errorUsername.style.color = "var(--success)";
        usernameInput.setAttribute('aria-invalid', 'false');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
        errorEmail.textContent = "❌ Introduce una dirección de correo válida para el envío electrónico.";
        emailInput.setAttribute('aria-invalid', 'true');
        isFormValid = false;
    } else {
        errorEmail.textContent = "✅ Campo correcto.";
        errorEmail.style.color = "var(--success)";
        emailInput.setAttribute('aria-invalid', 'false');
    }

    if (cart.length === 0) {
        alert("Tu carrito está vacío. Añade productos antes de procesar el pago.");
        isFormValid = false;
    }

    if (isFormValid) {
        const finalCost = parseFloat(totalPriceEl.textContent);

        const pointsEarned = Math.floor(finalCost / 15) * 10;
        userPoints += pointsEarned;
        localStorage.setItem('nexus_user_points', userPoints);

        checkoutResult.innerHTML = `
            <h3>⚔️ ¡Transacción Completada con Éxito! ⚔️</h3>
            <p>Gracias por tu compra, invocador <strong>${usernameInput.value.trim()}</strong>.</p>
            <p>Los códigos han sido emitidos directamente hacia: <em>${emailInput.value.trim()}</em>.</p>
            <p>Total facturado: <strong>${finalCost.toFixed(2)}€</strong></p>
            <p>Puntos de fidelidad ganados en esta sesión: <span style="color: var(--success)">+${pointsEarned} LP</span></p>
            <p style="margin-top:0.5rem; font-size:0.85rem; color:var(--text-secondary);">El nexo se ha refrescado. Tu inventario está asegurado.</p>
        `;
        
        checkoutResult.classList.remove('hidden');

        cart = [];
        localStorage.setItem('nexus_cart', JSON.stringify(cart));

        checkoutForm.reset();
        errorUsername.textContent = "";
        errorEmail.textContent = "";
        updateCartState();
    }
};

function initTheme() {
    if (!isDarkMode) {
        document.body.classList.add('light-mode');
        themeToggleBtn.textContent = "☀️ Modo Día";
    } else {
        document.body.classList.remove('light-mode');
        themeToggleBtn.textContent = "🌙 Modo Noche";
    }
}

themeToggleBtn.onclick = () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('nexus_theme', isDarkMode ? 'dark' : 'light');
    initTheme();
};

creatorCodeInput.oninput = () => updateCartState();

initTheme();
renderProducts();
updateCartState();