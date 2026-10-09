import { describe, expect, it } from 'bun:test';
import {
  countAdjacentMines,
  createState,
  getNeighbors,
  getView,
  update,
} from './minesweeper.js';

describe('arcade/games/minesweeper/minesweeper.js', () => {
  it('getNeighbors возвращает 8 соседей для центральной клетки', () => {
    const neighbors = getNeighbors(1, 1, 3, 3);
    expect(neighbors.length).toBe(8);
  });

  it('getNeighbors возвращает 3 соседа для угловой клетки', () => {
    const neighbors = getNeighbors(0, 0, 3, 3);
    expect(neighbors.length).toBe(3);
  });

  it('countAdjacentMines корректно считает соседей', () => {
    const cells = [
      [{ hasMine: true }, { hasMine: false }, { hasMine: false }],
      [{ hasMine: false }, { hasMine: false }, { hasMine: false }],
      [{ hasMine: false }, { hasMine: false }, { hasMine: true }],
    ];
    const count = countAdjacentMines(1, 1, cells, 3, 3);
    expect(count).toBe(2);
  });

  it('движение курсора не выходит за пределы поля', () => {
    let state = createState({ width: 3, height: 3, minesCount: 1 });
    state.cursor = { x: 0, y: 0 };

    state = update(state, { type: 'MOVE_CURSOR', dx: -1, dy: 0 });
    expect(state.cursor.x).toBe(0);

    state = update(state, { type: 'MOVE_CURSOR', dx: 1, dy: 1 });
    expect(state.cursor).toEqual({ x: 1, y: 1 });
  });

  it('установка и снятие флага', () => {
    let state = createState({ width: 3, height: 3, minesCount: 1 });
    state.cursor = { x: 0, y: 0 };

    // Установка
    state = update(state, { type: 'ACTION_FLAG' });
    expect(state.cells[0][0].state).toBe('FLAG');
    expect(state.flagsCount).toBe(1);

    // Снятие
    state = update(state, { type: 'ACTION_FLAG' });
    expect(state.cells[0][0].state).toBe('CLOSED');
    expect(state.flagsCount).toBe(0);
  });

  it('открытие мины приводит к поражению и открытию всех мин', () => {
    let state = createState({
      width: 3,
      height: 3,
      minesCount: 1,
      minePositions: [{ x: 0, y: 0 }],
    });
    state.cursor = { x: 0, y: 0 };

    state = update(state, { type: 'ACTION_OPEN' });
    expect(state.status).toBe('LOST');
    expect(state.cells[0][0].state).toBe('OPEN');
  });

  it('каскадное открытие пустых клеток и победа при открытии всех безопасных ячеек', () => {
    // Поле 3х3, одна мина в углу (2, 2)
    let state = createState({
      width: 3,
      height: 3,
      minesCount: 1,
      minePositions: [{ x: 2, y: 2 }],
    });
    state.cursor = { x: 0, y: 0 };

    // В (0, 0) мин вокруг нет (0), должен сработать каскад
    state = update(state, { type: 'ACTION_OPEN' });

    // Все безопасные ячейки должны открыться
    expect(state.cells[0][0].state).toBe('OPEN');
    expect(state.cells[2][2].hasMine).toBe(true);
    expect(state.status).toBe('WON');
  });

  it('getView формирует символьную сетку для renderGrid', () => {
    const state = createState({ width: 3, height: 3, minesCount: 1 });
    const view = getView(state);
    expect(view.title).toBe('Сапёр');
    expect(view.grid.length).toBe(3);
    expect(view.grid[state.cursor.y][state.cursor.x]).toContain('[');
  });
});
