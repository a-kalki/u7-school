import { describe, expect, it } from 'bun:test';
import { createState, getView, update } from './sokoban.js';

describe('arcade/games/sokoban/sokoban.js', () => {
  const miniMap = ['#####', '#@$ #', '# . #', '#####'];

  it('createState находит игрока и инициализирует поле', () => {
    const state = createState({ map: miniMap });
    expect(state.player).toEqual({ x: 1, y: 1 });
    expect(state.movesCount).toBe(0);
    expect(state.status).toBe('PLAYING');
  });

  it('игрок не проходит сквозь стену', () => {
    const state = createState({ map: miniMap });
    // Шаг влево в стену #
    const nextState = update(state, { type: 'MOVE', direction: 'LEFT' });
    expect(nextState.player).toEqual({ x: 1, y: 1 });
    expect(nextState.movesCount).toBe(0);
  });

  it('игрок толкает ящик на свободный пол', () => {
    const state = createState({ map: miniMap });
    // Шаг вправо толкает ящик $ на (3, 1)
    const nextState = update(state, { type: 'MOVE', direction: 'RIGHT' });
    expect(nextState.player).toEqual({ x: 2, y: 1 });
    expect(nextState.grid[1][3]).toBe('$');
    expect(nextState.grid[1][2]).toBe('@');
    expect(nextState.grid[1][1]).toBe(' ');
    expect(nextState.pushesCount).toBe(1);
    expect(nextState.movesCount).toBe(1);
  });

  it('игрок не может толкать ящик в стену (коллизия)', () => {
    const blockedMap = ['####', '#@$#', '####'];
    const state = createState({ map: blockedMap });
    const nextState = update(state, { type: 'MOVE', direction: 'RIGHT' });
    expect(nextState.player).toEqual({ x: 1, y: 1 });
    expect(nextState.pushesCount).toBe(0);
  });

  it('игрок не может толкать два ящика подряд (двойная коллизия)', () => {
    const doubleBoxMap = ['######', '#@$$ #', '######'];
    const state = createState({ map: doubleBoxMap });
    const nextState = update(state, { type: 'MOVE', direction: 'RIGHT' });
    expect(nextState.player).toEqual({ x: 1, y: 1 });
    expect(nextState.pushesCount).toBe(0);
  });

  it('доставка ящика на цель превращает его в * и фиксирует победу', () => {
    // Поставим ящик перед целью
    const boxGoalMap = ['#####', '#@$.#', '#####'];
    const state = createState({ map: boxGoalMap });
    const nextState = update(state, { type: 'MOVE', direction: 'RIGHT' });
    expect(nextState.grid[1][3]).toBe('*');
    expect(nextState.status).toBe('WON');
  });

  it('getView формирует данные для renderGrid', () => {
    const state = createState({ map: miniMap });
    const view = getView(state);
    expect(view.title).toContain('Сокобан');
    expect(view.grid).toEqual(state.grid);
    expect(view.score).toBe(0);
  });
});
