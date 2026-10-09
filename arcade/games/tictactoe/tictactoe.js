/**
 * arcade/games/tictactoe/tictactoe.js — Логика игры «Крестики-нолики 3x3»
 *
 * Чистые функции: createState, update, getView
 */

/**
 * Проверяет наличие победной линии из 3 символов
 * @param {string[][]} grid
 * @param {string} player
 * @returns {boolean}
 */
export function checkWinner(grid, player) {
  const size = grid.length;

  // 1. Проверка горизонталей
  for (let r = 0; r < size; r += 1) {
    if (grid[r].every((cell) => cell === player)) {
      return true;
    }
  }

  // 2. Проверка вертикалей
  for (let c = 0; c < size; c += 1) {
    let colMatch = true;
    for (let r = 0; r < size; r += 1) {
      if (grid[r][c] !== player) {
        colMatch = false;
        break;
      }
    }
    if (colMatch) return true;
  }

  // 3. Главная диагональ
  let diag1 = true;
  for (let i = 0; i < size; i += 1) {
    if (grid[i][i] !== player) {
      diag1 = false;
      break;
    }
  }
  if (diag1) return true;

  // 4. Побочная диагональ
  let diag2 = true;
  for (let i = 0; i < size; i += 1) {
    if (grid[i][size - 1 - i] !== player) {
      diag2 = false;
      break;
    }
  }
  if (diag2) return true;

  return false;
}

/**
 * Создаёт начальное состояние игры
 * @param {object} [options]
 * @returns {object}
 */
export function createState(options = {}) {
  const size = options.size || 3;
  const grid = Array.from({ length: size }, () => Array(size).fill(' '));

  return {
    size,
    cursor: { x: Math.floor(size / 2), y: Math.floor(size / 2) },
    grid,
    currentPlayer: 'X',
    winner: null,
    movesCount: 0,
    status: 'PLAYING',
  };
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

  // 1. Перемещение курсора
  if (action.type === 'MOVE_CURSOR') {
    const nextX = Math.max(
      0,
      Math.min(state.size - 1, state.cursor.x + (action.dx || 0)),
    );
    const nextY = Math.max(
      0,
      Math.min(state.size - 1, state.cursor.y + (action.dy || 0)),
    );
    return {
      ...state,
      cursor: { x: nextX, y: nextY },
    };
  }

  // 2. Установка знака
  if (action.type === 'ACTION_PLACE' || action.type === 'ACTION_OPEN') {
    const { x, y } = state.cursor;

    // Клетка уже занята
    if (state.grid[y][x] !== ' ') {
      return state;
    }

    const newGrid = state.grid.map((row) => [...row]);
    newGrid[y][x] = state.currentPlayer;
    const newMovesCount = state.movesCount + 1;

    // Проверка победы
    const hasWon = checkWinner(newGrid, state.currentPlayer);
    if (hasWon) {
      return {
        ...state,
        grid: newGrid,
        winner: state.currentPlayer,
        movesCount: newMovesCount,
        status: 'WON',
      };
    }

    // Проверка ничьей
    if (newMovesCount >= state.size * state.size) {
      return {
        ...state,
        grid: newGrid,
        movesCount: newMovesCount,
        status: 'DRAW',
      };
    }

    // Переход хода
    const nextPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    return {
      ...state,
      grid: newGrid,
      currentPlayer: nextPlayer,
      movesCount: newMovesCount,
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
  const formattedGrid = [];
  const { x: cx, y: cy } = state.cursor;

  for (let y = 0; y < state.size; y += 1) {
    formattedGrid[y] = [];
    for (let x = 0; x < state.size; x += 1) {
      const cell = state.grid[y][x];
      const isCursor = x === cx && y === cy;
      const char = cell === ' ' ? '·' : cell;

      if (isCursor) {
        formattedGrid[y].push(`[${char}]`);
      } else {
        formattedGrid[y].push(` ${char} `);
      }
    }
  }

  const extraInfo = [];
  if (state.status === 'PLAYING') {
    extraInfo.push(`Текущий ход: игрок [ ${state.currentPlayer} ]`);
  } else if (state.status === 'WON') {
    extraInfo.push(`🎉 Победил игрок: [ ${state.winner} ]! Поздравляем!`);
  } else if (state.status === 'DRAW') {
    extraInfo.push('🤝 Боевая ничья! Все клетки заполнены.');
  }

  extraInfo.push(
    'Управление: Стрелки / WASD — курсор | Пробел / Enter — поставить знак',
  );

  return {
    title: 'Крестики-нолики',
    grid: formattedGrid,
    score: state.movesCount,
    status: state.status,
    extraInfo,
  };
}
