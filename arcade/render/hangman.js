/**
 * arcade/render/hangman.js — Рендерер и адаптер ввода для Виселицы (Слой 2)
 */

const STAGES = [
  // 0 ошибок
  [
    '  +---+  ',
    '  |   |  ',
    '      |  ',
    '      |  ',
    '      |  ',
    '      |  ',
    '=========',
  ],
  // 1 ошибка: голова
  [
    '  +---+  ',
    '  |   |  ',
    '  O   |  ',
    '      |  ',
    '      |  ',
    '      |  ',
    '=========',
  ],
  // 2 ошибки: туловище
  [
    '  +---+  ',
    '  |   |  ',
    '  O   |  ',
    '  |   |  ',
    '      |  ',
    '      |  ',
    '=========',
  ],
  // 3 ошибки: левая рука
  [
    '  +---+  ',
    '  |   |  ',
    '  O   |  ',
    ' /|   |  ',
    '      |  ',
    '      |  ',
    '=========',
  ],
  // 4 ошибки: правая рука
  [
    '  +---+  ',
    '  |   |  ',
    '  O   |  ',
    ' /|\\  |  ',
    '      |  ',
    '      |  ',
    '=========',
  ],
  // 5 ошибок: левая нога
  [
    '  +---+  ',
    '  |   |  ',
    '  O   |  ',
    ' /|\\  |  ',
    ' /    |  ',
    '      |  ',
    '=========',
  ],
  // 6 ошибок: полная виселица (поражение)
  [
    '  +---+  ',
    '  |   |  ',
    '  O   |  ',
    ' /|\\  |  ',
    ' / \\  |  ',
    '      |  ',
    '=========',
  ],
];

/**
 * Адаптер ввода клавиш терминала
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

  // Переключение языка
  if (rawStr === '\t' || rawStr === ' ') {
    return { type: 'TOGGLE_LANG' };
  }

  // Буквы русского или английского алфавита
  if (/^[a-zA-Zа-яА-ЯёЁ]$/.test(rawStr)) {
    return { type: 'GUESS', char: rawStr.toUpperCase() };
  }

  return null;
}

/**
 * Отрисовка кадра виселицы
 * @param {object} view
 * @returns {string[]} массив строк экрана
 */
export function renderHangman(view) {
  const {
    lang = 'RU',
    word = '',
    maskedWord = '',
    errorsCount = 0,
    maxErrors = 6,
    wrongLetters = [],
    status = 'PLAYING',
  } = view;

  const stageIndex = Math.min(errorsCount, STAGES.length - 1);
  const art = STAGES[stageIndex] || STAGES[0];

  const lines = [
    '========================================',
    '      🎮 ВИСЕЛИЦА: ТЕРМИНЫ КУРСА        ',
    '========================================',
    ` [ Язык: ${lang} ]  (Tab / Пробел — сменить язык)`,
    '',
    ...art,
    '',
    ` Слово:   ${maskedWord}`,
    '',
  ];

  const wrongStr =
    wrongLetters.length > 0 ? ` (${wrongLetters.join(', ')})` : '';
  lines.push(` Ошибки: ${errorsCount}/${maxErrors}${wrongStr}`);
  lines.push('');

  if (status === 'WON') {
    lines.push(' 🎉 ПОБЕДА! Ты отгадал термин курса! Отличная работа!');
    lines.push(' Нажми [ r ] чтобы сыграть снова, или [ q ] для выхода.');
  } else if (status === 'LOST') {
    lines.push(` 💀 ВЫ ПРОИГРАЛИ! Загаданное слово было: ${word}`);
    lines.push(' Нажми [ r ] чтобы попробовать снова, или [ q ] для выхода.');
  } else {
    lines.push(' Управление: Нажимай буквы на клавиатуре');
    lines.push(' [ r ] — заново  |  [ q ] — выход');
  }

  lines.push('========================================');
  return lines;
}
