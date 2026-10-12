/**
 * arcade/games/dodger/dodger.js — Логика игры «Космический уворачивальщик»
 *
 * Чистые функции: createState, update, getView, checkCollision
 */

import { SOUNDS } from '../../engine.js';

/**
 * Проверяет столкновение корабля с любым из астероидов
 * @param {number} playerX
 * @param {number} playerY
 * @param {Array<{x: number, y: number}>} asteroids
 * @returns {boolean}
 */
export function checkCollision(playerX, playerY, asteroids) {
  return asteroids.some((ast) => ast.x === playerX && ast.y === playerY);
}

/**
 * Создаёт начальное состояние игры
 * @param {object} [options]
 * @returns {object}
 */
export function createState(options = {}) {
  const width = options.width || 15;
  const height = options.height || 12;
  const playerX =
    options.playerX !== undefined ? options.playerX : Math.floor(width / 2);

  return {
    width,
    height,
    playerX,
    asteroids: options.asteroids || [],
    score: options.score || 0,
    spawnRate: options.spawnRate !== undefined ? options.spawnRate : 0.4,
    status: 'PLAYING',
  };
}

/**
 * Обновляет состояние игры
 * @param {object} state
 * @param {object} action
 * @param {function} [randomFn]
 * @returns {object}
 */
export function update(state, action, randomFn = Math.random) {
  if (!action || state.status !== 'PLAYING') {
    return state;
  }

  const playerY = state.height - 1;

  // 1. Движение игрока влево / вправо
  if (
    action.type === 'MOVE_LEFT' ||
    (action.type === 'MOVE' && action.direction === 'LEFT')
  ) {
    const nextX = Math.max(0, state.playerX - 1);
    const hit = checkCollision(nextX, playerY, state.asteroids);
    return {
      ...state,
      playerX: nextX,
      status: hit ? 'GAME_OVER' : state.status,
      sound: hit ? SOUNDS.ALARM : null,
    };
  }

  if (
    action.type === 'MOVE_RIGHT' ||
    (action.type === 'MOVE' && action.direction === 'RIGHT')
  ) {
    const nextX = Math.min(state.width - 1, state.playerX + 1);
    const hit = checkCollision(nextX, playerY, state.asteroids);
    return {
      ...state,
      playerX: nextX,
      status: hit ? 'GAME_OVER' : state.status,
      sound: hit ? SOUNDS.ALARM : null,
    };
  }

  // 2. Тик таймера
  if (action.type === 'TICK') {
    // Сдвигаем существующие астероиды вниз
    const movedAsteroids = [];
    for (const ast of state.asteroids) {
      const nextY = ast.y + 1;
      if (nextY < state.height) {
        movedAsteroids.push({ x: ast.x, y: nextY });
      }
    }

    // Проверяем коллизию с опустившимися астероидами
    if (checkCollision(state.playerX, playerY, movedAsteroids)) {
      return {
        ...state,
        asteroids: movedAsteroids,
        status: 'GAME_OVER',
        sound: SOUNDS.ALARM,
      };
    }

    // Спавн нового астероида в верхней строке
    const newAsteroids = [...movedAsteroids];
    const shouldSpawn = randomFn() < state.spawnRate;
    if (shouldSpawn) {
      const spawnX = Math.floor(randomFn() * state.width);
      newAsteroids.push({ x: spawnX, y: 0 });
    }

    // Проверка коллизии если поле высотой в 1 строку (краевой случай)
    if (checkCollision(state.playerX, playerY, newAsteroids)) {
      return {
        ...state,
        asteroids: newAsteroids,
        status: 'GAME_OVER',
        sound: SOUNDS.ALARM,
      };
    }

    return {
      ...state,
      asteroids: newAsteroids,
      score: state.score + 1,
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

  // Отрисовка астероидов
  for (const ast of state.asteroids) {
    if (
      ast.y >= 0 &&
      ast.y < state.height &&
      ast.x >= 0 &&
      ast.x < state.width
    ) {
      grid[ast.y][ast.x] = '●';
    }
  }

  // Отрисовка корабля
  const playerY = state.height - 1;
  if (state.playerX >= 0 && state.playerX < state.width) {
    grid[playerY][state.playerX] = state.status === 'GAME_OVER' ? '💥' : '▲';
  }

  const extraInfo = [];
  extraInfo.push(`Счёт выживания: ${state.score} очков`);

  if (state.status === 'GAME_OVER') {
    extraInfo.push(
      '💥 КОРАБЛЬ УНИЧТОЖЕН! Нажмите [R] чтобы начать новый полёт.',
    );
  } else {
    extraInfo.push(
      'Управление: [A]/[D] или Стрелки ← / → — маневрирование | R — перезапуск | Q — выход',
    );
  }

  return {
    title: 'Космический уворачивальщик',
    grid,
    score: state.score,
    status: state.status,
    extraInfo,
  };
}
