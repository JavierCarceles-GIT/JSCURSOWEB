// Aquí defino mi catálogo de productos inicial, es la base de datos estática de la tienda. 
// Cada objeto contiene el identificador único, su nombre, una descripción rolera y el precio base.
const INITIAL_PRODUCTS = [
    { id: "lol-01", name: "Skin Ahri Inmortalizada", desc: "Aspecto definitivo de colección histórica del Hall of Legends.", price: 250.00 },
    { id: "lol-02", name: "Skin Elementalista Lux", desc: "Aspecto definitivo con 10 transformaciones elementales elementales en partida.", price: 25.00 },
    { id: "lol-03", name: "Código 1380 Riot Points", desc: "Código digital global canjeable de inmediato por RP.", price: 10.99 },
    { id: "lol-04", name: "Skin Yasuo Portador de la Noche", desc: "Aspecto legendario que encarna el caos absoluto.", price: 15.00 },
    { id: "lol-05", name: "Skin Jinx Guardiana de las Estrellas", desc: "Aspecto legendario con efectos visuales cósmicos y mágicos.", price: 15.00 }
];

// Configuro los códigos de descuento de mis creadores de contenido aliados.
// Los guardo como un diccionario donde la clave es el código y el valor es el porcentaje a descontar (ej. 0.20 es un 20%).
const CREATOR_CODES = {
    "FAKER": 0.20, 
    "IBAI": 0.15, 
    "SKT1": 0.10  
};

// Compruebo si ya he generado un inventario para el usuario actual buscando en su almacenamiento local.
if (!localStorage.getItem('nexus_stock')) {
    // Como es su primera vez, creo un objeto vacío donde guardaré las cantidades.
    const generatedStock = {};
    
    // Recorro mi catálogo de productos para asignarles un stock inicial de forma manual y aleatoria.
    INITIAL_PRODUCTS.forEach((prod, index) => {
        // Al primer producto (Ahri) le pongo 0 de stock a propósito para probar el estado "Agotado".
        if (index === 0) generatedStock[prod.id] = 0;      
        // Al segundo le pongo muy poco (3 unidades) para forzar el aviso de "Pocas unidades".
        else if (index === 1) generatedStock[prod.id] = 3;   
        // Para el resto de mis productos, genero una cantidad aleatoria entre 5 y 10 unidades.
        else generatedStock[prod.id] = Math.floor(Math.random() * 6) + 5; 
    });
    
    // Guardo este nuevo inventario en el navegador del usuario para que no se reinicie si recarga la página.
    localStorage.setItem('nexus_stock', JSON.stringify(generatedStock));
}

// Rescato los datos guardados del usuario. Si no encuentro nada, le asigno los valores por defecto que considero oportunos:
// Un carrito vacío (array), cero puntos, y asumo que por defecto prefiere el modo oscuro.
let cart = JSON.parse(localStorage.getItem('nexus_cart')) || [];
let userPoints = parseInt(localStorage.getItem('nexus_user_points')) || 0;
let isDarkMode = localStorage.getItem('nexus_theme') !== 'light';

// A partir de aquí, capturo todos los elementos del HTML que voy a necesitar manipular.
// Los guardo en constantes para no tener que buscar en el DOM (lo cual es lento) cada vez que los necesite.
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

// Esta función es la encargada de dibujar los productos en la pantalla.
function renderProducts() {
    // Primero, me traigo los datos frescos del inventario desde el LocalStorage.
    const stockData = JSON.parse(localStorage.getItem('nexus_stock'));
    
    // Limpio cualquier producto que haya pintado antes en la cuadrícula para evitar duplicados.
    productsGrid.innerHTML = '';

    // Itero sobre cada producto de mi catálogo original para construir su tarjeta visual.
    INITIAL_PRODUCTS.forEach(prod => {
        const currentStock = stockData[prod.id];
        let stockText = '';
        let stockClass = '';
        let isBtnDisabled = false;

        // Evalúo el nivel de stock que me queda y configuro los textos, estilos y estado del botón de compra.
        if (currentStock === 0) {
            stockText = "producto agotado";
            stockClass = "agotado";
            isBtnDisabled = true; // Deshabilito el botón porque no me queda inventario para vender.
        } else if (currentStock < 5) {
            stockText = "Quedan pocas unidades";
            stockClass = "pocas";
        } else {
            stockText = "stock disponible";
            stockClass = "disponible";
        }

        // Creo dinámicamente un elemento <article> que representará la tarjeta de mi producto.
        const card = document.createElement('article');
        card.className = 'product-card';
        
        // Inyecto todo el HTML necesario para la tarjeta, metiendo las variables donde tocan.
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
        
        // Cuelgo la tarjeta recién creada en mi cuadrícula principal del HTML.
        productsGrid.appendChild(card);
    });

    // Una vez pintados todos los botones, les engancho un evento 'click'. 
    // Cuando el usuario pinche, llamo a mi función addToCart pasándole el ID del producto que sacó de un 'data-attribute'.
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.onclick = (e) => addToCart(e.target.dataset.id);
    });
}

