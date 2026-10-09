import { describe, expect, it } from 'bun:test';
import { inputAdapter, renderTurtle } from './turtle.js';

describe('render: turtle.js', () => {
  describe('inputAdapter', () => {
    it('распознаёт WASD и стрелки', () => {
      expect(inputAdapter('w')).toEqual({ type: 'FORWARD' });
      expect(inputAdapter('s')).toEqual({ type: 'BACKWARD' });
      expect(inputAdapter('a')).toEqual({ type: 'TURN_LEFT' });
      expect(inputAdapter('d')).toEqual({ type: 'TURN_RIGHT' });

      // ANSI стрелки
      expect(inputAdapter('\x1b[A')).toEqual({ type: 'FORWARD' });
      expect(inputAdapter('\x1b[B')).toEqual({ type: 'BACKWARD' });
      expect(inputAdapter('\x1b[D')).toEqual({ type: 'TURN_LEFT' });
      expect(inputAdapter('\x1b[C')).toEqual({ type: 'TURN_RIGHT' });
    });

    it('распознаёт пробел для переключения пера и c для очистки', () => {
      expect(inputAdapter(' ')).toEqual({ type: 'TOGGLE_PEN' });
      expect(inputAdapter('c')).toEqual({ type: 'CLEAR_TRAIL' });
      expect(inputAdapter('с')).toEqual({ type: 'CLEAR_TRAIL' });
    });

    it('пропускает системные r и q', () => {
      expect(inputAdapter('r')).toBeNull();
      expect(inputAdapter('q')).toBeNull();
    });
  });

  describe('renderTurtle', () => {
    it('рендерит поле черепашки с рамкой и координатами', () => {
      const view = {
        grid: [
          ['.', ' ', ' '],
          [' ', '>', ' '],
        ],
        x: 1,
        y: 1,
        direction: 'E',
        penDown: true,
        stepsCount: 1,
      };

      const lines = renderTurtle(view);
      const text = lines.join('\n');

      expect(text).toContain('ЧЕРЕПАШКА НА СЕТКЕ');
      expect(text).toContain('X=1, Y=1');
      expect(text).toContain('ОПУЩЕНО');
      expect(text).toContain('+---+');
      expect(text).toContain('| > |');
    });
  });
});
