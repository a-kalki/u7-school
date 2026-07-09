import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { ContentPathSchema, parse, serialize } from './content-path';

describe('parse', () => {
  describe('короткая форма (A:B:C:D)', () => {
    test('только модуль — "1"', () => {
      const result = parse('1');
      expect(result.moduleIndex).toBe(1);
      expect(result.projectIndex).toBeUndefined();
      expect(result.lessonIndex).toBeUndefined();
      expect(result.stepIndex).toBeUndefined();
    });

    test('модуль:проект — "2:3"', () => {
      const result = parse('2:3');
      expect(result.moduleIndex).toBe(2);
      expect(result.projectIndex).toBe(3);
      expect(result.lessonIndex).toBeUndefined();
      expect(result.stepIndex).toBeUndefined();
    });

    test('модуль:проект:урок — "1:2:3"', () => {
      const result = parse('1:2:3');
      expect(result.moduleIndex).toBe(1);
      expect(result.projectIndex).toBe(2);
      expect(result.lessonIndex).toBe(3);
      expect(result.stepIndex).toBeUndefined();
    });

    test('полная форма — "2:1:3:4"', () => {
      const result = parse('2:1:3:4');
      expect(result.moduleIndex).toBe(2);
      expect(result.projectIndex).toBe(1);
      expect(result.lessonIndex).toBe(3);
      expect(result.stepIndex).toBe(4);
    });

    test('все шаги урока — "2:1:3:all"', () => {
      const result = parse('2:1:3:all');
      expect(result.moduleIndex).toBe(2);
      expect(result.projectIndex).toBe(1);
      expect(result.lessonIndex).toBe(3);
      expect(result.stepIndex).toBe('all');
    });
  });

  describe('явная форма (mA:pB:lC:sD)', () => {
    test('полная — "m1:p2:l3:s4"', () => {
      const result = parse('m1:p2:l3:s4');
      expect(result.moduleIndex).toBe(1);
      expect(result.projectIndex).toBe(2);
      expect(result.lessonIndex).toBe(3);
      expect(result.stepIndex).toBe(4);
    });

    test('только модуль — "m1"', () => {
      const result = parse('m1');
      expect(result.moduleIndex).toBe(1);
      expect(result.projectIndex).toBeUndefined();
      expect(result.lessonIndex).toBeUndefined();
      expect(result.stepIndex).toBeUndefined();
    });

    test('модуль:проект — "m1:p2"', () => {
      const result = parse('m1:p2');
      expect(result.moduleIndex).toBe(1);
      expect(result.projectIndex).toBe(2);
      expect(result.lessonIndex).toBeUndefined();
      expect(result.stepIndex).toBeUndefined();
    });

    test('модуль:проект:урок — "m1:p2:l3"', () => {
      const result = parse('m1:p2:l3');
      expect(result.moduleIndex).toBe(1);
      expect(result.projectIndex).toBe(2);
      expect(result.lessonIndex).toBe(3);
      expect(result.stepIndex).toBeUndefined();
    });

    test('m1:p2:l3:sall', () => {
      const result = parse('m1:p2:l3:sall');
      expect(result.moduleIndex).toBe(1);
      expect(result.projectIndex).toBe(2);
      expect(result.lessonIndex).toBe(3);
      expect(result.stepIndex).toBe('all');
    });

    test('явная и короткая форма дают одинаковый результат', () => {
      const short = parse('1:2:3:4');
      const explicit = parse('m1:p2:l3:s4');
      expect(short).toEqual(explicit);
    });
  });

  describe('ошибочные пути', () => {
    test('пустая строка — ошибка', () => {
      expect(() => parse('')).toThrow('Некорректный формат ContentPath');
    });

    test('пробелы — ошибка', () => {
      expect(() => parse('   ')).toThrow('Некорректный формат ContentPath');
    });

    test('нечисловое значение — "A:B:C:D"', () => {
      expect(() => parse('A:B:C:D')).toThrow();
    });

    test('отрицательный индекс — "-1:2:3:4"', () => {
      expect(() => parse('-1:2:3:4')).toThrow(
        'Индексы должны быть положительными',
      );
    });

    test('нулевой индекс модуля — "0:2:3:4"', () => {
      expect(() => parse('0:2:3:4')).toThrow(
        'Индексы должны быть положительными',
      );
    });

    test('нулевой элемент в явной форме — "m0:p2:l3:s4"', () => {
      expect(() => parse('m0:p2:l3:s4')).toThrow(
        'Индексы должны быть положительными',
      );
    });

    test('слишком много частей — "1:2:3:4:5"', () => {
      expect(() => parse('1:2:3:4:5')).toThrow('Некорректный формат ContentPath');
    });
  });
});

describe('serialize', () => {
  test('только модуль', () => {
    const cp = { moduleIndex: 1 };
    expect(serialize(cp)).toBe('1');
  });

  test('модуль:проект', () => {
    const cp = { moduleIndex: 2, projectIndex: 3 };
    expect(serialize(cp)).toBe('2:3');
  });

  test('модуль:проект:урок', () => {
    const cp = { moduleIndex: 1, projectIndex: 2, lessonIndex: 3 };
    expect(serialize(cp)).toBe('1:2:3');
  });

  test('полная форма с шагом', () => {
    const cp = {
      moduleIndex: 2,
      projectIndex: 1,
      lessonIndex: 3,
      stepIndex: 4 as const,
    };
    expect(serialize(cp)).toBe('2:1:3:4');
  });

  test('все шаги урока', () => {
    const cp = {
      moduleIndex: 2,
      projectIndex: 1,
      lessonIndex: 3,
      stepIndex: 'all' as const,
    };
    expect(serialize(cp)).toBe('2:1:3:all');
  });

  test('roundtrip: serialize(parse(x)) === x', () => {
    const original = '3:2:1:5';
    const cp = parse(original);
    expect(serialize(cp)).toBe(original);
  });

  test('roundtrip для "all"', () => {
    const original = '3:2:1:all';
    const cp = parse(original);
    expect(serialize(cp)).toBe(original);
  });
});

describe('ContentPathSchema', () => {
  test('валидный ContentPath проходит', () => {
    const input = {
      moduleIndex: 1,
      projectIndex: 2,
      lessonIndex: 3,
      stepIndex: 4,
    };
    expect(() => v.parse(ContentPathSchema, input)).not.toThrow();
  });

  test('только moduleIndex — проходит', () => {
    const input = { moduleIndex: 1 };
    expect(() => v.parse(ContentPathSchema, input)).not.toThrow();
  });

  test('stepIndex: "all" — проходит', () => {
    const input = {
      moduleIndex: 1,
      projectIndex: 2,
      lessonIndex: 3,
      stepIndex: 'all',
    };
    expect(() => v.parse(ContentPathSchema, input)).not.toThrow();
  });

  test('moduleIndex отсутствует — ошибка', () => {
    expect(() => v.parse(ContentPathSchema, {})).toThrow();
  });

  test('moduleIndex = 0 — ошибка', () => {
    expect(() =>
      v.parse(ContentPathSchema, { moduleIndex: 0 }),
    ).toThrow();
  });

  test('moduleIndex отрицательный — ошибка', () => {
    expect(() =>
      v.parse(ContentPathSchema, { moduleIndex: -1 }),
    ).toThrow();
  });
});
