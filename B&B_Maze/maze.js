let size; 
let grid = []; 
let domGrid = []; 
const container = document.getElementById('mazeContainer');

window.startX = 1;
window.startY = 1;
window.endX = 1;
window.endY = 1;

function initMaze() {
    if (window.solveInterval) clearInterval(window.solveInterval);

    const algorithms = ['ASTAR', 'BB', 'GREEDY', 'BACKTRACKING', 'BRUTEFORCE'];
    algorithms.forEach(algo => {
        let row = document.getElementById('row-' + algo);
        if (row) {
            row.querySelector('.time').innerText = "-";
            row.querySelector('.cost').innerText = "-";
        }
    });
    
    let inputSize = parseInt(document.getElementById('size').value);
    size = inputSize * 2 + 1; 
    
    grid = Array.from({ length: size }, () => Array(size).fill(1));
    domGrid = Array.from({ length: size }, () => Array(size).fill(null));
    
    let stack = [];
    let current = { x: 1, y: 1 };
    grid[current.y][current.x] = 0; 
    
    let generating = true;
    while (generating) {
        let neighbors = getGenerationNeighbors(current.x, current.y);
        if (neighbors.length > 0) {
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            let wallX = current.x + (next.x - current.x) / 2;
            let wallY = current.y + (next.y - current.y) / 2;
            grid[wallY][wallX] = 0;
            grid[next.y][next.x] = 0; 
            
            stack.push(current);
            current = next;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            generating = false;
        }
    }
    
    createMultipleSolutions(0.05);
    selectRandomStartEnd();
    renderMaze();
}

function getGenerationNeighbors(x, y) {
    let neighbors = [];
    let directions = [
        { x: x, y: y - 2 },
        { x: x + 2, y: y },
        { x: x, y: y + 2 },
        { x: x - 2, y: y }
    ];
    
    for (let dir of directions) {
        if (dir.x > 0 && dir.x < size - 1 && dir.y > 0 && dir.y < size - 1) {
            if (grid[dir.y][dir.x] === 1) { 
                neighbors.push(dir);
            }
        }
    }
    return neighbors;
}

function createMultipleSolutions(percentage) {
    let candidates = [];
    for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
            if (grid[y][x] === 1) {
                let pathLeftRight = (grid[y][x-1] === 0 && grid[y][x+1] === 0);
                let wallTopBottom = (grid[y-1][x] === 1 && grid[y+1][x] === 1);
                
                let pathTopBottom = (grid[y-1][x] === 0 && grid[y+1][x] === 0);
                let wallLeftRight = (grid[y][x-1] === 1 && grid[y][x+1] === 1);
                
                if ((pathLeftRight && wallTopBottom) || (pathTopBottom && wallLeftRight)) {
                    candidates.push({ x: x, y: y });
                }
            }
        }
    }
    
    if (candidates.length === 0) return;

    let wallsToRemove = Math.floor(candidates.length * percentage);
    if (wallsToRemove < 1) wallsToRemove = 1;
    wallsToRemove = Math.min(wallsToRemove, candidates.length);
    
    for (let i = 0; i < wallsToRemove; i++) {
        let randomIndex = Math.floor(Math.random() * candidates.length);
        let cell = candidates[randomIndex];
        grid[cell.y][cell.x] = 0; 
        candidates.splice(randomIndex, 1);
    }
}

function selectRandomStartEnd() {
    let pathCells = [];

    for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
            if (grid[y][x] === 0) {
                pathCells.push({ x: x, y: y });
            }
        }
    }

    let startIdx = Math.floor(Math.random() * pathCells.length);
    let startCell = pathCells.splice(startIdx, 1)[0]; // Lo sacamos para no repetir
    window.startX = startCell.x;
    window.startY = startCell.y;

    let minDistance = Math.floor(size / 2);
    let validEndCells = pathCells.filter(c => 
        (Math.abs(c.x - window.startX) + Math.abs(c.y - window.startY)) >= minDistance
    );

    if (validEndCells.length === 0) validEndCells = pathCells;

    let endCell = validEndCells[Math.floor(Math.random() * validEndCells.length)];
    window.endX = endCell.x;
    window.endY = endCell.y;
}

function renderMaze() {
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let div = document.createElement('div');
            div.classList.add('cell');
            
            if (grid[y][x] === 1) {
                div.classList.add('wall');
            } else {
                div.classList.add('path');
            }
            
            if (x === window.startX && y === window.startY) div.classList.add('start');
            if (x === window.endX && y === window.endY) div.classList.add('end');
            
            container.appendChild(div);
            domGrid[y][x] = div; 
        }
    }
}

window.onload = initMaze;