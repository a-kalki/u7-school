/**
 * arcade/games/turtle/turtle.js — Логика «Черепашки на сетке» (Слой 3)
 *
 * Чистые функции, только POJO структуры данных.
 */

const DIRECTIONS = ['N', 'E', 'S', 'W'];

const DELTAS = {
  N: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  S: { dx: 0, dy: 1 },
  W: { dx: -1, dy: 0 },
};

const ICONS = {
  N: '^',
  E: '>',
  S: 'v',
  W: '<',
};

/**
 * Создает начальное состояние черепашки
 * @param {object} [options]
 * @param {number} [options.width=10]
 * @param {number} [options.height=10]
 * @param {number} [options.x=0]
 * @param {number} [options.y=0]
 * @param {'N'|'E'|'S'|'W'} [options.direction='E']
 * @param {boolean} [options.penDown=true]
 * @returns {object}
 */
export function createState(options = {}) {
  const width = options.width ?? 10;
  const height = options.height ?? 10;
  const x = options.x ?? 0;
  const y = options.y ?? 0;
  const direction = options.direction ?? 'E';
  const penDown = options.penDown ?? true;

  const trail = penDown ? [`${x},${y}`] : [];

  return {
    width,
    height,
    x,
    y,
    direction,
    penDown,
    trail,
    stepsCount: 0,
  };
}

/**
 * Обновляет состояние игры
 * @param {object} state
 * @param {object} event
 * @returns {object}
 */
export function update(state, event) {
  if (event.type === 'TURN_RIGHT') {
    const idx = DIRECTIONS.indexOf(state.direction);
    const nextDir = DIRECTIONS[(idx + 1) % DIRECTIONS.length];
    return { ...state, direction: nextDir };
  }

  if (event.type === 'TURN_LEFT') {
    const idx = DIRECTIONS.indexOf(state.direction);
    const nextDir =
      DIRECTIONS[(idx + DIRECTIONS.length - 1) % DIRECTIONS.length];
    return { ...state, direction: nextDir };
  }

  if (event.type === 'TOGGLE_PEN') {
    const nextPen = !state.penDown;
    const nextTrail =
      nextPen && !state.trail.includes(`${state.x},${state.y}`)
        ? [...state.trail, `${state.x},${state.y}`]
        : state.trail;

    return { ...state, penDown: nextPen, trail: nextTrail };
  }

  if (event.type === 'CLEAR_TRAIL') {
    return { ...state, trail: [] };
  }

  if (event.type === 'FORWARD' || event.type === 'BACKWARD') {
    const delta = DELTAS[state.direction];
    const sign = event.type === 'FORWARD' ? 1 : -1;

    const nextX = Math.max(
      0,
      Math.min(state.width - 1, state.x + delta.dx * sign),
    );
    const nextY = Math.max(
      0,
      Math.min(state.height - 1, state.y + delta.dy * sign),
    );

    const moved = nextX !== state.x || nextY !== state.y;
    let nextTrail = state.trail;

    if (state.penDown && moved) {
      const coordKey = `${nextX},${nextY}`;
      if (!nextTrail.includes(coordKey)) {
        nextTrail = [...nextTrail, coordKey];
      }
    }

    return {
      ...state,
      x: nextX,
      y: nextY,
      trail: nextTrail,
      stepsCount: moved ? state.stepsCount + 1 : state.stepsCount,
    };
  }

  return state;
}

/**
 * Формирует визуальное представление (view)
 * @param {object} state
 * @returns {object}
 */
export function getView(state) {
  const grid = [];
  for (let y = 0; y < state.height; y++) {
    const row = [];
    for (let x = 0; x < state.width; x++) {
      if (x === state.x && y === state.y) {
        row.push(ICONS[state.direction] || '@');
      } else if (state.trail.includes(`${x},${y}`)) {
        row.push('.');
      } else {
        row.push(' ');
      }
    }
    grid.push(row);
  }

  return {
    grid,
    x: state.x,
    y: state.y,
    direction: state.direction,
    penDown: state.penDown,
    stepsCount: state.stepsCount,
  };
}
