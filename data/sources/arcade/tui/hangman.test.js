import { describe, expect, it } from 'bun:test';
import { inputAdapter, renderHangman } from './hangman.js';

describe('render: hangman.js', () => {
  describe('inputAdapter', () => {
    it('распознаёт буквы (включая Q и R) и переводит в верхний регистр', () => {
      expect(inputAdapter('а')).toEqual({ type: 'GUESS', char: 'А' });
      expect(inputAdapter('z')).toEqual({ type: 'GUESS', char: 'Z' });
      expect(inputAdapter('q')).toEqual({ type: 'GUESS', char: 'Q' });
      expect(inputAdapter('r')).toEqual({ type: 'GUESS', char: 'R' });
      expect(inputAdapter('к')).toEqual({ type: 'GUESS', char: 'К' });
      expect(inputAdapter('й')).toEqual({ type: 'GUESS', char: 'Й' });
    });

    it('распознаёт переключение языка по Tab', () => {
      expect(inputAdapter('\t')).toEqual({ type: 'TOGGLE_LANG' });
    });

    it('распознаёт рестарт по Ctrl+R и подтверждение по Enter/пробелу', () => {
      expect(inputAdapter('\u0012')).toEqual({ type: 'RESTART' });
      expect(inputAdapter(' ')).toEqual({ type: 'ACTION_CONFIRM' });
      expect(inputAdapter('\r')).toEqual({ type: 'ACTION_CONFIRM' });
    });

    it('пропускает системные Ctrl+C и Esc для ядра', () => {
      expect(inputAdapter('\u0003')).toBeNull();
      expect(inputAdapter('\x1b')).toBeNull();
    });
  });

  describe('renderHangman', () => {
    it('рендерит начальный кадр виселицы без ошибок', () => {
      const view = {
        lang: 'RU',
        maskedWord: '_ _ _ _',
        errorsCount: 0,
        maxErrors: 6,
        wrongLetters: [],
        status: 'PLAYING',
      };

      const lines = renderHangman(view);
      const text = lines.join('\n');

      expect(text).toContain('ВИСЕЛИЦА: ТЕРМИНЫ КУРСА');
      expect(text).toContain('Язык: RU');
      expect(text).toContain('_ _ _ _');
      expect(text).toContain('Ошибки: 0/6');
    });

    it('рендерит победный экран', () => {
      const view = {
        lang: 'RU',
        word: 'РЕКУРСИЯ',
        maskedWord: 'Р Е К У Р С И Я',
        errorsCount: 2,
        maxErrors: 6,
        wrongLetters: ['А', 'Б'],
        status: 'WON',
      };

      const lines = renderHangman(view);
      const text = lines.join('\n');

      expect(text).toContain('ПОБЕДА!');
      expect(text).toContain('Ошибки: 2/6 (А, Б)');
    });

    it('рендерит экран поражения с раскрытием слова', () => {
      const view = {
        lang: 'EN',
        word: 'RECURSION',
        maskedWord: 'R E C _ _ S I O N',
        errorsCount: 6,
        maxErrors: 6,
        wrongLetters: ['A', 'B', 'D', 'F', 'G', 'H'],
        status: 'LOST',
      };

      const lines = renderHangman(view);
      const text = lines.join('\n');

      expect(text).toContain('ВЫ ПРОИГРАЛИ');
      expect(text).toContain('RECURSION');
    });
  });
});
