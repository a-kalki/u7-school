import { describe, expect, it } from 'bun:test';
import { createState, getView, update } from './turtle.js';

describe('games/turtle: turtle.js', () => {
  it('createState инициализирует начальные параметры', () => {
    const state = createState({ width: 10, height: 10, x: 2, y: 3 });
    expect(state.width).toBe(10);
    expect(state.height).toBe(10);
    expect(state.x).toBe(2);
    expect(state.y).toBe(3);
    expect(state.direction).toBe('E');
    expect(state.penDown).toBe(true);
    expect(state.trail).toEqual(['2,3']);
  });

  it('поворачивает черепашку направо и налево', () => {
    let state = createState({ direction: 'N' });

    state = update(state, { type: 'TURN_RIGHT' });
    expect(state.direction).toBe('E');

    state = update(state, { type: 'TURN_RIGHT' });
    expect(state.direction).toBe('S');

    state = update(state, { type: 'TURN_LEFT' });
    expect(state.direction).toBe('E');

    state = update(state, { type: 'TURN_LEFT' });
    expect(state.direction).toBe('N');

    state = update(state, { type: 'TURN_LEFT' });
    expect(state.direction).toBe('W');
  });

  it('двигает вперед по направлению с опущенным пером и оставляет след', () => {
    let state = createState({ x: 2, y: 2, direction: 'E', penDown: true });

    state = update(state, { type: 'FORWARD' });
    expect(state.x).toBe(3);
    expect(state.y).toBe(2);
    expect(state.trail).toContain('2,2');
    expect(state.trail).toContain('3,2');
    expect(state.stepsCount).toBe(1);
  });

  it('не выходит за границы поля при движении вперед', () => {
    let state = createState({
      width: 5,
      height: 5,
      x: 4,
      y: 2,
      direction: 'E',
    });

    state = update(state, { type: 'FORWARD' });
    expect(state.x).toBe(4); // уперся в стену справа
  });

  it('двигает назад', () => {
    let state = createState({ x: 3, y: 3, direction: 'E' });

    state = update(state, { type: 'BACKWARD' });
    expect(state.x).toBe(2);
    expect(state.y).toBe(3);
  });

  it('переключает перо и очищает след', () => {
    let state = createState({ penDown: true });

    state = update(state, { type: 'TOGGLE_PEN' });
    expect(state.penDown).toBe(false);

    state = update(state, { type: 'CLEAR_TRAIL' });
    expect(state.trail).toEqual([]);
  });

  it('getView формирует матрицу символов с черепашкой и следом', () => {
    let state = createState({
      width: 5,
      height: 5,
      x: 1,
      y: 1,
      direction: 'N',
    });
    state = update(state, { type: 'FORWARD' }); // переместился в 1, 0

    const view = getView(state);
    expect(view.grid[0][1]).toBe('^'); // черепашка на (1, 0)
    expect(view.grid[1][1]).toBe('.'); // след на (1, 1)
    expect(view.stepsCount).toBe(1);
  });
});
