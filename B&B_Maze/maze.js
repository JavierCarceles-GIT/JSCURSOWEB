// =========================================================
// 1. VARIABLES GLOBALES
// =========================================================

// Variable para el tamaño total de la cuadrícula (filas y columnas)
let size; 

// Matriz lógica del laberinto (1 = pared, 0 = camino)
let grid = []; 

// Matriz que guardará las referencias a los elementos HTML (divs) de cada celda
let domGrid = []; 

// Referencia al contenedor HTML donde se dibujará el laberinto
const container = document.getElementById('mazeContainer');

// Variables globales anexadas a 'window' para guardar las coordenadas de inicio y fin.
// Se inicializan en (1,1) por defecto.
window.startX = 1;
window.startY = 1;
window.endX = 1;
window.endY = 1;

// =========================================================
// 2. FUNCIÓN PRINCIPAL DE INICIALIZACIÓN Y GENERACIÓN
// =========================================================
function initMaze() {
    // Limpieza de intervalos (útil si había una animación de resolución ejecutándose)
    if (window.solveInterval) clearInterval(window.solveInterval);

    // Reinicio de la interfaz de usuario (UI) de los algoritmos (limpia tiempos y costes)
    const algorithms = ['ASTAR', 'BB', 'GREEDY', 'BACKTRACKING', 'BRUTEFORCE'];
    algorithms.forEach(algo => {
        let row = document.getElementById('row-' + algo);
        if (row) {
            row.querySelector('.time').innerText = "-";
            row.querySelector('.cost').innerText = "-";
        }
    });
    
    // Obtención y cálculo del tamaño del laberinto
    let inputSize = parseInt(document.getElementById('size').value);
    // Se multiplica por 2 y se suma 1 para garantizar que el tamaño sea siempre IMPAR.
    // (Necesario para que siempre haya paredes entre los caminos).
    size = inputSize * 2 + 1; 
    
    // Inicialización de las matrices: 
    // grid se llena de 1s (todo pared), domGrid se llena de nulls.
    grid = Array.from({ length: size }, () => Array(size).fill(1));
    domGrid = Array.from({ length: size }, () => Array(size).fill(null));
    
    // Preparación para el algoritmo "Recursive Backtracking"
    let stack = []; // Pila para retroceder cuando lleguemos a un callejón sin salida
    let current = { x: 1, y: 1 }; // Celda de inicio de la excavación
    grid[current.y][current.x] = 0; // Marcamos la celda inicial como camino (0)
    
    // Bucle principal de generación del laberinto
    let generating = true;
    while (generating) {
        // Obtenemos los vecinos a 2 saltos de distancia a los que podemos excavar
        let neighbors = getGenerationNeighbors(current.x, current.y);
        
        if (neighbors.length > 0) {
            // Si hay vecinos válidos, elegimos uno al azar
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            // Calculamos las coordenadas de la pared que está ENTRE la celda actual y la elegida
            let wallX = current.x + (next.x - current.x) / 2;
            let wallY = current.y + (next.y - current.y) / 2;
            
            // Derribamos la pared intermedia y marcamos la celda destino como camino
            grid[wallY][wallX] = 0;
            grid[next.y][next.x] = 0; 
            
            // Guardamos la celda actual en la pila por si necesitamos retroceder
            stack.push(current);
            // Avanzamos a la nueva celda
            current = next;
        } else if (stack.length > 0) {
            // Si NO hay vecinos disponibles (callejón sin salida), retrocedemos usando la pila
            current = stack.pop();
        } else {
            // Si la pila está vacía, hemos terminado de generar el laberinto
            generating = false;
        }
    }
    
    // Fases finales de post-procesamiento
    createMultipleSolutions(0.05); // Elimina un 5% extra de paredes para crear rutas alternativas
    selectRandomStartEnd();        // Elige aleatoriamente las posiciones de inicio y fin
    renderMaze();                  // Dibuja el laberinto en el DOM
}

// =========================================================
// 3. FUNCIÓN PARA BUSCAR VECINOS DURANTE LA GENERACIÓN
// =========================================================
function getGenerationNeighbors(x, y) {
    let neighbors = [];
    // Posibles movimientos de 2 en 2 celdas (Arriba, Derecha, Abajo, Izquierda)
    let directions = [
        { x: x, y: y - 2 },
        { x: x + 2, y: y },
        { x: x, y: y + 2 },
        { x: x - 2, y: y }
    ];
    
    // Verificamos si los movimientos son válidos
    for (let dir of directions) {
        // Comprobamos que no nos salimos de los bordes del laberinto
        if (dir.x > 0 && dir.x < size - 1 && dir.y > 0 && dir.y < size - 1) {
            // Si la celda de destino sigue siendo pared (1), es un vecino válido
            if (grid[dir.y][dir.x] === 1) { 
                neighbors.push(dir);
            }
        }
    }
    return neighbors;
}

