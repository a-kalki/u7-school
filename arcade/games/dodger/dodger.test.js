import { describe, expect, it } from 'bun:test';
import { checkCollision, createState, getView, update } from './dodger.js';

describe('arcade/games/dodger/dodger.js', () => {
  it('checkCollision выявляет пересечение координат', () => {
    const asteroids = [
      { x: 3, y: 5 },
      { x: 7, y: 9 },
    ];
    expect(checkCollision(7, 9, asteroids)).toBe(true);
    expect(checkCollision(2, 9, asteroids)).toBe(false);
  });

  it('createState инициализирует корабль по центру нижней строки', () => {
    const state = createState({ width: 11, height: 8 });
    expect(state.width).toBe(11);
    expect(state.height).toBe(8);
    expect(state.playerX).toBe(5);
    expect(state.asteroids).toEqual([]);
    expect(state.score).toBe(0);
    expect(state.status).toBe('PLAYING');
  });

  it('MOVE влево и вправо не выходит за границы поля', () => {
    let state = createState({ width: 5, height: 5, playerX: 0 });

    // Попытка уйти левее 0
    state = update(state, { type: 'MOVE', direction: 'LEFT' });
    expect(state.playerX).toBe(0);

    // Движение вправо
    state = update(state, { type: 'MOVE', direction: 'RIGHT' });
    expect(state.playerX).toBe(1);

    // До границы 4
    state.playerX = 4;
    state = update(state, { type: 'MOVE', direction: 'RIGHT' });
    expect(state.playerX).toBe(4);
  });

  it('шаг под падающий астероид вызывает GAME_OVER', () => {
    const playerY = 4; // height = 5, playerY = 4
    const state = createState({
      width: 5,
      height: 5,
      playerX: 2,
      asteroids: [{ x: 1, y: playerY }],
    });

    const nextState = update(state, { type: 'MOVE', direction: 'LEFT' });
    expect(nextState.playerX).toBe(1);
    expect(nextState.status).toBe('GAME_OVER');
  });

  it('TICK сдвигает астероиды вниз и удаляет улетевшие за границу', () => {
    const state = createState({
      width: 6,
      height: 4,
      playerX: 0,
      spawnRate: 0, // отключаем спавн
      asteroids: [
        { x: 2, y: 1 },
        { x: 4, y: 3 }, // улетит за пределы поля (3 + 1 = 4 >= height)
      ],
    });

    const nextState = update(state, { type: 'TICK' }, () => 1.0);
    expect(nextState.score).toBe(1);
    expect(nextState.asteroids).toEqual([{ x: 2, y: 2 }]);
  });

  it('падение астероида на корабль вызывает GAME_OVER', () => {
    const state = createState({
      width: 6,
      height: 5,
      playerX: 3,
      spawnRate: 0,
      asteroids: [{ x: 3, y: 3 }], // на следующем тике станет (3, 4) — позиция игрока
    });

    const nextState = update(state, { type: 'TICK' }, () => 1.0);
    expect(nextState.status).toBe('GAME_OVER');
  });

  it('TICK спавнит новый астероид при randomFn < spawnRate', () => {
    const state = createState({
      width: 6,
      height: 5,
      playerX: 0,
      spawnRate: 0.5,
      asteroids: [],
    });

    // Мокаем randomFn так, чтобы сработал спавн на x = 2
    let callCount = 0;
    const mockRandom = () => {
      callCount += 1;
      return callCount === 1 ? 0.1 : 0.4; // 0.1 < 0.5 -> спавн, 0.4 * 6 = 2.4 -> x = 2
    };

    const nextState = update(state, { type: 'TICK' }, mockRandom);
    expect(nextState.asteroids.length).toBe(1);
    expect(nextState.asteroids[0]).toEqual({ x: 2, y: 0 });
  });

  it('getView формирует символьную сетку с кораблем и астероидами', () => {
    const state = createState({
      width: 5,
      height: 4,
      playerX: 2,
      asteroids: [{ x: 1, y: 1 }],
    });

    const view = getView(state);
    expect(view.title).toBe('Космический уворачивальщик');
    expect(view.grid[1][1]).toBe('●');
    expect(view.grid[3][2]).toBe('▲');
  });
});
