/**
 * arcade/render/grid.js — Универсальный 2D-рендер сетки и адаптеры ввода
 *
 * Подходит для игр: 2048, Сокобан, Сапёр, Змейка, Космический уворачивальщик.
 */

/**
 * Создаёт адаптер направлений (WASD + стрелки)
 * @param {object} [options]
 * @param {string} [options.eventType='MOVE']
 * @returns {function}
 */
export function createDirectionAdapter(options = {}) {
  const eventType = options.eventType || 'MOVE';

  return (rawStr) => {
    // Системные клавиши оставляем ядру
    if (
      rawStr === '\u0003' ||
      rawStr === 'r' ||
      rawStr === 'R' ||
      rawStr === 'к' ||
      rawStr === 'К' ||
      rawStr === 'q' ||
      rawStr === 'Q' ||
      rawStr === 'й' ||
      rawStr === 'Й'
    ) {
      return null;
    }

    if (
      rawStr === '\x1b[A' ||
      rawStr === 'w' ||
      rawStr === 'W' ||
      rawStr === 'ц' ||
      rawStr === 'Ц'
    ) {
      return { type: eventType, direction: 'UP' };
    }
    if (
      rawStr === '\x1b[B' ||
      rawStr === 's' ||
      rawStr === 'S' ||
      rawStr === 'ы' ||
      rawStr === 'Ы'
    ) {
      return { type: eventType, direction: 'DOWN' };
    }
    if (
      rawStr === '\x1b[D' ||
      rawStr === 'a' ||
      rawStr === 'A' ||
      rawStr === 'ф' ||
      rawStr === 'Ф'
    ) {
      return { type: eventType, direction: 'LEFT' };
    }
    if (
      rawStr === '\x1b[C' ||
      rawStr === 'd' ||
      rawStr === 'D' ||
      rawStr === 'в' ||
      rawStr === 'В'
    ) {
      return { type: eventType, direction: 'RIGHT' };
    }

    return null;
  };
}

/**
 * Адаптер ввода для Сапёра (курсор + открытие + флаг)
 * @param {string} rawStr
 * @returns {object | null}
 */
export function cursorActionAdapter(rawStr) {
  if (
    rawStr === '\u0003' ||
    rawStr === 'r' ||
    rawStr === 'R' ||
    rawStr === 'к' ||
    rawStr === 'К' ||
    rawStr === 'q' ||
    rawStr === 'Q' ||
    rawStr === 'й' ||
    rawStr === 'Й'
  ) {
    return null;
  }

  if (
    rawStr === '\x1b[A' ||
    rawStr === 'w' ||
    rawStr === 'W' ||
    rawStr === 'ц' ||
    rawStr === 'Ц'
  ) {
    return { type: 'MOVE_CURSOR', dx: 0, dy: -1 };
  }
  if (
    rawStr === '\x1b[B' ||
    rawStr === 's' ||
    rawStr === 'S' ||
    rawStr === 'ы' ||
    rawStr === 'Ы'
  ) {
    return { type: 'MOVE_CURSOR', dx: 0, dy: 1 };
  }
  if (
    rawStr === '\x1b[D' ||
    rawStr === 'a' ||
    rawStr === 'A' ||
    rawStr === 'ф' ||
    rawStr === 'Ф'
  ) {
    return { type: 'MOVE_CURSOR', dx: -1, dy: 0 };
  }
  if (
    rawStr === '\x1b[C' ||
    rawStr === 'd' ||
    rawStr === 'D' ||
    rawStr === 'в' ||
    rawStr === 'В'
  ) {
    return { type: 'MOVE_CURSOR', dx: 1, dy: 0 };
  }

  if (rawStr === ' ' || rawStr === '\r' || rawStr === '\n') {
    return { type: 'ACTION_OPEN' };
  }

  if (rawStr === 'f' || rawStr === 'F' || rawStr === 'а' || rawStr === 'А') {
    return { type: 'ACTION_FLAG' };
  }

  return null;
}

/**
 * Отрисовка символьной 2D-сетки (Змейка, Сокобан, Сапёр, Арканоид)
 * @param {object} view
 * @param {object} [options]
 * @returns {string[]}
 */
export function renderGrid(view, options = {}) {
  const {
    title = 'ИГРА',
    grid = [],
    score = null,
    status = 'PLAYING',
    extraInfo = [],
  } = view;

  const width = grid[0] ? grid[0].length : 0;
  const borderH = `+${'-'.repeat(width)}+`;

  const lines = [
    '========================================',
    `        🎮 ${title.toUpperCase()}       `,
    '========================================',
  ];

  const stats = [];
  if (score !== null) stats.push(`Счёт: ${score}`);
  if (stats.length > 0) {
    lines.push(` ${stats.join(' | ')}`);
  }

  for (const info of extraInfo) {
    lines.push(` ${info}`);
  }

  lines.push('');
  lines.push(`  ${borderH}`);

  for (const row of grid) {
    const rowStr = Array.isArray(row) ? row.join('') : String(row);
    lines.push(`  |${rowStr}|`);
  }

  lines.push(`  ${borderH}`);
  lines.push('');

  if (status === 'WON') {
    lines.push(' 🎉 ПОБЕДА! Уровень успешно пройден!');
    lines.push(' Нажми [ r ] чтобы начать заново, или [ q ] для выхода.');
  } else if (status === 'LOST' || status === 'GAME_OVER') {
    lines.push(' 💀 ИГРА ОКОНЧЕНА!');
    lines.push(' Нажми [ r ] чтобы попробовать снова, или [ q ] для выхода.');
  } else {
    lines.push(
      options.helpText ||
        ' Управление: [ Стрелки / WASD ] | [ r ] — Заново | [ q ] — Выход',
    );
  }

  lines.push('========================================');
  return lines;
}

/**
 * Отрисовка числовой матрицы для 2048
 * @param {object} view
 * @param {object} [options]
 * @param {number} [options.cellWidth=5]
 * @returns {string[]}
 */
export function renderNumberGrid(view, options = {}) {
  const { title = '2048', matrix = [], score = 0, status = 'PLAYING' } = view;

  const cellWidth = options.cellWidth || 5;
  const cols = matrix[0] ? matrix[0].length : 4;

  const sepRow = `+${(`${'-'.repeat(cellWidth)}+`).repeat(cols)}`;

  const lines = [
    '========================================',
    `        🔢 ${title.toUpperCase()}       `,
    '========================================',
    ` Счёт: ${score}`,
    '',
    `  ${sepRow}`,
  ];

  for (const row of matrix) {
    const formattedCells = row.map((num) => {
      if (num === 0) {
        return ' '.repeat(cellWidth);
      }
      return String(num).padStart(cellWidth, ' ');
    });

    lines.push(`  |${formattedCells.join('|')}|`);
    lines.push(`  ${sepRow}`);
  }

  lines.push('');

  if (status === 'WON') {
    lines.push(' 🎉 ВЫ СОБРАЛИ 2048! ПОБЕДА!');
    lines.push(' [ r ] — Новая игра | [ q ] — Выход');
  } else if (status === 'LOST' || status === 'GAME_OVER') {
    lines.push(' 💀 ХОДОВ БОЛЬШЕ НЕТ! ИГРА ОКОНЧЕНА.');
    lines.push(' [ r ] — Попробовать снова | [ q ] — Выход');
  } else {
    lines.push(' Управление: [ Стрелки / WASD ] сдвиг чисел');
    lines.push(' [ r ] — Начать заново  |  [ q ] — Выход');
  }

  lines.push('========================================');
  return lines;
}
