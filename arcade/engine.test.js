import { describe, expect, it } from 'bun:test';
import { EventEmitter } from 'node:events';
import { startEngine } from './engine.js';

describe('arcade: engine.js', () => {
  function createMockIo() {
    const stdin = new EventEmitter();
    stdin.setRawMode = () => {};
    stdin.resume = () => {};
    stdin.pause = () => {};

    let output = '';
    const stdout = {
      write: (chunk) => {
        output += chunk;
        return true;
      },
      get output() {
        return output;
      },
      clearOutput: () => {
        output = '';
      },
    };

    return { stdin, stdout };
  }

  it('инициализирует экран и вызывает начальный рендер', () => {
    const { stdin, stdout } = createMockIo();

    const handle = startEngine({
      title: 'Тест',
      createState: () => ({ count: 0 }),
      update: (state) => state,
      getView: (state) => `Счётчик: ${state.count}`,
      render: (view) => [view, 'Строка 2'],
      stdin,
      stdout,
    });

    // Должны быть включены альтернативный буфер и скрытие курсора
    expect(stdout.output).toContain('\x1b]0;Тест\x07');
    expect(stdout.output).toContain('\x1b[?1049h');
    expect(stdout.output).toContain('\x1b[?25l');
    expect(stdout.output).toContain('Счётчик: 0');
    expect(stdout.output).toContain('Строка 2');

    handle.stop();
    // При остановке должны восстанавливаться основной экран и курсор
    expect(stdout.output).toContain('\x1b[?25h');
    expect(stdout.output).toContain('\x1b[?1049l');
  });

  it('обрабатывает события ввода через adapter и обновляет кадр', () => {
    const { stdin, stdout } = createMockIo();

    const handle = startEngine({
      createState: () => ({ x: 0 }),
      adapter: (key) => {
        if (key === 'd') return { type: 'RIGHT' };
        return null;
      },
      update: (state, event) => {
        if (event.type === 'RIGHT') {
          return { x: state.x + 1 };
        }
        return state;
      },
      getView: (state) => `X=${state.x}`,
      render: (view) => [view],
      stdin,
      stdout,
    });

    stdout.clearOutput();
    stdin.emit('data', Buffer.from('d'));

    expect(stdout.output).toContain('X=1');
    handle.stop();
  });

  it('перезапускает игру по нажатию клавиши r', () => {
    const { stdin, stdout } = createMockIo();
    let initCounter = 0;

    const handle = startEngine({
      createState: () => ({ id: ++initCounter }),
      update: (state) => state,
      getView: (state) => `ID=${state.id}`,
      render: (view) => [view],
      stdin,
      stdout,
    });

    expect(stdout.output).toContain('ID=1');
    stdout.clearOutput();

    stdin.emit('data', Buffer.from('r'));
    expect(stdout.output).toContain('ID=2');

    handle.stop();
  });

  it('останавливает движок по нажатию Ctrl+C', () => {
    const { stdin, stdout } = createMockIo();

    const handle = startEngine({
      createState: () => ({}),
      update: (s) => s,
      getView: () => 'ИГРА',
      render: (v) => [v],
      stdin,
      stdout,
    });

    stdin.emit('data', Buffer.from('\u0003'));
    expect(stdout.output).toContain('\x1b[?25h');
    expect(stdout.output).toContain('\x1b[?1049l');
    expect(handle.isRunning()).toBe(false);
  });

  it('поддерживает тики времени при передаче tickRateMs', async () => {
    const { stdin, stdout } = createMockIo();

    const handle = startEngine({
      tickRateMs: 30,
      createState: () => ({ ticks: 0 }),
      update: (state, event) => {
        if (event.type === 'TICK') {
          return { ticks: state.ticks + 1 };
        }
        return state;
      },
      getView: (state) => `Тик=${state.ticks}`,
      render: (view) => [view],
      stdin,
      stdout,
    });

    await new Promise((resolve) => setTimeout(resolve, 80));
    handle.stop();

    expect(stdout.output).toContain('Тик=1');
  });
});
