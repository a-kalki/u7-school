import { describe, expect, it } from 'bun:test';
import {
  createDirectionAdapter,
  cursorActionAdapter,
  renderGrid,
  renderNumberGrid,
} from './grid.js';

describe('render: grid.js', () => {
  describe('адаптеры ввода', () => {
    it('createDirectionAdapter распознаёт 4 направления (WASD и стрелки)', () => {
      const adapter = createDirectionAdapter();

      expect(adapter('w')).toEqual({ type: 'MOVE', direction: 'UP' });
      expect(adapter('\x1b[A')).toEqual({ type: 'MOVE', direction: 'UP' });
      expect(adapter('s')).toEqual({ type: 'MOVE', direction: 'DOWN' });
      expect(adapter('\x1b[B')).toEqual({ type: 'MOVE', direction: 'DOWN' });
      expect(adapter('a')).toEqual({ type: 'MOVE', direction: 'LEFT' });
      expect(adapter('\x1b[D')).toEqual({ type: 'MOVE', direction: 'LEFT' });
      expect(adapter('d')).toEqual({ type: 'MOVE', direction: 'RIGHT' });
      expect(adapter('\x1b[C')).toEqual({ type: 'MOVE', direction: 'RIGHT' });
    });

    it('cursorActionAdapter распознаёт движение курсора, открытие и флаг для Сапёра', () => {
      expect(cursorActionAdapter('w')).toEqual({
        type: 'MOVE_CURSOR',
        dx: 0,
        dy: -1,
      });
      expect(cursorActionAdapter('d')).toEqual({
        type: 'MOVE_CURSOR',
        dx: 1,
        dy: 0,
      });
      expect(cursorActionAdapter(' ')).toEqual({ type: 'ACTION_OPEN' });
      expect(cursorActionAdapter('\r')).toEqual({ type: 'ACTION_OPEN' });
      expect(cursorActionAdapter('f')).toEqual({ type: 'ACTION_FLAG' });
      expect(cursorActionAdapter('а')).toEqual({ type: 'ACTION_FLAG' });
    });
  });

  describe('renderGrid (символьная сетка)', () => {
    it('рендерит символьную матрицу с рамкой, статистикой и подсказками', () => {
      const view = {
        title: 'ЗМЕЙКА',
        grid: [
          ['#', '#', '#'],
          ['#', '@', '#'],
          ['#', '*', '#'],
        ],
        score: 10,
        status: 'PLAYING',
      };

      const lines = renderGrid(view);
      const text = lines.join('\n');

      expect(text).toContain('ЗМЕЙКА');
      expect(text).toContain('Счёт: 10');
      expect(text).toContain('+---+');
      expect(text).toContain('|#@#|');
    });

    it('отображает статус победы или поражения', () => {
      const winLines = renderGrid({
        title: 'СОКОБАН',
        grid: [[' ']],
        status: 'WON',
      });
      expect(winLines.join('\n')).toContain('ПОБЕДА!');

      const lostLines = renderGrid({
        title: 'ЗМЕЙКА',
        grid: [[' ']],
        status: 'GAME_OVER',
      });
      expect(lostLines.join('\n')).toContain('ИГРА ОКОНЧЕНА');
    });
  });

  describe('renderNumberGrid (числовая сетка для 2048)', () => {
    it('форматирует числа с равной шириной ячеек', () => {
      const view = {
        title: '2048',
        matrix: [
          [2, 4, 8, 16],
          [32, 64, 128, 256],
          [512, 1024, 2048, 0],
          [0, 0, 0, 0],
        ],
        score: 4096,
        status: 'PLAYING',
      };

      const lines = renderNumberGrid(view, { cellWidth: 5 });
      const text = lines.join('\n');

      expect(text).toContain('2048');
      expect(text).toContain('Счёт: 4096');
      expect(text).toContain(' 1024');
      expect(text).toContain(' 2048');
    });
  });
});