// Aquí manejo la lógica para cuando alguien decide comprar un producto.
function addToCart(productId) {
    // Vuelvo a leer el inventario actual para asegurarme de que no me estén intentando comprar algo que ya se acabó.
    const stockData = JSON.parse(localStorage.getItem('nexus_stock'));

    if (stockData[productId] > 0) {
        // Meto el ID del producto en mi arreglo del carrito.
        cart.push(productId);
        
        // Le quito uno a la cantidad disponible de ese producto en mi tienda.
        stockData[productId] -= 1; 
        
        // Guardo ambos cambios inmediatamente en el navegador para no perder progreso si se cierra la pestaña.
        localStorage.setItem('nexus_cart', JSON.stringify(cart));
        localStorage.setItem('nexus_stock', JSON.stringify(stockData));
        
        // Vuelvo a dibujar los productos (para que se actualice el contador de stock visual) y recalculo la vista del carrito.
        renderProducts();
        updateCartState();
    }
}

// Uso esta función para actualizar todos los números y mensajes relacionados con la compra actual.
function updateCartState() {
    // Cuento cuántos elementos tengo guardados en el carrito y actualizo la bolita del contador.
    const totalItems = cart.length;
    cartCount.textContent = totalItems;

    // Me pongo un poco creativo y le cambio el mensaje de la cabecera al usuario según cuánto esté comprando.
    if (totalItems === 0) {
        cartMessage.textContent = "Tu carrito esta triste";
    } else if (totalItems === 1) {
        cartMessage.textContent = "Has añadido tu primer producto";
    } else if (totalItems >= 5) {
        cartMessage.textContent = "Esto ya parece una coleccion";
    } else {
        cartMessage.textContent = "Tu arsenal sigue creciendo";
    }

    // Calculo el dinero que cuesta todo en bruto, sumando los precios de los IDs que tengo en mi carrito.
    let subtotal = 0;
    cart.forEach(itemId => {
        const product = INITIAL_PRODUCTS.find(p => p.id === itemId);
        if (product) subtotal += product.price;
    });

    // Capturo lo que el usuario haya escrito en la caja del código de creador y lo paso a mayúsculas para evitar errores.
    const enteredCode = creatorCodeInput.value.trim().toUpperCase();
    let discountRate = 0;

    // Compruebo si el código que me han escrito existe en mi lista de códigos válidos.
    if (CREATOR_CODES.hasOwnProperty(enteredCode)) {
        // Si existe, le asigno el descuento correspondiente y le muestro un mensaje de éxito en color verde.
        discountRate = CREATOR_CODES[enteredCode];
        successCodeEl.textContent = `¡Código aplicado! Descuento del ${(discountRate * 100)}%`;
        successCodeEl.style.color = "var(--success)";
    } else {
        // Si me escribió algo pero es incorrecto, le lanzo un error. Si está vacío, simplemente borro cualquier mensaje.
        if (enteredCode !== "") {
            successCodeEl.textContent = "Código de creador no válido.";
            successCodeEl.style.color = "var(--error)";
        } else {
            successCodeEl.textContent = "";
        }
    }

    // Hago las matemáticas: saco cuánto dinero le quito y cuánto tiene que pagar finalmente.
    const discountAmount = subtotal * discountRate;
    const finalTotal = subtotal - discountAmount;

    // Imprimo estos cálculos en los elementos HTML correspondientes, asegurándome de dejar solo 2 decimales.
    subtotalPriceEl.textContent = subtotal.toFixed(2);
    discountAmountEl.textContent = discountAmount.toFixed(2);
    totalPriceEl.textContent = finalTotal.toFixed(2);

    // Aprovecho para actualizar también el perfil del usuario (puntos y nivel).
    updateUserUI();
}