// =========================================================
// 4. FUNCIÓN PARA CREAR MÚLTIPLES CAMINOS (BRAID MAZE)
// =========================================================
function createMultipleSolutions(percentage) {
    let candidates = [];
    
    // Escaneamos el interior del laberinto buscando paredes rompibles
    for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
            // Solo analizamos las celdas que son paredes (1)
            if (grid[y][x] === 1) {
                // Comprobamos la disposición de las celdas adyacentes
                let pathLeftRight = (grid[y][x-1] === 0 && grid[y][x+1] === 0);
                let wallTopBottom = (grid[y-1][x] === 1 && grid[y+1][x] === 1);
                
                let pathTopBottom = (grid[y-1][x] === 0 && grid[y+1][x] === 0);
                let wallLeftRight = (grid[y][x-1] === 1 && grid[y][x+1] === 1);
                
                // Si la pared separa dos caminos rectos (horizontales o verticales), es candidata
                if ((pathLeftRight && wallTopBottom) || (pathTopBottom && wallLeftRight)) {
                    candidates.push({ x: x, y: y });
                }
            }
        }
    }
    
    if (candidates.length === 0) return;

    // Calculamos cuántas paredes derribar según el porcentaje dado
    let wallsToRemove = Math.floor(candidates.length * percentage);
    if (wallsToRemove < 1) wallsToRemove = 1; // Al menos quitamos 1 pared
    wallsToRemove = Math.min(wallsToRemove, candidates.length); // Evitamos desbordamientos
    
    // Derribamos las paredes seleccionadas al azar
    for (let i = 0; i < wallsToRemove; i++) {
        let randomIndex = Math.floor(Math.random() * candidates.length);
        let cell = candidates[randomIndex];
        grid[cell.y][cell.x] = 0; // La convertimos en camino
        candidates.splice(randomIndex, 1); // La quitamos de la lista para no repetirla
    }
}

// =========================================================
// 5. FUNCIÓN PARA ASIGNAR INICIO Y FIN ALEATORIOS
// =========================================================
function selectRandomStartEnd() {
    let pathCells = [];

    // Recopilamos todas las celdas que son camino (0)
    for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
            if (grid[y][x] === 0) {
                pathCells.push({ x: x, y: y });
            }
        }
    }

    // Seleccionamos la celda de INICIO al azar y la sacamos del array
    let startIdx = Math.floor(Math.random() * pathCells.length);
    let startCell = pathCells.splice(startIdx, 1)[0]; 
    window.startX = startCell.x;
    window.startY = startCell.y;

    // Calculamos una distancia mínima esperada para que no queden muy juntos
    let minDistance = Math.floor(size / 2); 
    
    // Filtramos las celdas restantes que cumplan esa distancia mínima
    let validEndCells = pathCells.filter(c => 
        (Math.abs(c.x - window.startX) + Math.abs(c.y - window.startY)) >= minDistance
    );

    // Si el laberinto es muy pequeño y no hay celdas que cumplan, usamos cualquiera
    if (validEndCells.length === 0) validEndCells = pathCells;

    // Seleccionamos la celda de FIN al azar entre las válidas
    let endCell = validEndCells[Math.floor(Math.random() * validEndCells.length)];
    window.endX = endCell.x;
    window.endY = endCell.y;
}

// =========================================================
// 6. FUNCIÓN DE RENDERIZADO VISUAL
// =========================================================
function renderMaze() {
    // Vaciamos el contenedor HTML
    container.innerHTML = '';
    
    // Configuramos la cuadrícula de CSS Grid según el tamaño
    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    
    // Recorremos la matriz lógica para crear los elementos visuales
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let div = document.createElement('div');
            div.classList.add('cell'); // Clase base para cada cuadro
            
            // Asignamos estilo visual de pared o camino
            if (grid[y][x] === 1) {
                div.classList.add('wall');
            } else {
                div.classList.add('path');
            }
            
            // Destacamos visualmente las celdas de inicio y fin
            if (x === window.startX && y === window.startY) div.classList.add('start');
            if (x === window.endX && y === window.endY) div.classList.add('end');
            
            // Insertamos el div en el HTML
            container.appendChild(div);
            // Guardamos la referencia HTML en la matriz domGrid para uso futuro
            domGrid[y][x] = div; 
        }
    }
}

// Al cargar la ventana, ejecutamos la función principal para generar el laberinto
window.onload = initMaze;