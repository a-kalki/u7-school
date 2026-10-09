/**
 * arcade/engine.js — Игровое ядро терминала (Слой 1)
 *
 * Отвечает за:
 * 1. Raw mode терминала и посимвольный ввод с клавиатуры.
 * 2. Отрисовку буфера без мерцания через альтернативный экран терминала.
 * 3. Игровой цикл (пошаговый режим или тики времени tickRateMs).
 * 4. Системные команды (выход Ctrl+C / q, рестарт r).
 */

const ANSI = {
  ENTER_ALT_SCREEN: '\x1b[?1049h',
  EXIT_ALT_SCREEN: '\x1b[?1049l',
  HIDE_CURSOR: '\x1b[?25l',
  SHOW_CURSOR: '\x1b[?25h',
  CLEAR_SCREEN: '\x1b[2J',
  CURSOR_HOME: '\x1b[H',
  CLEAR_TO_END: '\x1b[J',
};

/**
 * Запуск игрового движка
 *
 * @param {object} options
 * @param {string} [options.title] - заголовок окна терминала
 * @param {function} options.createState - функция создания начального состояния: () => State
 * @param {function} options.update - функция обновления состояния: (state, event) => State
 * @param {function} options.getView - функция извлечения представления: (state) => View
 * @param {function} options.render - функция отрисовки кадра: (view, state) => string | string[]
 * @param {function} [options.adapter] - адаптер ввода: (key, rawData) => Event | null
 * @param {number} [options.tickRateMs] - интервал тика в миллисекундах (если игра реального времени)
 * @param {object} [options.stdin] - поток ввода (по умолчанию process.stdin)
 * @param {object} [options.stdout] - поток вывода (по умолчанию process.stdout)
 * @returns {object} handle с методами stop(), isRunning()
 */
export function startEngine(options) {
  const {
    title = '',
    createState,
    update,
    getView,
    render,
    adapter = null,
    tickRateMs = 0,
    stdin = process.stdin,
    stdout = process.stdout,
  } = options;

  let state = createState();
  let running = true;
  let timerId = null;
  let isFirstFrame = true;

  // Инициализация терминала
  if (typeof stdin.setRawMode === 'function') {
    stdin.setRawMode(true);
  }
  if (typeof stdin.resume === 'function') {
    stdin.resume();
  }

  // Отрисовка текущего кадра
  function draw() {
    if (!running) return;
    const view = getView(state);
    const rendered = render(view, state);
    const content = Array.isArray(rendered)
      ? rendered.join('\n')
      : String(rendered);

    if (isFirstFrame) {
      isFirstFrame = false;
      const titleSeq = title ? `\x1b]0;${title}\x07` : '';
      // Атомарно переключаем буфер терминала, очищаем и выводим первый кадр целиком
      stdout.write(
        `${titleSeq}${ANSI.ENTER_ALT_SCREEN}${ANSI.HIDE_CURSOR}${ANSI.CLEAR_SCREEN}${ANSI.CURSOR_HOME}${content}\n`,
      );
    } else {
      stdout.write(`${ANSI.CURSOR_HOME}${ANSI.CLEAR_TO_END}${content}\n`);
    }
  }

  // Остановка движка и возврат терминала в обычный режим
  function stop() {
    if (!running) return;
    running = false;

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    if (typeof stdin.removeListener === 'function') {
      stdin.removeListener('data', onData);
    }

    if (typeof stdin.setRawMode === 'function') {
      stdin.setRawMode(false);
    }
    if (typeof stdin.pause === 'function') {
      stdin.pause();
    }

    stdout.write(`${ANSI.SHOW_CURSOR}${ANSI.EXIT_ALT_SCREEN}`);
  }

  // Обработка ввода
  function onData(chunk) {
    if (!running) return;

    const rawStr = chunk.toString();

    // Системный выход: Ctrl+C (\u0003)
    if (rawStr === '\u0003') {
      stop();
      return;
    }

    // Если адаптер вернул событие
    const event = adapter ? adapter(rawStr, chunk) : null;

    // Если адаптер не перехватил клавишу, проверяем стандартные системные команды
    if (!event) {
      if (
        rawStr === 'r' ||
        rawStr === 'R' ||
        rawStr === 'к' ||
        rawStr === 'К'
      ) {
        // Рестарт игры
        state = createState();
        draw();
        return;
      }

      if (
        rawStr === 'q' ||
        rawStr === 'Q' ||
        rawStr === 'й' ||
        rawStr === 'Й'
      ) {
        stop();
        return;
      }
    }

    if (event) {
      state = update(state, event);
      draw();
    }
  }

  // Подписка на поток ввода
  stdin.on('data', onData);

  // Поддержка тиков времени (если игра в реальном времени)
  if (tickRateMs > 0) {
    timerId = setInterval(() => {
      if (!running) return;
      state = update(state, { type: 'TICK' });
      draw();
    }, tickRateMs);
  }

  // Первоначальный кадр
  draw();

  return {
    stop,
    isRunning: () => running,
  };
}
