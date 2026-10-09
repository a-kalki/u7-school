/**
 * arcade/games/2048/game-2048.js — Логика числовой игры «2048»
 *
 * Чистые функции: createState, update, getView
 */

/**
 * Сдвигает одну строку влево со слиянием соседних равных плиток
 * @param {number[]} row
 * @returns {{ row: number[], gainedScore: number }}
 */
export function slideRow(row) {
  // 1. Убираем нули
  const nonZero = row.filter((val) => val !== 0);
  const result = [];
  let gainedScore = 0;

  let i = 0;
  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const mergedVal = nonZero[i] * 2;
      result.push(mergedVal);
      gainedScore += mergedVal;
      i += 2; // пропускаем объединенную плитку
    } else {
      result.push(nonZero[i]);
      i += 1;
    }
  }

  // Дополняем нулями справа до исходной длины строки
  while (result.length < row.length) {
    result.push(0);
  }

  return { row: result, gainedScore };
}

/**
 * Поворачивает квадратную матрицу на 90 градусов по часовой стрелке
 * @param {number[][]} matrix
 * @returns {number[][]}
 */
export function rotateMatrix(matrix) {
  const size = matrix.length;
  const rotated = [];
  for (let r = 0; r < size; r += 1) {
    rotated[r] = [];
    for (let c = 0; c < size; c += 1) {
      rotated[r][c] = matrix[size - 1 - c][r];
    }
  }
  return rotated;
}

/**
 * Сдвигает матрицу влево
 * @param {number[][]} matrix
 * @returns {{ matrix: number[][], gainedScore: number, changed: boolean }}
 */
export function slideLeft(matrix) {
  const newMatrix = [];
  let gainedScore = 0;
  let changed = false;

  for (let r = 0; r < matrix.length; r += 1) {
    const { row, gainedScore: score } = slideRow(matrix[r]);
    newMatrix.push(row);
    gainedScore += score;
    for (let c = 0; c < row.length; c += 1) {
      if (row[c] !== matrix[r][c]) {
        changed = true;
      }
    }
  }

  return { matrix: newMatrix, gainedScore, changed };
}

/**
 * Сдвигает матрицу в любом из 4 направлений
 * @param {number[][]} matrix
 * @param {string} direction 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
 * @returns {{ matrix: number[][], gainedScore: number, changed: boolean }}
 */
export function moveMatrix(matrix, direction) {
  let rotated = matrix.map((row) => [...row]);
  let rotations = 0;

  if (direction === 'LEFT') {
    rotations = 0;
  } else if (direction === 'DOWN') {
    rotations = 1; // поворот на 90 -> сдвиг влево -> поворот на 270
  } else if (direction === 'RIGHT') {
    rotations = 2; // поворот на 180 -> сдвиг влево -> поворот на 180
  } else if (direction === 'UP') {
    rotations = 3; // поворот на 270 -> сдвиг влево -> поворот на 90
  } else {
    return { matrix, gainedScore: 0, changed: false };
  }

  for (let i = 0; i < rotations; i += 1) {
    rotated = rotateMatrix(rotated);
  }

  const { matrix: slid, gainedScore, changed } = slideLeft(rotated);

  // Возвращаем поворот обратно: (4 - rotations) % 4
  const backRotations = (4 - rotations) % 4;
  let result = slid;
  for (let i = 0; i < backRotations; i += 1) {
    result = rotateMatrix(result);
  }

  return { matrix: result, gainedScore, changed };
}

/**
 * Находит все координаты пустых клеток
 * @param {number[][]} matrix
 * @returns {Array<{ r: number, c: number }>}
 */
export function getEmptyCells(matrix) {
  const empty = [];
  for (let r = 0; r < matrix.length; r += 1) {
    for (let c = 0; c < matrix[r].length; c += 1) {
      if (matrix[r][c] === 0) {
        empty.push({ r, c });
      }
    }
  }
  return empty;
}

/**
 * Спавнит одну плитку на случайной свободной позиции (90% шанс на 2, 10% на 4)
 * @param {number[][]} matrix
 * @returns {number[][]}
 */
export function spawnRandomTile(matrix) {
  const emptyCells = getEmptyCells(matrix);
  if (emptyCells.length === 0) return matrix;

  const newMatrix = matrix.map((row) => [...row]);
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const target = emptyCells[randomIndex];
  const value = Math.random() < 0.9 ? 2 : 4;
  newMatrix[target.r][target.c] = value;
  return newMatrix;
}

/**
 * Проверяет наличие возможных ходов
 * @param {number[][]} matrix
 * @returns {boolean}
 */
export function canMove(matrix) {
  const size = matrix.length;
  // Если есть хоть один 0 — ход возможен
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (matrix[r][c] === 0) return true;
      if (c + 1 < size && matrix[r][c] === matrix[r][c + 1]) return true;
      if (r + 1 < size && matrix[r][c] === matrix[r + 1][c]) return true;
    }
  }
  return false;
}

/**
 * Проверяет, достигнута ли плитка 2048
 * @param {number[][]} matrix
 * @returns {boolean}
 */
export function hasWon(matrix) {
  for (const row of matrix) {
    for (const val of row) {
      if (val >= 2048) return true;
    }
  }
  return false;
}

/**
 * Создаёт начальное состояние
 * @param {object} [options]
 * @returns {object}
 */
export function createState(options = {}) {
  const size = options.size || 4;
  let matrix = Array.from({ length: size }, () => Array(size).fill(0));

  // Спавним две начальные плитки
  matrix = spawnRandomTile(matrix);
  matrix = spawnRandomTile(matrix);

  return {
    size,
    matrix,
    score: 0,
    status: 'PLAYING',
  };
}

/**
 * Обновляет состояние по событию
 * @param {object} state
 * @param {object} action
 * @returns {object}
 */
export function update(state, action) {
  if (!action || state.status !== 'PLAYING') {
    return state;
  }

  if (action.type === 'MOVE') {
    const {
      matrix: movedMatrix,
      gainedScore,
      changed,
    } = moveMatrix(state.matrix, action.direction);

    if (!changed) {
      return state;
    }

    const withSpawn = spawnRandomTile(movedMatrix);
    const newScore = state.score + gainedScore;

    let newStatus = 'PLAYING';
    if (hasWon(withSpawn)) {
      newStatus = 'WON';
    } else if (!canMove(withSpawn)) {
      newStatus = 'LOST';
    }

    return {
      ...state,
      matrix: withSpawn,
      score: newScore,
      status: newStatus,
    };
  }

  return state;
}

/**
 * Возвращает проекцию для рендерера
 * @param {object} state
 * @returns {object}
 */
export function getView(state) {
  return {
    title: '2048',
    matrix: state.matrix,
    score: state.score,
    status: state.status,
  };
}
