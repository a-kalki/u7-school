import { describe, expect, it } from 'bun:test';
import {
  createState,
  getView,
  isOppositeDirection,
  spawnFood,
  update,
} from './snake.js';

describe('arcade/games/snake/snake.js', () => {
  it('isOppositeDirection корректно выявляет противоположные направления', () => {
    expect(isOppositeDirection('LEFT', 'RIGHT')).toBe(true);
    expect(isOppositeDirection('RIGHT', 'LEFT')).toBe(true);
    expect(isOppositeDirection('UP', 'DOWN')).toBe(true);
    expect(isOppositeDirection('DOWN', 'UP')).toBe(true);
    expect(isOppositeDirection('UP', 'RIGHT')).toBe(false);
    expect(isOppositeDirection('LEFT', 'DOWN')).toBe(false);
  });

  it('spawnFood генерирует еду только на свободной клетке', () => {
    const width = 2;
    const height = 2;
    // Занимаем 3 клетки из 4
    const body = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    const food = spawnFood(width, height, body);
    expect(food).toEqual({ x: 1, y: 1 });
  });

  it('createState инициализирует змейку заданной длины и направления', () => {
    const state = createState({ width: 10, height: 10 });
    expect(state.width).toBe(10);
    expect(state.height).toBe(10);
    expect(state.body.length).toBe(3);
    expect(state.direction).toBe('RIGHT');
    expect(state.status).toBe('PLAYING');
    expect(state.score).toBe(0);
  });

  it('CHANGE_DIRECTION меняет направление, но игнорирует разворот на 180 градусов', () => {
    let state = createState({
      width: 10,
      height: 10,
      direction: 'RIGHT',
    });

    // Поворот вниз разрешен
    state = update(state, { type: 'CHANGE_DIRECTION', direction: 'DOWN' });
    expect(state.nextDirection).toBe('DOWN');

    // Разворот влево при движении вправо блокируется
    state.direction = 'RIGHT';
    state = update(state, { type: 'CHANGE_DIRECTION', direction: 'LEFT' });
    expect(state.nextDirection).toBe('DOWN'); // осталось прежним
  });

  it('TICK перемещает змейку вперед в направлении движения', () => {
    const state = createState({
      width: 10,
      height: 10,
      body: [
        { x: 3, y: 2 },
        { x: 2, y: 2 },
        { x: 1, y: 2 },
      ],
      direction: 'RIGHT',
      food: { x: 8, y: 8 },
    });

    const nextState = update(state, { type: 'TICK' });
    expect(nextState.body[0]).toEqual({ x: 4, y: 2 }); // новая голова
    expect(nextState.body[1]).toEqual({ x: 3, y: 2 });
    expect(nextState.body[2]).toEqual({ x: 2, y: 2 });
    expect(nextState.body.length).toBe(3); // длина сохранилась
  });

  it('TICK приводит к GAME_OVER при ударе о стену', () => {
    const state = createState({
      width: 5,
      height: 5,
      body: [
        { x: 4, y: 2 },
        { x: 3, y: 2 },
        { x: 2, y: 2 },
      ],
      direction: 'RIGHT',
      food: { x: 0, y: 0 },
    });

    const nextState = update(state, { type: 'TICK' });
    expect(nextState.status).toBe('GAME_OVER');
  });

  it('TICK приводит к GAME_OVER при столкновении с собственным телом', () => {
    // Змейка делает петлю
    const state = createState({
      width: 10,
      height: 10,
      body: [
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 4, y: 4 },
        { x: 4, y: 3 },
        { x: 4, y: 2 },
      ],
      direction: 'RIGHT',
      food: { x: 0, y: 0 },
    });
    // Пытаемся пойти вправо -> там клетка (4, 3), которая в теле змейки
    const nextState = update(state, { type: 'TICK' });
    expect(nextState.status).toBe('GAME_OVER');
  });

  it('съедание еды увеличивает длину змейки и начисляет очки', () => {
    const state = createState({
      width: 10,
      height: 10,
      body: [
        { x: 3, y: 2 },
        { x: 2, y: 2 },
        { x: 1, y: 2 },
      ],
      direction: 'RIGHT',
      food: { x: 4, y: 2 }, // еда прямо перед головой
    });

    const nextState = update(state, { type: 'TICK' });
    expect(nextState.score).toBe(10);
    expect(nextState.body.length).toBe(4);
    expect(nextState.body[0]).toEqual({ x: 4, y: 2 });
    // Спавнится новая еда
    expect(nextState.food).not.toEqual({ x: 4, y: 2 });
  });

  it('getView формирует символьную сетку с головой и едой', () => {
    const state = createState({
      width: 6,
      height: 6,
      body: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
      ],
      direction: 'RIGHT',
      food: { x: 4, y: 2 },
    });

    const view = getView(state);
    expect(view.title).toBe('Змейка (Snake)');
    expect(view.grid[2][2]).toBe('►');
    expect(view.grid[2][1]).toBe('o');
    expect(view.grid[2][4]).toBe('★');
  });
});
