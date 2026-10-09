/**
 * arcade/games/minesweeper/minesweeper.js — Логика игры «Сапёр»
 *
 * Чистые функции: createState, update, getView
 */

/**
 * Возвращает координаты 8 соседей для ячейки (x, y)
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @returns {Array<{ x: number, y: number }>}
 */
export function getNeighbors(x, y, width, height) {
  const neighbors = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        neighbors.push({ x: nx, y: ny });
      }
    }
  }
  return neighbors;
}

/**
 * Подсчитывает число мин вокруг ячейки
 * @param {number} x
 * @param {number} y
 * @param {Array<Array<{ hasMine: boolean }>>} cells
 * @param {number} width
 * @param {number} height
 * @returns {number}
 */
export function countAdjacentMines(x, y, cells, width, height) {
  const neighbors = getNeighbors(x, y, width, height);
  return neighbors.filter((n) => cells[n.y][n.x].hasMine).length;
}

/**
 * Создаёт начальное состояние Сапёра
 * @param {object} [options]
 * @returns {object}
 */
export function createState(options = {}) {
  const width = options.width || 9;
  const height = options.height || 9;
  const minesCount = options.minesCount || 10;

  // 1. Инициализируем пустые ячейки
  const cells = [];
  for (let y = 0; y < height; y += 1) {
    cells[y] = [];
    for (let x = 0; x < width; x += 1) {
      cells[y][x] = {
        hasMine: false,
        state: 'CLOSED', // 'CLOSED' | 'OPEN' | 'FLAG'
        adjacentMines: 0,
      };
    }
  }

  // 2. Расставляем мины
  let placedMines = 0;
  const minePositions = options.minePositions || null;

  if (minePositions) {
    for (const pos of minePositions) {
      if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
        cells[pos.y][pos.x].hasMine = true;
      }
    }
  } else {
    while (placedMines < minesCount) {
      const rx = Math.floor(Math.random() * width);
      const ry = Math.floor(Math.random() * height);
      if (!cells[ry][rx].hasMine) {
        cells[ry][rx].hasMine = true;
        placedMines += 1;
      }
    }
  }

  // 3. Рассчитываем соседние мины
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!cells[y][x].hasMine) {
        cells[y][x].adjacentMines = countAdjacentMines(
          x,
          y,
          cells,
          width,
          height,
        );
      }
    }
  }

  return {
    width,
    height,
    minesCount,
    cursor: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    cells,
    flagsCount: 0,
    status: 'PLAYING',
  };
}

/**
 * Каскадное открытие пустых клеток через BFS
 * @param {Array<Array<object>>} cells
 * @param {number} startX
 * @param {number} startY
 * @param {number} width
 * @param {number} height
 */
export function floodFillOpen(cells, startX, startY, width, height) {
  const queue = [{ x: startX, y: startY }];
  const visited = new Set();
  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    cells[y][x].state = 'OPEN';

    if (cells[y][x].adjacentMines === 0) {
      const neighbors = getNeighbors(x, y, width, height);
      for (const n of neighbors) {
        const key = `${n.x},${n.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          const nCell = cells[n.y][n.x];
          if (nCell.state === 'CLOSED' && !nCell.hasMine) {
            nCell.state = 'OPEN';
            if (nCell.adjacentMines === 0) {
              queue.push(n);
            }
          }
        }
      }
    }
  }
}

/**
 * Проверяет условие победы
 * @param {Array<Array<object>>} cells
 * @returns {boolean}
 */
export function checkWin(cells) {
  let unrevealedSafe = 0;
  for (const row of cells) {
    for (const cell of row) {
      if (!cell.hasMine && cell.state !== 'OPEN') {
        unrevealedSafe += 1;
      }
    }
  }
  return unrevealedSafe === 0;
}

/**
 * Обновляет состояние игры
 * @param {object} state
 * @param {object} action
 * @returns {object}
 */
export function update(state, action) {
  if (!action || state.status !== 'PLAYING') {
    return state;
  }

  // 1. Движение курсора
  if (action.type === 'MOVE_CURSOR') {
    const nextX = Math.max(
      0,
      Math.min(state.width - 1, state.cursor.x + (action.dx || 0)),
    );
    const nextY = Math.max(
      0,
      Math.min(state.height - 1, state.cursor.y + (action.dy || 0)),
    );
    return {
      ...state,
      cursor: { x: nextX, y: nextY },
    };
  }

  const { x: cx, y: cy } = state.cursor;
  const currentCell = state.cells[cy][cx];

  // 2. Установка / снятие флага
  if (action.type === 'ACTION_FLAG') {
    if (currentCell.state === 'OPEN') {
      return state;
    }

    const newCells = state.cells.map((row) => row.map((cell) => ({ ...cell })));
    let newFlagsCount = state.flagsCount;

    if (currentCell.state === 'FLAG') {
      newCells[cy][cx].state = 'CLOSED';
      newFlagsCount -= 1;
    } else {
      newCells[cy][cx].state = 'FLAG';
      newFlagsCount += 1;
    }

    return {
      ...state,
      cells: newCells,
      flagsCount: newFlagsCount,
    };
  }

  // 3. Открытие ячейки
  if (action.type === 'ACTION_OPEN') {
    if (currentCell.state === 'FLAG' || currentCell.state === 'OPEN') {
      return state;
    }

    const newCells = state.cells.map((row) => row.map((cell) => ({ ...cell })));

    // Попадание на мину -> Поражение
    if (currentCell.hasMine) {
      // Раскрываем все мины
      for (let y = 0; y < state.height; y += 1) {
        for (let x = 0; x < state.width; x += 1) {
          if (newCells[y][x].hasMine) {
            newCells[y][x].state = 'OPEN';
          }
        }
      }
      return {
        ...state,
        cells: newCells,
        status: 'LOST',
      };
    }

    // Безопасная ячейка
    floodFillOpen(newCells, cx, cy, state.width, state.height);

    const isWon = checkWin(newCells);

    return {
      ...state,
      cells: newCells,
      status: isWon ? 'WON' : 'PLAYING',
    };
  }

  return state;
}

/**
 * Возвращает проекцию для рендерера renderGrid
 * @param {object} state
 * @returns {object}
 */
export function getView(state) {
  const grid = [];
  const { x: cx, y: cy } = state.cursor;

  for (let y = 0; y < state.height; y += 1) {
    grid[y] = [];
    for (let x = 0; x < state.width; x += 1) {
      const cell = state.cells[y][x];
      const isCursor = x === cx && y === cy;

      let symbol = ' · ';
      if (cell.state === 'FLAG') {
        symbol = ' F ';
      } else if (cell.state === 'OPEN') {
        if (cell.hasMine) {
          symbol = ' * ';
        } else if (cell.adjacentMines === 0) {
          symbol = '   ';
        } else {
          symbol = ` ${cell.adjacentMines} `;
        }
      }

      if (isCursor) {
        const char = symbol.trim() || ' ';
        symbol = `[${char}]`;
      }

      grid[y].push(symbol);
    }
  }

  return {
    title: 'Сапёр',
    grid,
    score: state.flagsCount,
    status: state.status,
    extraInfo: [
      `Мин всего: ${state.minesCount} | Флагов: ${state.flagsCount} | Курсор: (${cx}, ${cy})`,
      'Управление: WASD / Стрелки — курсор | Пробел — открыть | F — флаг',
    ],
  };
}
