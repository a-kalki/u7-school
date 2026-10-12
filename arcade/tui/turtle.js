/**
 * arcade/tui/turtle.js — Рендерер и адаптер ввода для Черепашки (Слой 2)
 */

const DIR_LABELS = {
  N: 'Север (вверх)',
  E: 'Восток (вправо)',
  S: 'Юг (вниз)',
  W: 'Запад (влево)',
};

/**
 * Адаптер ввода клавиш
 * @param {string} rawStr
 * @returns {object | null}
 */
export function inputAdapter(rawStr) {
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

  // Стрелки терминала (ANSI последовательности)
  if (
    rawStr === '\x1b[A' ||
    rawStr === 'w' ||
    rawStr === 'W' ||
    rawStr === 'ц' ||
    rawStr === 'Ц'
  ) {
    return { type: 'FORWARD' };
  }
  if (
    rawStr === '\x1b[B' ||
    rawStr === 's' ||
    rawStr === 'S' ||
    rawStr === 'ы' ||
    rawStr === 'Ы'
  ) {
    return { type: 'BACKWARD' };
  }
  if (
    rawStr === '\x1b[D' ||
    rawStr === 'a' ||
    rawStr === 'A' ||
    rawStr === 'ф' ||
    rawStr === 'Ф'
  ) {
    return { type: 'TURN_LEFT' };
  }
  if (
    rawStr === '\x1b[C' ||
    rawStr === 'd' ||
    rawStr === 'D' ||
    rawStr === 'в' ||
    rawStr === 'В'
  ) {
    return { type: 'TURN_RIGHT' };
  }

  // Переключение пера
  if (rawStr === ' ') {
    return { type: 'TOGGLE_PEN' };
  }

  // Очистка следа
  if (rawStr === 'c' || rawStr === 'C' || rawStr === 'с' || rawStr === 'С') {
    return { type: 'CLEAR_TRAIL' };
  }

  return null;
}

/**
 * Отрисовка кадра черепашки
 * @param {object} view
 * @returns {string[]}
 */
export function renderTurtle(view) {
  const {
    grid = [],
    x = 0,
    y = 0,
    direction = 'E',
    penDown = true,
    stepsCount = 0,
  } = view;

  const width = grid[0] ? grid[0].length : 0;
  const borderH = `+${'-'.repeat(width)}+`;

  const lines = [
    '========================================',
    '        🐢 ЧЕРЕПАШКА НА СЕТКЕ           ',
    '========================================',
    ` Позиция: X=${x}, Y=${y} | Шагов: ${stepsCount}`,
    ` Направление: ${DIR_LABELS[direction] || direction}`,
    ` Перо: [ ${penDown ? 'ОПУЩЕНО (рисует .)' : 'ПОДНЯТО (без следа)'} ]`,
    '',
    `  ${borderH}`,
  ];

  for (const row of grid) {
    lines.push(`  |${row.join('')}|`);
  }

  lines.push(`  ${borderH}`);
  lines.push('');
  lines.push(' Управление:');
  lines.push(' [ ↑ / W ] — Вперёд   | [ ↓ / S ] — Назад');
  lines.push(' [ ← / A ] — Поворот L| [ → / D ] — Поворот R');
  lines.push(' [ Пробел ] — Перо   | [ C ] — Стереть след');
  lines.push(' [ r ] — Сброс        | [ q ] — Выход');
  lines.push('========================================');

  return lines;
}
