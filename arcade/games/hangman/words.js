/**
 * arcade/games/hangman/words.js — Словарь терминов курса (base64)
 *
 * Термины закодированы в base64, чтобы игрок не подсмотрел слова в исходном коде.
 */

// Список терминов на русском языке (закодирован в base64)
const RAW_RU_BASE64 = [
  '0KDQldCa0KPQoNCh0JjQrw==', // РЕКУРСИЯ
  '0JzQkNCh0KHQmNCS', // МАССИВ
  '0J7Qp9CV0KDQldCU0Kw=', // ОЧЕРЕДЬ
  '0KHQotCV0Jo=', // СТЕК
  '0KHQm9Ce0JLQkNCg0Kw=', // СЛОВАРЬ
  '0JDQm9CT0J7QoNCY0KLQnA==', // АЛГОРИТМ
  '0JzQkNCi0KDQmNCm0JA=', // МАТРИЦА
  '0JPQoNCQ0KQ=', // ГРАФ
  '0JHQmNCd0JDQoNCd0KvQmQ==', // БИНАРНЫЙ
  '0KHQntCg0KLQmNCg0J7QktCa0JA=', // СОРТИРОВКА
  '0KXQldCo', // ХЕШ
  '0KHQn9CY0KHQntCa', // СПИСОК
  '0JjQotCV0KDQkNCi0J7QoA==', // ИТЕРАТОР
  '0KHQm9Ce0JbQndCe0KHQotCs', // СЛОЖНОСТЬ
];

// Список терминов на английском языке (закодирован в base64)
const RAW_EN_BASE64 = [
  'UkVDVVJTSU9O', // RECURSION
  'QVJSQVk=', // ARRAY
  'UVVFVUU=', // QUEUE
  'U1RBQ0s=', // STACK
  'RElDVElPTkFSWQ==', // DICTIONARY
  'QUxHT1JJVEhN', // ALGORITHM
  'TUFUUklY', // MATRIX
  'R1JBUEg=', // GRAPH
  'QklOQVJZ', // BINARY
  'U09SVElORw==', // SORTING
  'SEFTSA==', // HASH
  'TElTVA==', // LIST
  'SVRFUkFUT1I=', // ITERATOR
  'Q09NUExFWElUWQ==', // COMPLEXITY
];

function decodeBase64List(list) {
  return list.map((item) =>
    Buffer.from(item.trim(), 'base64').toString('utf-8').toUpperCase(),
  );
}

const RU_WORDS = decodeBase64List(RAW_RU_BASE64);
const EN_WORDS = decodeBase64List(RAW_EN_BASE64);

/**
 * Возвращает список слов для выбранного языка ('ru' | 'en')
 * @param {'ru' | 'en'} [lang='ru']
 * @returns {string[]}
 */
export function getWords(lang = 'ru') {
  return String(lang).toLowerCase() === 'en' ? [...EN_WORDS] : [...RU_WORDS];
}

/**
 * Возвращает случайное слово из словаря выбранного языка
 * @param {'ru' | 'en'} [lang='ru']
 * @returns {string}
 */
export function getRandomWord(lang = 'ru') {
  const words = getWords(lang);
  const index = Math.floor(Math.random() * words.length);
  return words[index] || words[0];
}