// Mantengo actualizados los puntos y el nivel de experiencia del usuario en la interfaz.
function updateUserUI() {
    // Pinto sus puntos actuales en pantalla.
    userPointsEl.textContent = userPoints;

    // Evalúo en qué rango debería estar dependiendo de sus puntos acumulados y le doy un color chulo a su nivel.
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

// Intercepto el momento en que el usuario le da al botón de Pagar/Submit.
checkoutForm.onsubmit = function(event) {
    // Freno el comportamiento natural del formulario para que la página no se recargue y yo pueda validar los datos con JavaScript.
    event.preventDefault(); 

    // Capturo los inputs del formulario y los espacios donde voy a escupir los errores.
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const errorUsername = document.getElementById('error-username');
    const errorEmail = document.getElementById('error-email');

    // Creo una bandera (flag) para saber si todo está correcto antes de cobrarle.
    let isFormValid = true;

    // Valido el nombre: exijo que tenga al menos 3 letras. Si no, le pinto todo de rojo y bajo la bandera.
    if (usernameInput.value.trim().length < 3) {
        errorUsername.textContent = "❌ El nombre del invocador debe tener al menos 3 caracteres.";
        usernameInput.setAttribute('aria-invalid', 'true');
        isFormValid = false;
    } else {
        // Si lo hizo bien, le pongo el visto bueno.
        errorUsername.textContent = "✅ Campo correcto.";
        errorUsername.style.color = "var(--success)";
        usernameInput.setAttribute('aria-invalid', 'false');
    }

    // Uso una expresión regular (Regex) para comprobar que el correo tenga formato de correo real (texto@texto.texto).
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
        // Si me intentan colar algo raro, marco error y bajo la bandera de validez.
        errorEmail.textContent = "❌ Introduce una dirección de correo válida para el envío electrónico.";
        emailInput.setAttribute('aria-invalid', 'true');
        isFormValid = false;
    } else {
        // Está perfecto.
        errorEmail.textContent = "✅ Campo correcto.";
        errorEmail.style.color = "var(--success)";
        emailInput.setAttribute('aria-invalid', 'false');
    }

    // También me aseguro de que no me estén intentando hacer una compra sin llevarse nada.
    if (cart.length === 0) {
        alert("Tu carrito está vacío. Añade productos antes de procesar el pago.");
        isFormValid = false;
    }

    // Si logró pasar todas mis trampas y el formulario es válido, proceso la orden de compra.
    if (isFormValid) {
        // Saco el total definitivo que calculé en la interfaz.
        const finalCost = parseFloat(totalPriceEl.textContent);

        // Le recompenso con 10 puntos por cada bloque de 15€ que se gastó. Hago un Math.floor para redondear hacia abajo.
        const pointsEarned = Math.floor(finalCost / 15) * 10;
        
        // Le sumo los puntos y guardo su nuevo progreso en su disco local.
        userPoints += pointsEarned;
        localStorage.setItem('nexus_user_points', userPoints);

        // Construyo un mensaje de victoria con temática épica usando los datos que me proporcionó.
        checkoutResult.innerHTML = `
            <h3>⚔️ ¡Transacción Completada con Éxito! ⚔️</h3>
            <p>Gracias por tu compra, invocador <strong>${usernameInput.value.trim()}</strong>.</p>
            <p>Los códigos han sido emitidos directamente hacia: <em>${emailInput.value.trim()}</em>.</p>
            <p>Total facturado: <strong>${finalCost.toFixed(2)}€</strong></p>
            <p>Puntos de fidelidad ganados en esta sesión: <span style="color: var(--success)">+${pointsEarned} LP</span></p>
            <p style="margin-top:0.5rem; font-size:0.85rem; color:var(--text-secondary);">El nexo se ha refrescado. Tu inventario está asegurado.</p>
        `;
        
        // Quito la clase que oculta este mensaje para que pueda leerlo.
        checkoutResult.classList.remove('hidden');

        // Como ya pagó, le vacío el carrito virtual y actualizo ese estado en el LocalStorage.
        cart = [];
        localStorage.setItem('nexus_cart', JSON.stringify(cart));

        // Reseteo por completo su formulario para dejar la tienda como nueva y limpio los mensajitos de validación.
        checkoutForm.reset();
        errorUsername.textContent = "";
        errorEmail.textContent = "";
        
        // Vuelvo a llamar a mi función para que ponga los precios a cero y borre los descuentos.
        updateCartState();
    }
};

// Esta pequeña función me sirve para alternar las clases de CSS que controlan los colores de día y noche.
function initTheme() {
    if (!isDarkMode) {
        // Si no le gusta el modo oscuro, le añado la clase light-mode y cambio el texto del botón.
        document.body.classList.add('light-mode');
        themeToggleBtn.textContent = "☀️ Modo Día";
    } else {
        // Si prefiere el oscuro, le quito la clase clara y dejo el modo nocturno.
        document.body.classList.remove('light-mode');
        themeToggleBtn.textContent = "🌙 Modo Noche";
    }
}

// Añado un escuchador al botón del sol/luna. 
themeToggleBtn.onclick = () => {
    // Cuando lo pulsa, invierto mi variable (si era true la paso a false, y viceversa).
    isDarkMode = !isDarkMode;
    // Guardo su nueva preferencia en el navegador para la próxima vez que entre.
    localStorage.setItem('nexus_theme', isDarkMode ? 'dark' : 'light');
    // Vuelvo a correr la lógica gráfica.
    initTheme();
};

// Le pongo un evento "oninput" a la caja del código de creador.
// Esto hace que, conforme va tecleando letra por letra, mi carrito se recalcule en vivo sin tener que darle a un botón de "Aplicar".
creatorCodeInput.oninput = () => updateCartState();

// Por último, cuando arranca el script por primera vez, ejecuto las funciones base para pintar todo en pantalla.
initTheme();
renderProducts();
updateCartState();