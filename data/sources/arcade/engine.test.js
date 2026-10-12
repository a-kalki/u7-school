import { describe, expect, it } from 'bun:test';
import { EventEmitter } from 'node:events';
import { SOUNDS, startEngine } from './engine.js';

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

  it('отдаёт клавиши r и q в адаптер игры, если адаптер их обрабатывает (например, в Виселице)', () => {
    const { stdin, stdout } = createMockIo();
    const receivedChars = [];

    const handle = startEngine({
      createState: () => ({ count: 0 }),
      adapter: (key) => {
        if (key === 'r' || key === 'q') {
          return { type: 'GUESS_CHAR', char: key };
        }
        return null;
      },
      update: (state, event) => {
        if (event.type === 'GUESS_CHAR') {
          receivedChars.push(event.char);
        }
        return state;
      },
      getView: () => 'ИГРА',
      render: () => ['ИГРА'],
      stdin,
      stdout,
    });

    stdin.emit('data', Buffer.from('r'));
    stdin.emit('data', Buffer.from('q'));

    expect(receivedChars).toEqual(['r', 'q']);
    expect(handle.isRunning()).toBe(true);

    handle.stop();
  });

  it('останавливает движок по нажатию Ctrl+C и Esc', () => {
    const { stdin, stdout } = createMockIo();

    let handle = startEngine({
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

    // Проверяем Esc
    stdout.clearOutput();
    handle = startEngine({
      createState: () => ({}),
      update: (s) => s,
      getView: () => 'ИГРА',
      render: (v) => [v],
      stdin,
      stdout,
    });

    stdin.emit('data', Buffer.from('\x1b'));
    expect(stdout.output).toContain('\x1b[?25h');
    expect(stdout.output).toContain('\x1b[?1049l');
    expect(handle.isRunning()).toBe(false);
  });

  it('поддерживает тики времени при передаче tickRateMs и передаёт tickCounter начиная с 1', async () => {
    const { stdin, stdout } = createMockIo();
    const recordedCounters = [];

    const handle = startEngine({
      tickRateMs: 30,
      createState: () => ({ ticks: 0 }),
      update: (state, event) => {
        if (event.type === 'TICK') {
          recordedCounters.push(event.tickCounter);
          return { ticks: event.tickCounter };
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

    expect(recordedCounters.length).toBeGreaterThan(0);
    expect(recordedCounters[0]).toBe(1);
    expect(stdout.output).toContain('Тик=1');
  });

  it('не выполняет повторный вывод в stdout при холостых тиках и неизменном кадре', async () => {
    const { stdin, stdout } = createMockIo();

    const handle = startEngine({
      tickRateMs: 20,
      createState: () => ({ frame: 'КАДР_1', tick: 0 }),
      update: (state, event) => {
        if (event.type === 'TICK') {
          // Стейт возвращается новый (счётчик тиков растёт), но кадр остаётся прежним
          return { ...state, tick: state.tick + 1 };
        }
        return state;
      },
      getView: (state) => state.frame,
      render: (view) => [view],
      stdin,
      stdout,
    });

    // Запоминаем длину вывода после первого рендера
    const initialOutputLength = stdout.output.length;

    await new Promise((resolve) => setTimeout(resolve, 60));

    // За время ожидания произошло несколько тиков, но длина вывода не выросла,
    // так как кадр не изменился (проверяем до handle.stop(), который шлёт exit alt screen)
    expect(stdout.output.length).toBe(initialOutputLength);

    handle.stop();
  });

  it('воспроизводит звуковой сигнал при возврате sound: SOUNDS.BEEP и сбрасывает поле', () => {
    const { stdin, stdout } = createMockIo();

    let currentState = null;
    const handle = startEngine({
      createState: () => ({ x: 0 }),
      adapter: (key) => (key === 'b' ? { type: 'BEEP' } : null),
      update: (state, event) => {
        if (event.type === 'BEEP') {
          return { ...state, sound: SOUNDS.BEEP };
        }
        return state;
      },
      getView: (state) => {
        currentState = state;
        return `X=${state.x}`;
      },
      render: (view) => [view],
      stdin,
      stdout,
    });

    stdout.clearOutput();
    stdin.emit('data', Buffer.from('b'));

    // В вывод stdout должен попасть символ звонка \x07
    expect(stdout.output).toContain('\x07');
    // Поле sound в состоянии должно быть очищено движком
    expect(currentState.sound).toBeNull();

    handle.stop();
  });

  it('поддерживает перечисление SOUNDS и серию сигналов для ALARM', async () => {
    const { stdin, stdout } = createMockIo();

    const handle = startEngine({
      createState: () => ({ sound: SOUNDS.ALARM }),
      update: (state) => state,
      getView: () => 'GAME',
      render: (view) => [view],
      stdin,
      stdout,
    });

    // При старте уже отправлен 1-й \x07
    expect(stdout.output).toContain('\x07');

    // Ждем выполнения таймеров серии ALARM (80ms и 160ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Должно быть отправлено 3 сигнала \x07
    const bellCount = stdout.output.split('\x07').length - 1;
    // 1-й сигнал может сопровождаться заголовком окна (\x1b]0;...\x07), поэтому проверяем минимум 3
    expect(bellCount).toBeGreaterThanOrEqual(3);

    handle.stop();
  });
});
