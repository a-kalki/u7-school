import { describe, expect, it } from 'bun:test';
import { checkWinner, createState, getView, update } from './tictactoe.js';

describe('arcade/games/tictactoe/tictactoe.js', () => {
  it('checkWinner распознаёт горизонтальную победу', () => {
    const grid = [
      ['X', 'X', 'X'],
      [' ', 'O', ' '],
      ['O', ' ', ' '],
    ];
    expect(checkWinner(grid, 'X')).toBe(true);
    expect(checkWinner(grid, 'O')).toBe(false);
  });

  it('checkWinner распознаёт диагональную победу', () => {
    const grid = [
      ['O', 'X', ' '],
      ['X', 'O', ' '],
      [' ', 'X', 'O'],
    ];
    expect(checkWinner(grid, 'O')).toBe(true);
  });

  it('createState инициализирует пустое поле 3x3', () => {
    const state = createState();
    expect(state.size).toBe(3);
    expect(state.currentPlayer).toBe('X');
    expect(state.status).toBe('PLAYING');
    expect(state.movesCount).toBe(0);
  });

  it('игроки поочередно ставят знаки X и O', () => {
    let state = createState();
    state.cursor = { x: 0, y: 0 };

    // Ход X
    state = update(state, { type: 'ACTION_PLACE' });
    expect(state.grid[0][0]).toBe('X');
    expect(state.currentPlayer).toBe('O');

    // Ход O на (1, 0)
    state.cursor = { x: 1, y: 0 };
    state = update(state, { type: 'ACTION_PLACE' });
    expect(state.grid[0][1]).toBe('O');
    expect(state.currentPlayer).toBe('X');
  });

  it('нельзя ставить знак в уже занятую клетку', () => {
    let state = createState();
    state.cursor = { x: 0, y: 0 };
    state = update(state, { type: 'ACTION_PLACE' }); // X поставил
    expect(state.currentPlayer).toBe('O');

    // O пытается поставить в ту же клетку
    const sameState = update(state, { type: 'ACTION_PLACE' });
    expect(sameState.currentPlayer).toBe('O'); // Ход не засчитан
    expect(sameState.movesCount).toBe(1);
  });

  it('победа фиксируется со статусом WON и winner', () => {
    let state = createState();
    // Смоделируем победу X по верхней строке
    state.grid = [
      ['X', 'X', ' '],
      ['O', 'O', ' '],
      [' ', ' ', ' '],
    ];
    state.cursor = { x: 2, y: 0 };
    state.currentPlayer = 'X';
    state.movesCount = 4;

    state = update(state, { type: 'ACTION_PLACE' });
    expect(state.status).toBe('WON');
    expect(state.winner).toBe('X');
  });

  it('ничья фиксируется когда все 9 клеток заполнены без победы', () => {
    let state = createState();
    state.grid = [
      ['X', 'O', 'X'],
      ['X', 'O', 'O'],
      ['O', 'X', ' '],
    ];
    state.cursor = { x: 2, y: 2 };
    state.currentPlayer = 'X';
    state.movesCount = 8;

    state = update(state, { type: 'ACTION_PLACE' });
    expect(state.status).toBe('DRAW');
  });

  it('getView возвращает структуру для renderGrid', () => {
    const state = createState();
    const view = getView(state);
    expect(view.title).toBe('Крестики-нолики');
    expect(view.grid.length).toBe(3);
    expect(view.extraInfo[0]).toContain('Текущий ход');
  });
});
