/**
 * arcade/games/snake/snake.js — Логика игры «Змейка»
 *
 * Чистые функции: createState, update, getView, spawnFood, isOppositeDirection
 */

const OPPOSITE_DIRECTIONS = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

const DIRECTION_DELTAS = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

const HEAD_SYMBOLS = {
  UP: '▲',
  DOWN: '▼',
  LEFT: '◄',
  RIGHT: '►',
};

/**
 * Проверяет, являются ли два направления противоположными
 * @param {string} dir1
 * @param {string} dir2
 * @returns {boolean}
 */
export function isOppositeDirection(dir1, dir2) {
  return OPPOSITE_DIRECTIONS[dir1] === dir2;
}

/**
 * Генерирует случайную позицию для еды, не занятую змейкой
 * @param {number} width
 * @param {number} height
 * @param {Array<{x: number, y: number}>} body
 * @param {function} [randomFn]
 * @returns {{x: number, y: number} | null}
 */
export function spawnFood(width, height, body, randomFn = Math.random) {
  const occupied = new Set(body.map((p) => `${p.x},${p.y}`));
  const freeCells = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  const index = Math.floor(randomFn() * freeCells.length);
  return freeCells[index];
}

/**
 * Создаёт начальное состояние игры «Змейка»
 * @param {object} [options]
 * @returns {object}
 */
export function createState(options = {}) {
  const width = options.width || 20;
  const height = options.height || 12;

  const startX = Math.floor(width / 3);
  const startY = Math.floor(height / 2);

  const body = options.body || [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];

  const direction = options.direction || 'RIGHT';
  const food = options.food ||
    spawnFood(width, height, body, options.randomFn || Math.random) || {
      x: 0,
      y: 0,
    };

  return {
    width,
    height,
    body,
    direction,
    nextDirection: direction,
    food,
    score: options.score || 0,
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

  // 1. Смена направления от игрока
  if (action.type === 'CHANGE_DIRECTION' || action.type === 'MOVE') {
    const newDir = action.direction;
    if (!newDir || !DIRECTION_DELTAS[newDir]) {
      return state;
    }

    // Игнорируем разворот на 180 градусов
    if (isOppositeDirection(state.direction, newDir)) {
      return state;
    }

    return {
      ...state,
      nextDirection: newDir,
    };
  }

  // 2. Тик таймера (продвижение змейки вперед)
  if (action.type === 'TICK') {
    const activeDirection = state.nextDirection;
    const delta = DIRECTION_DELTAS[activeDirection];
    const currentHead = state.body[0];
    const newHead = {
      x: currentHead.x + delta.dx,
      y: currentHead.y + delta.dy,
    };

    // Проверка выхода за границы поля
    if (
      newHead.x < 0 ||
      newHead.x >= state.width ||
      newHead.y < 0 ||
      newHead.y >= state.height
    ) {
      return {
        ...state,
        direction: activeDirection,
        status: 'GAME_OVER',
      };
    }

    // Проверка столкновения с собственным телом
    // Заметьте: если еда не съедена, последний сегмент хвоста освободится,
    // но для простоты и строгости классической змейки проверяем body без учета хвоста при движении
    const willEat =
      state.food && newHead.x === state.food.x && newHead.y === state.food.y;
    const bodyToCheck = willEat ? state.body : state.body.slice(0, -1);

    const hitSelf = bodyToCheck.some(
      (segment) => segment.x === newHead.x && segment.y === newHead.y,
    );
    if (hitSelf) {
      return {
        ...state,
        direction: activeDirection,
        status: 'GAME_OVER',
      };
    }

    // Движение и поедание
    if (willEat) {
      const newBody = [newHead, ...state.body];
      const newScore = state.score + 10;
      const nextFood = spawnFood(state.width, state.height, newBody);

      return {
        ...state,
        body: newBody,
        direction: activeDirection,
        score: newScore,
        food: nextFood,
        status: nextFood ? 'PLAYING' : 'WON', // Если вся сетка заполнена — победа
      };
    }

    // Обычное перемещение (хвост сдвигается)
    const newBody = [newHead, ...state.body.slice(0, -1)];
    return {
      ...state,
      body: newBody,
      direction: activeDirection,
    };
  }

  return state;
}

/**
 * Формирует проекцию для renderGrid
 * @param {object} state
 * @returns {object}
 */
export function getView(state) {
  const grid = Array.from({ length: state.height }, () =>
    Array(state.width).fill(' '),
  );

  // Отрисовка еды
  if (state.food) {
    grid[state.food.y][state.food.x] = '★';
  }

  // Отрисовка тела змейки (с конца к началу, чтобы голова перезаписала 0-й элемент)
  for (let i = state.body.length - 1; i > 0; i -= 1) {
    const seg = state.body[i];
    if (
      seg.y >= 0 &&
      seg.y < state.height &&
      seg.x >= 0 &&
      seg.x < state.width
    ) {
      grid[seg.y][seg.x] = 'o';
    }
  }

  // Отрисовка головы с направлением
  const head = state.body[0];
  if (
    head.y >= 0 &&
    head.y < state.height &&
    head.x >= 0 &&
    head.x < state.width
  ) {
    grid[head.y][head.x] = HEAD_SYMBOLS[state.direction] || 'O';
  }

  const extraInfo = [];
  extraInfo.push(`Счёт: ${state.score} | Длина: ${state.body.length}`);

  if (state.status === 'GAME_OVER') {
    extraInfo.push('💥 СТОЛКНОВЕНИЕ! Нажмите [R] чтобы начать заново.');
  } else if (state.status === 'WON') {
    extraInfo.push('🏆 НЕВЕРОЯТНО! Всё поле заполнено! Победитель!');
  } else {
    extraInfo.push(
      'Управление: WASD / Стрелки — поворот | R — перезапуск | Q / Ctrl+C — выход',
    );
  }

  return {
    title: 'Змейка (Snake)',
    grid,
    score: state.score,
    status: state.status,
    extraInfo,
  };
}
