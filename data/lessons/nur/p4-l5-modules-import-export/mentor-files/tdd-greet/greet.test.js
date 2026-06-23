console.log('[greet.test.js] начало загрузки');

import {
  test,
  expect,
  describe,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
} from 'bun:test';
import { greet } from './greet.js';

console.log('[greet.test.js] после импорта');

// beforeAll(() => { console.log('  [beforeAll — глобальный]'); });
// beforeEach(() => { console.log('    [beforeEach — глобальный]'); });
// afterEach(() => { console.log('    [afterEach — глобальный]'); });
// afterAll(() => { console.log('  [afterAll — глобальный]'); });

console.log('[greet.test.js] === регистрация тестов ===');

describe('Общий скоуп', () => {
  console.log('cb - Общего скоупа');
  describe('greet', () => {
    console.log('cb - greet');
    // beforeAll(() => { console.log('    [describe beforeAll]'); });
    // beforeEach(() => { console.log('      [describe beforeEach]'); });
    // afterEach(() => { console.log('      [describe afterEach]'); });
    // afterAll(() => { console.log('    [describe afterAll]'); });

    test('с именем', () => {
      console.log('cb - с именем');
      const result = greet('Алия');
      console.log('        результат:', result);
      expect(result).toBe('Привет, Алия!');
    });

    test('с пустой строкой', () => {
      console.log('cb - с пустой строкой');
      const result = greet('');
      console.log('        результат:', result);
      expect(result).toBe('Привет, незнакомец!');
    });
  });

  // describe('разные проверки expect', () => {
  //   test('.toBe — строгое равенство', () => {
  //     expect(2 + 2).toBe(4);
  //   });
  //
  //   test('.toEqual — глубокое сравнение', () => {
  //     expect({ name: 'Алия', age: 23 }).toEqual({ name: 'Алия', age: 23 });
  //   });
  //
  //   test('.not.toBe — отрицание', () => {
  //     expect(2 + 2).not.toBe(5);
  //   });
  //
  //   test('.toContain — вхождение в строку', () => {
  //     expect('Астана - столица Казахстана').toContain('столица');
  //   });
  //
  //   test('.toContain — вхождение в массив', () => {
  //     expect(['Алия', 'Бек', 'Чингиз']).toContain('Бек');
  //   });
  //
  //   test('.toHaveLength — длина', () => {
  //     expect([1, 2, 3]).toHaveLength(3);
  //   });
  //
  //   test('.toBeUndefined — является undefined', () => {
  //     expect(10).not.toBeUndefined();
  //   });
  //
  //   test('.toBeNull — проверка на null', () => {
  //     const value = null;
  //     expect(value).toBeNull();
  //   });
  //
  //   test('.toHaveProperty — свойство объекта', () => {
  //     expect({ name: 'Алия' }).toHaveProperty('name');
  //   });
  //
  //   test('.toThrow — исключение', () => {
  //     const throwedCallback = () => {
  //       throw new Error('Ошибка: что-то сломалось');
  //     };
  //     expect(throwedCallback).toThrow('что-то сломалось');
  //   });
  // });
});

console.log('[greet.test.js] === регистрация завершена ===');
