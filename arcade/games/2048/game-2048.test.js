import { describe, expect, it } from 'bun:test';
import {
  canMove,
  createState,
  getView,
  hasWon,
  moveMatrix,
  rotateMatrix,
  slideRow,
  update,
} from './game-2048.js';

describe('arcade/games/2048/game-2048.js', () => {
  describe('slideRow', () => {
    it('сдвигает нули вправо без изменений ненулевых элементов', () => {
      const { row, gainedScore } = slideRow([0, 2, 0, 4]);
      expect(row).toEqual([2, 4, 0, 0]);
      expect(gainedScore).toBe(0);
    });

    it('схлопывает одинаковые соседние числа и начисляет очки', () => {
      const { row, gainedScore } = slideRow([2, 2, 4, 4]);
      expect(row).toEqual([4, 8, 0, 0]);
      expect(gainedScore).toBe(12);
    });

    it('схлопывает только один раз за ход при трёх одинаковых числах', () => {
      const { row, gainedScore } = slideRow([2, 2, 2, 0]);
      expect(row).toEqual([4, 2, 0, 0]);
      expect(gainedScore).toBe(4);
    });
  });

  describe('rotateMatrix', () => {
    it('корректно поворачивает матрицу на 90 градусов по часовой стрелке', () => {
      const input = [
        [1, 2],
        [3, 4],
      ];
      const rotated = rotateMatrix(input);
      expect(rotated).toEqual([
        [3, 1],
        [4, 2],
      ]);
    });
  });

  describe('moveMatrix', () => {
    it('сдвигает матрицу влево', () => {
      const matrix = [
        [2, 0, 0, 2],
        [0, 0, 0, 0],
        [4, 4, 4, 0],
        [0, 2, 2, 2],
      ];
      const { matrix: res, gainedScore, changed } = moveMatrix(matrix, 'LEFT');
      expect(changed).toBe(true);
      expect(res[0]).toEqual([4, 0, 0, 0]);
      expect(res[2]).toEqual([8, 4, 0, 0]);
      expect(res[3]).toEqual([4, 2, 0, 0]);
      expect(gainedScore).toBe(4 + 8 + 4);
    });

    it('сдвигает матрицу вверх', () => {
      const matrix = [
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { matrix: res, gainedScore, changed } = moveMatrix(matrix, 'UP');
      expect(changed).toBe(true);
      expect(res[0][0]).toBe(4);
      expect(res[1][0]).toBe(0);
      expect(gainedScore).toBe(4);
    });

    it('возвращает changed: false если сдвиг невозможен', () => {
      const matrix = [
        [2, 4, 8, 16],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { changed } = moveMatrix(matrix, 'LEFT');
      expect(changed).toBe(false);
    });
  });

  describe('hasWon & canMove', () => {
    it('hasWon возвращает true если есть плитка 2048', () => {
      const matrix = [
        [0, 0, 0, 0],
        [0, 2048, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      expect(hasWon(matrix)).toBe(true);
    });

    it('canMove возвращает false если нет пустых клеток и нет смежных совпадений', () => {
      const fullMatrix = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      expect(canMove(fullMatrix)).toBe(false);
    });

    it('canMove возвращает true если есть смежные одинаковые плитки', () => {
      const matrix = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 4, 2],
        [4, 2, 4, 2],
      ];
      expect(canMove(matrix)).toBe(true);
    });
  });

  describe('createState & update & getView', () => {
    it('createState инициализирует поле 4x4 с двумя плитками', () => {
      const state = createState();
      expect(state.size).toBe(4);
      expect(state.score).toBe(0);
      expect(state.status).toBe('PLAYING');

      const nonZeros = state.matrix.flat().filter((x) => x > 0);
      expect(nonZeros.length).toBe(2);
    });

    it('update игнорирует невозможные сдвиги и не меняет состояние', () => {
      const state = {
        size: 4,
        matrix: [
          [2, 4, 8, 16],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        score: 0,
        status: 'PLAYING',
      };
      const nextState = update(state, { type: 'MOVE', direction: 'LEFT' });
      expect(nextState).toBe(state);
    });

    it('update обновляет счёт и спавнит плитку при результативном ходе', () => {
      const state = {
        size: 4,
        matrix: [
          [2, 2, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        score: 0,
        status: 'PLAYING',
      };
      const nextState = update(state, { type: 'MOVE', direction: 'LEFT' });
      expect(nextState.score).toBe(4);
      expect(nextState.matrix[0][0]).toBe(4);
      const totalTiles = nextState.matrix.flat().filter((x) => x > 0).length;
      expect(totalTiles).toBe(2); // 4 + заспавненная плитка
    });

    it('getView возвращает структуру для рендерера', () => {
      const state = createState();
      const view = getView(state);
      expect(view.title).toBe('2048');
      expect(view.matrix).toEqual(state.matrix);
      expect(view.score).toBe(0);
      expect(view.status).toBe('PLAYING');
    });
  });
});
