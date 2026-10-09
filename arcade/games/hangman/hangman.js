/**
 * arcade/games/hangman/hangman.js — Логика игры «Виселица» (Слой 3)
 *
 * Чистые функции, только POJO структуры данных.
 */

import { getRandomWord } from './words.js';

/**
 * Создаёт начальное состояние игры
 * @param {object} [options]
 * @param {string} [options.word] - загаданное слово
 * @param {'ru' | 'en'} [options.lang='ru'] - язык терминов
 * @returns {object} начальное состояние
 */
export function createState(options = {}) {
  const lang = options.lang === 'en' ? 'en' : 'ru';
  const word = options.word ? options.word.toUpperCase() : getRandomWord(lang);

  return {
    word,
    lang,
    guessedLetters: [],
    wrongLetters: [],
    maxErrors: 6,
    status: 'PLAYING', // 'PLAYING' | 'WON' | 'LOST'
  };
}

/**
 * Обновляет состояние игры при получении события
 * @param {object} state
 * @param {object} event
 * @returns {object} новое состояние
 */
export function update(state, event) {
  if (event.type === 'TOGGLE_LANG') {
    const nextLang = state.lang === 'ru' ? 'en' : 'ru';
    return createState({ lang: nextLang });
  }

  if (state.status !== 'PLAYING') {
    return state;
  }

  if (event.type === 'GUESS') {
    const char = String(event.char || '').toUpperCase();
    if (!char) return state;

    // Уже называли эту букву?
    if (
      state.guessedLetters.includes(char) ||
      state.wrongLetters.includes(char)
    ) {
      return state;
    }

    if (state.word.includes(char)) {
      const nextGuessed = [...state.guessedLetters, char];
      // Проверяем победу: все ли уникальные буквы слова угаданы
      const uniqueLetters = Array.from(new Set(state.word.split('')));
      const isWon = uniqueLetters.every((letter) =>
        nextGuessed.includes(letter),
      );

      return {
        ...state,
        guessedLetters: nextGuessed,
        status: isWon ? 'WON' : 'PLAYING',
      };
    }

    // Буквы нет в слове — ошибка
    const nextWrong = [...state.wrongLetters, char];
    const isLost = nextWrong.length >= state.maxErrors;

    return {
      ...state,
      wrongLetters: nextWrong,
      status: isLost ? 'LOST' : 'PLAYING',
    };
  }

  return state;
}

/**
 * Формирует представление (view) для рендерера
 * @param {object} state
 * @returns {object}
 */
export function getView(state) {
  const maskedChars = state.word
    .split('')
    .map((letter) => (state.guessedLetters.includes(letter) ? letter : '_'));

  return {
    lang: state.lang.toUpperCase(),
    word: state.word,
    maskedWord: maskedChars.join(' '),
    errorsCount: state.wrongLetters.length,
    maxErrors: state.maxErrors,
    wrongLetters: [...state.wrongLetters],
    status: state.status,
  };
}
