let activePaths = [];
let bestPath = null;
let bestCost = Infinity;
let minCostToCell = [];
let currentAlgorithm = "HOLIWIS";
let startTime = 0;
let lastPath = [];

function startSolving(algorithm = "ASTAR") {
  if (window.solveInterval) clearInterval(window.solveInterval);

  currentAlgorithm = algorithm;
  resetVisuals();

  activePaths = [];
  bestPath = null;
  bestCost = Infinity;
  lastPath = [];

  minCostToCell = Array.from({ length: size }, () =>
    Array(size).fill(Infinity),
  );

  let sX = window.startX;
  let sY = window.startY;
  let eX = window.endX;
  let eY = window.endY;

  let initialH = manhattanDistance(sX, sY, eX, eY);

  activePaths.push({
    x: sX,
    y: sY,
    cost: 0,
    h: initialH,
    path: [[sX, sY]],
  });

  minCostToCell[sY][sX] = 0;

  let row = document.getElementById("row-" + currentAlgorithm);
  if (row) {
    row.querySelector(".time").innerText = "Calculando...";
    row.querySelector(".cost").innerText = "...";
  }

  startTime = performance.now();
  window.solveInterval = setInterval(solveStep, 5);
}

function manhattanDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function getAccessibleNeighbors(x, y) {
  let neighbors = [];
  let directions = [
    { x: x, y: y - 1 },
    { x: x + 1, y: y },
    { x: x, y: y + 1 },
    { x: x - 1, y: y },
  ];

  for (let dir of directions) {
    if (dir.x >= 0 && dir.x < size && dir.y >= 0 && dir.y < size) {
      if (grid[dir.y][dir.x] === 0) {
        neighbors.push(dir);
      }
    }
  }
  return neighbors;
}

function solveStep() {
  if (activePaths.length === 0) {
    clearInterval(window.solveInterval);

    let endTime = performance.now();
    let rawTime = endTime - startTime;
    let timeString =
      rawTime < 1000
        ? Math.round(rawTime) + " ms"
        : rawTime < 60000
          ? (rawTime / 1000).toFixed(2) + " s"
          : Math.floor(rawTime / 60000) +
            " m " +
            Math.floor((rawTime % 60000) / 1000) +
            " s";

    let row = document.getElementById("row-" + currentAlgorithm);

    if (bestPath) {
      resetVisuals();
      drawSolutionPath(bestPath);
      if (row) {
        row.querySelector(".time").innerText = timeString;
        row.querySelector(".cost").innerText = bestCost;
      }
      console.log(
        `Camino calculado mediante ${currentAlgorithm}. Coste total:`,
        bestCost,
      );
    } else {
      if (row) {
        row.querySelector(".time").innerText = timeString;
        row.querySelector(".cost").innerText = "Sin salida";
      }
      alert("No hay caminos disponibles a la meta.");
    }
    return;
  }

  if (currentAlgorithm === "ASTAR") {
    activePaths.sort((a, b) => a.cost + a.h - (b.cost + b.h));
  } else if (currentAlgorithm === "BB") {
    activePaths.sort((a, b) => a.cost - b.cost);
  } else if (currentAlgorithm === "GREEDY") {
    activePaths.sort((a, b) => a.h - b.h);
  }

  let currentBranch;
  if (currentAlgorithm === "BACKTRACKING") {
    currentBranch = activePaths.pop();
  } else {
    currentBranch = activePaths.shift();
  }

  let cx = currentBranch.x;
  let cy = currentBranch.y;

  if (
    currentAlgorithm === "ASTAR" &&
    currentBranch.cost + currentBranch.h >= bestCost
  )
    return;
  if (currentAlgorithm === "BB" && currentBranch.cost >= bestCost) return;
  if (currentAlgorithm === "BACKTRACKING" && currentBranch.cost >= bestCost)
    return;

  if (
    currentAlgorithm === "BACKTRACKING" ||
    currentAlgorithm === "BRUTEFORCE"
  ) {
    for (let coord of lastPath) {
      let py = coord[1];
      let px = coord[0];
      if (domGrid[py] && domGrid[py][px]) {
        domGrid[py][px].classList.remove("exploring");
      }
    }

    for (let coord of currentBranch.path) {
      colorCell(coord[0], coord[1], "exploring");
    }

    lastPath = currentBranch.path;
  } else {
    colorCell(cx, cy, "exploring");
  }

  if (cx === window.endX && cy === window.endY) {
    if (currentBranch.cost < bestCost) {
      bestCost = currentBranch.cost;
      bestPath = currentBranch.path;
    }

    if (
      currentAlgorithm === "GREEDY" ||
      currentAlgorithm === "BRUTEFORCE"
    ) {
      activePaths = [];
    }
    return;
  }

  let neighbors = getAccessibleNeighbors(cx, cy);

  for (let next of neighbors) {
    let newCost = currentBranch.cost + 1;

    if (newCost < minCostToCell[next.y][next.x]) {
      minCostToCell[next.y][next.x] = newCost;

      let newH = manhattanDistance(next.x, next.y, window.endX, window.endY);

      let shouldAdd = false;
      if (currentAlgorithm === "ASTAR" && newCost + newH < bestCost)
        shouldAdd = true;
      if (currentAlgorithm === "BB" && newCost < bestCost) shouldAdd = true;
      if (currentAlgorithm === "GREEDY") shouldAdd = true;
      if (currentAlgorithm === "BRUTEFORCE") shouldAdd = true;
      if (currentAlgorithm === "BACKTRACKING" && newCost < bestCost)
        shouldAdd = true;

      if (shouldAdd) {
        activePaths.push({
          x: next.x,
          y: next.y,
          cost: newCost,
          h: newH,
          path: [...currentBranch.path, [next.x, next.y]],
        });
      }
    }
  }
}

function colorCell(x, y, className) {
  if (
    (x === window.startX && y === window.startY) ||
    (x === window.endX && y === window.endY)
  )
    return;
  if (domGrid[y][x]) {
    domGrid[y][x].classList.remove("exploring", "solution");
    domGrid[y][x].classList.add(className);
  }
}

function resetVisuals() {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (domGrid[y][x]) {
        domGrid[y][x].classList.remove("exploring", "solution");
      }
    }
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function drawSolutionPath(path) {
  for (let coord of path) {
    colorCell(coord[0], coord[1], "solution");
    await sleep(5);
  }
}