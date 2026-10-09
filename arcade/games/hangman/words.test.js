import { describe, expect, it } from 'bun:test';
import { getRandomWord, getWords } from './words.js';

describe('games/hangman: words.js', () => {
  it('возвращает список русских терминов курса', () => {
    const ruWords = getWords('ru');
    expect(ruWords.length).toBeGreaterThanOrEqual(10);
    expect(ruWords).toContain('РЕКУРСИЯ');
    expect(ruWords).toContain('МАССИВ');
    expect(ruWords).toContain('СТЕК');
  });

  it('возвращает список английских терминов курса', () => {
    const enWords = getWords('en');
    expect(enWords.length).toBeGreaterThanOrEqual(10);
    expect(enWords).toContain('RECURSION');
    expect(enWords).toContain('ARRAY');
    expect(enWords).toContain('STACK');
  });

  it('по умолчанию возвращает русский список', () => {
    const words = getWords();
    expect(words).toContain('РЕКУРСИЯ');
  });

  it('выбирает случайное слово из словаря', () => {
    const wordRu = getRandomWord('ru');
    const wordEn = getRandomWord('en');
    expect(getWords('ru')).toContain(wordRu);
    expect(getWords('en')).toContain(wordEn);
  });
});
