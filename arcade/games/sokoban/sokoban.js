/**
 * arcade/games/sokoban/sokoban.js — Логика головоломки «Сокобан»
 *
 * Чистые функции: createState, update, getView
 */

export const DEFAULT_LEVEL_MAP = [
  '  ##### ',
  '###   # ',
  '# $ # ##',
  '# #  . #',
  '#    # #',
  '## #.  #',
  ' #@ $  #',
  ' #######',
];

const DIR_DELTAS = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

/**
 * Находит позицию игрока на символьной карте
 * @param {string[][]} grid
 * @returns {{ x: number, y: number } | null}
 */
export function findPlayer(grid) {
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x] === '@' || grid[y][x] === '+') {
        return { x, y };
      }
    }
  }
  return null;
}

/**
 * Проверяет, пройден ли уровень
 * @param {string[][]} grid
 * @returns {boolean}
 */
export function isLevelCompleted(grid) {
  let hasNormalBox = false;
  let hasEmptyTarget = false;

  for (const row of grid) {
    for (const cell of row) {
      if (cell === '$') hasNormalBox = true;
      if (cell === '.' || cell === '+') hasEmptyTarget = true;
    }
  }

  // Победа, если нет обычных ящиков и нет пустых целей
  return !hasNormalBox && !hasEmptyTarget;
}

/**
 * Создаёт начальное состояние игры
 * @param {object} [options]
 * @returns {object}
 */
export function createState(options = {}) {
  const mapLines = options.map || DEFAULT_LEVEL_MAP;
  const grid = mapLines.map((line) => line.split(''));
  const height = grid.length;
  const width = Math.max(...grid.map((r) => r.length));

  // Выравниваем ширину строк
  for (const row of grid) {
    while (row.length < width) {
      row.push(' ');
    }
  }

  const player = findPlayer(grid) || { x: 1, y: 1 };

  return {
    level: options.level || 1,
    width,
    height,
    player,
    grid,
    movesCount: 0,
    pushesCount: 0,
    status: 'PLAYING',
  };
}

/**
 * Обновляет состояние игры при ходе
 * @param {object} state
 * @param {object} action
 * @returns {object}
 */
export function update(state, action) {
  if (!action || state.status !== 'PLAYING') {
    return state;
  }

  if (action.type !== 'MOVE' || !DIR_DELTAS[action.direction]) {
    return state;
  }

  const { dx, dy } = DIR_DELTAS[action.direction];
  const { x: px, y: py } = state.player;
  const tx = px + dx;
  const ty = py + dy;

  // Проверка выхода за границы карты
  if (ty < 0 || ty >= state.height || tx < 0 || tx >= state.width) {
    return state;
  }

  const targetCell = state.grid[ty][tx];

  // 1. Стена или неизвестный символ
  if (targetCell === '#' || targetCell === undefined) {
    return state;
  }

  // Копируем сетку для изменений
  const newGrid = state.grid.map((row) => [...row]);
  let pushed = false;

  // 2. Ящик на пути ($ или *)
  if (targetCell === '$' || targetCell === '*') {
    const bx = tx + dx;
    const by = ty + dy;

    // Проверка границ для ящика
    if (by < 0 || by >= state.height || bx < 0 || bx >= state.width) {
      return state;
    }

    const boxDest = newGrid[by][bx];

    // За ящиком стена или второй ящик — двойная коллизия
    if (
      boxDest === '#' ||
      boxDest === '$' ||
      boxDest === '*' ||
      boxDest === undefined
    ) {
      return state;
    }

    // Сдвигаем ящик
    if (boxDest === '.') {
      newGrid[by][bx] = '*'; // встал на цель
    } else {
      newGrid[by][bx] = '$'; // встал на пустой пол
    }

    // Освобождаем клетку, где стоял ящик
    if (targetCell === '*') {
      newGrid[ty][tx] = '+'; // игрок встаёт на цель
    } else {
      newGrid[ty][tx] = '@'; // игрок встаёт на обычный пол
    }

    pushed = true;
  } else if (targetCell === ' ') {
    // Игрок встаёт на пустой пол
    newGrid[ty][tx] = '@';
  } else if (targetCell === '.') {
    // Игрок встаёт на цель
    newGrid[ty][tx] = '+';
  } else {
    return state;
  }

  // Освобождаем старую клетку игрока
  const currentCell = state.grid[py][px];
  if (currentCell === '+') {
    newGrid[py][px] = '.'; // открылась цель
  } else {
    newGrid[py][px] = ' '; // остался пустой пол
  }

  const won = isLevelCompleted(newGrid);

  return {
    ...state,
    grid: newGrid,
    player: { x: tx, y: ty },
    movesCount: state.movesCount + 1,
    pushesCount: pushed ? state.pushesCount + 1 : state.pushesCount,
    status: won ? 'WON' : 'PLAYING',
  };
}

/**
 * Возвращает проекцию для рендерера
 * @param {object} state
 * @returns {object}
 */
export function getView(state) {
  return {
    title: `Сокобан (Уровень ${state.level})`,
    grid: state.grid,
    score: state.movesCount,
    status: state.status,
    extraInfo: [
      `Шагов: ${state.movesCount} | Толканий: ${state.pushesCount}`,
      'Легенда: @ — игрок, $ — ящик, . — цель, * — ящик на цели, # — стена',
    ],
  };
}
