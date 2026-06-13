import { describe, expect, test } from 'bun:test';
import { stringUtility } from './string-utility';

describe('StringUtility', () => {
  const sut = stringUtility;

  describe('random', () => {
    test('генерирует строку по формату hh-hhhh-hhhh', () => {
      const result = sut.random('hh-hhhh-hhhh');
      const regex = /^[0-9a-f]{2}-[0-9a-f]{4}-[0-9a-f]{4}$/;
      expect(result).toMatch(regex);
    });

    test('генерирует 6 hex-символов без разделителя', () => {
      const result = sut.random('hhhhhh', '');
      const regex = /^[0-9a-f]{6}$/;
      expect(result).toMatch(regex);
    });

    test('генерирует строку с кастомным разделителем', () => {
      const result = sut.random('dd.dddd.dddd', '.');
      const regex = /^[0-9]{2}\.[0-9]{4}\.[0-9]{4}$/;
      expect(result).toMatch(regex);
    });

    test('генерирует строку с буквами и цифрами', () => {
      const result = sut.random('AA-zz-04');
      const regex = /^[a-zA-Z0-9]{2}-[a-z]{2}-0[0-4]$/;
      expect(result).toMatch(regex);
    });

    test('выбрасывает ошибку при невалидном символе формата', () => {
      expect(() => sut.random('xx')).toThrow('Недопустимый символ формата');
    });
  });

  describe('trim', () => {
    test('удаляет пробелы с обеих сторон', () => {
      expect(sut.trim('  text   ', ' ')).toBe('text');
    });

    test('удаляет несколько символов', () => {
      expect(sut.trim('  text,   ', ' ,')).toBe('text');
    });

    test('не удаляет символы из середины', () => {
      expect(sut.trim('! ! ,text ! text   ', ' ,!')).toBe('text ! text');
    });
  });

  describe('makeFirstLetterUppercase', () => {
    test('делает первую букву заглавной', () => {
      expect(sut.makeFirstLetterUppercase('иван')).toBe('Иван');
    });

    test('уже заглавная — без изменений', () => {
      expect(sut.makeFirstLetterUppercase('Иван')).toBe('Иван');
    });

    test('пустая строка', () => {
      expect(sut.makeFirstLetterUppercase('')).toBe('');
    });
  });

  describe('camelCase ↔ kebab-case', () => {
    test('camelCaseToKebab', () => {
      expect(sut.camelCaseToKebab('someTextLine')).toBe('some-text-line');
    });

    test('kebabToCamelCase', () => {
      expect(sut.kebabToCamelCase('some-text-line')).toBe('someTextLine');
    });
  });

  describe('camelCase ↔ snake_case', () => {
    test('camelCaseToSnake', () => {
      expect(sut.camelCaseToSnake('someTextLine')).toBe('some_text_line');
    });

    test('snakeToCamelCase', () => {
      expect(sut.snakeToCamelCase('some_text_line')).toBe('someTextLine');
    });
  });

  describe('replaceTemplate', () => {
    test('заменяет шаблон {{ template }}', () => {
      const result = sut.replaceTemplate(
        'Hello {{ template }} world!',
        'template',
        'TypeScript',
      );
      expect(result).toBe('Hello TypeScript world!');
    });

    test('обрабатывает пробелы внутри скобок', () => {
      const result = sut.replaceTemplate(
        'Hello {{  template  }} world!',
        'template',
        'TypeScript',
      );
      expect(result).toBe('Hello TypeScript world!');
    });

    test('не заменяет если шаблон не найден', () => {
      const result = sut.replaceTemplate(
        'Hello {{ not_found }} world!',
        'template',
        'TypeScript',
      );
      expect(result).toBe('Hello {{ not_found }} world!');
    });
  });
});
