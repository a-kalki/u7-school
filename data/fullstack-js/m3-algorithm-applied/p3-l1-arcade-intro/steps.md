# Шаги урока: Введение в проект «Аркада»: Игровой цикл и архитектура терминального движка

---

### Цель и концепция проекта «Аркада»

**kind:** `text`

Добро пожаловать в проект **«Аркада»**!

В предыдущих проектах мы работали со статическими скриптами и веб-серверами. Теперь пришло время погрузиться в мир интерактивных терминальных приложений (TUI) и игр.

В течение следующих пяти уроков ты создашь собственную модульную игровую консоль в терминале. Ты не просто напишешь одну игру, а построишь расширяемый движок, поверх которого запустишь целую библиотеку классических игр: от пошаговых головоломок до динамических аркад реального времени.

**Чему ты научишься в проекте «Аркада»:**
1. Понимать и реализовывать фундаментальный архитектурный паттерн **Game Loop** (Игровой цикл): Input → Update → Render.
2. Проектировать чистые функции состояния: `createState()`, `update(state, action)`, `getView(state)`.
3. Работать с низкоуровневым терминальным вводом: «сырой» режим клавиатуры (raw mode), ANSI escape-последовательности, очистка экрана без мерцания.
4. Разделять систему на независимые слои: движок ядра (`engine.js`), адаптеры устройств ввода, визуальные рендереры и изолированную игровую логику.
5. Писать надёжные юнит-тесты на чистую логику правил без моков терминала.

---

### Трёхзвенная архитектура: Input → Update → Render

**kind:** `text`

В основе любой интерактивной игры лежит цикл обновления кадров:

```text
┌─────────────────┐
│     Событие     │  (Нажатие клавиши, тик таймера)
└────────┬────────┘
         │  raw input
         ▼
┌─────────────────┐
│  inputAdapter   │  Преобразует байты клавиш в действие { type, ... }
└────────┬────────┘
         │  action
         ▼
┌─────────────────┐
│  update(s, a)   │  Чистая функция: вычисляет новое состояние
└────────┬────────┘
         │  newState
         ▼
┌─────────────────┐
│  getView(state) │  Формирует проекцию кадра для экрана
└────────┬────────┘
         │  viewData
         ▼
┌─────────────────┐
│  renderScreen   │  Очищает экран и выводит кадр в терминал
└─────────────────┘
```

**Разделение ответственности:**
- **Движок (`engine.js`):** знает о терминале, таймерах и процессах Node.js/Bun, но ничего не знает о правилах конкретной игры.
- **Адаптер ввода (`adapter`):** переводит конкретные символы клавиатуры (например, стрелочки или WASD) в декларативные действия (`MOVE`, `GUESS_LETTER`).
- **Игровая логика (`game.js`):** набор чистых функций. Она ничего не знает о терминале, цветах и таймерах. Принимает старое состояние и действие, возвращает новое состояние.
- **Рендерер (`render`):** принимает структуру кадра и превращает её в красивую строку с рамками и статистикой.

---

### Архитектурный контракт игры

**kind:** `text`

Каждая игра в нашей консоли представляет собой модуль с тремя экспортируемыми чистыми функциями:

```javascript
// 1. Создание начального состояния игры
export function createState(options = {}) {
  return {
    score: 0,
    status: 'PLAYING',
    // ...специфичные поля игры
  };
}

// 2. Детерминированное обновление состояния
export function update(state, action) {
  if (action.type === 'SOME_ACTION') {
    return { ...state, score: state.score + 10 };
  }
  return state;
}

// 3. Подготовка данных для отрисовки
export function getView(state) {
  return {
    title: 'Название игры',
    lines: ['Строка 1', 'Строка 2'],
    score: state.score,
    status: state.status,
    extraInfo: ['Подсказка по управлению'],
  };
}
```

Благодаря такому контракту тестировать игру становится предельно просто: достаточно вызвать `update(state, action)` и проверить возвращенный объект с помощью `expect()`.

---

### Создание рабочего пространства проекта

**kind:** `text`

Создадим структуру папок для нашего аркадного комплекса.

Перейди в корень своего учебного репозитория и выполни команды:

```bash
mkdir -p arcade/render
mkdir -p arcade/games/hangman
```

Структура проекта:
- `arcade/engine.js` — ядро игрового движка;
- `arcade/render/` — модули отображения (виселица, черепашка, сетки);
- `arcade/games/` — папки отдельных игр со своей логикой и тестами.

---

### Реализация универсального движка: arcade/engine.js

**kind:** `text`

Создай файл `arcade/engine.js`.

Этот модуль переводит терминал в режим прямого чтения байтов (`setRawMode(true)`), запускает игровой цикл, слушает события клавиатуры и таймера, а при выходе корректно возвращает терминал в исходное состояние:

```javascript
/**
 * arcade/engine.js — Ядро терминального игрового движка
 */

export function startEngine(config) {
  const {
    title = 'Arcade Game',
    adapter = (raw) => null,
    render = (view) => {},
    createState = () => ({}),
    update = (state, action) => state,
    getView = (state) => ({ title, lines: [] }),
    tickRateMs = null,
    inputStream = process.stdin,
    outputStream = process.stdout,
  } = config;

  let state = createState();
  let timerId = null;
  let isRunning = true;

  function renderCurrentFrame() {
    const viewData = getView(state);
    // \x1b[2J\x1b[H — ANSI-последовательность очистки экрана и перевода курсора в левый верхний угол
    outputStream.write('\x1b[2J\x1b[H');
    render(viewData);
  }

  function cleanup() {
    if (!isRunning) return;
    isRunning = false;

    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }

    if (inputStream.isTTY) {
      inputStream.setRawMode(false);
    }
    inputStream.pause();
    outputStream.write('\x1b[?25h\n'); // Включаем обратно курсор
  }

  function handleAction(action) {
    if (!action || !isRunning) return;
    state = update(state, action);
    renderCurrentFrame();
  }

  function onData(chunk) {
    const rawStr = chunk.toString();

    // Ctrl+C (код 0x03) или Esc (0x1b) — экстренный выход
    if (rawStr === '\u0003' || rawStr === '\x1b') {
      cleanup();
      process.exit(0);
    }

    // Клавиша 'r' или 'R' — перезапуск текущей игры
    if (rawStr === 'r' || rawStr === 'R' || rawStr === 'к' || rawStr === 'К') {
      state = createState();
      renderCurrentFrame();
      return;
    }

    // Клавиша 'q' или 'Q' — выход из игры
    if (rawStr === 'q' || rawStr === 'Q' || rawStr === 'й' || rawStr === 'Й') {
      cleanup();
      process.exit(0);
    }

    const action = adapter(rawStr);
    if (action) {
      handleAction(action);
    }
  }

  // Настройка потока ввода терминала
  if (inputStream.isTTY) {
    inputStream.setRawMode(true);
  }
  inputStream.resume();
  inputStream.setEncoding('utf8');
  inputStream.on('data', onData);

  // Прячем курсор во время игры
  outputStream.write('\x1b[?25l');

  // Первый кадр
  renderCurrentFrame();

  // Если игра реального времени — запускаем тики
  if (tickRateMs !== null && tickRateMs > 0) {
    timerId = setInterval(() => {
      handleAction({ type: 'TICK' });
    }, tickRateMs);
  }

  return {
    getState: () => state,
    stop: cleanup,
  };
}
```

---

### Первая игра: Словарь терминов для «Виселицы»

**kind:** `text`

Первой игрой для обкатки архитектуры станет «Виселица» (Hangman). Студент отгадывает термины из курса веб-разработки на русском и английском языках.

Создай файл `arcade/games/hangman/words.js`:

```javascript
/**
 * arcade/games/hangman/words.js — Словарь терминов для Виселицы
 */

export const DICTIONARY = {
  ru: [
    'АЛГОРИТМ',
    'РЕКУРСИЯ',
    'МАССИВ',
    'ФУНКЦИЯ',
    'ЗАМЫКАНИЕ',
    'СТЕК',
    'ОЧЕРЕДЬ',
    'МАТРИЦА',
  ],
  en: [
    'ALGORITHM',
    'RECURSION',
    'CLOSURE',
    'PROMISE',
    'ARRAY',
    'OBJECT',
    'VARIABLE',
    'BOOLEAN',
  ],
};

export function getRandomWord(lang = 'ru', randomFn = Math.random) {
  const words = DICTIONARY[lang] || DICTIONARY.ru;
  const index = Math.floor(randomFn() * words.length);
  return words[index];
}
```

---

### Логика правил Виселицы: arcade/games/hangman/hangman.js

**kind:** `text`

Создай файл `arcade/games/hangman/hangman.js`.

Обрати внимание: функции чистые и не содержат ни одной команды вывода в консоль!

```javascript
import { getRandomWord } from './words.js';

export function createState(options = {}) {
  const lang = options.lang || 'ru';
  const word = options.word || getRandomWord(lang);

  return {
    word: word.toUpperCase(),
    lang,
    guessedLetters: [],
    wrongLetters: [],
    maxErrors: options.maxErrors || 6,
    status: 'PLAYING', // 'PLAYING' | 'WON' | 'LOST'
  };
}

export function update(state, action) {
  if (!action || state.status !== 'PLAYING') {
    return state;
  }

  if (action.type === 'GUESS_LETTER') {
    const letter = action.letter.toUpperCase();
    if (state.guessedLetters.includes(letter) || state.wrongLetters.includes(letter)) {
      return state; // Буква уже вводилась
    }

    if (state.word.includes(letter)) {
      const guessedLetters = [...state.guessedLetters, letter];
      const isWon = state.word.split('').every((char) => guessedLetters.includes(char));
      return {
        ...state,
        guessedLetters,
        status: isWon ? 'WON' : 'PLAYING',
      };
    } else {
      const wrongLetters = [...state.wrongLetters, letter];
      const isLost = wrongLetters.length >= state.maxErrors;
      return {
        ...state,
        wrongLetters,
        status: isLost ? 'LOST' : 'PLAYING',
      };
    }
  }

  return state;
}

export function getView(state) {
  const maskedWord = state.word
    .split('')
    .map((char) => (state.guessedLetters.includes(char) ? char : '_'))
    .join(' ');

  return {
    title: 'Игра «Виселица» (Hangman)',
    maskedWord,
    errorsCount: state.wrongLetters.length,
    maxErrors: state.maxErrors,
    wrongLetters: state.wrongLetters,
    status: state.status,
    word: state.word,
  };
}
```

---

### Тестирование логики Виселицы

**kind:** `text`

Напишем юнит-тесты на чистые функции в `arcade/games/hangman/hangman.test.js`:

```javascript
import { describe, expect, it } from 'bun:test';
import { createState, update } from './hangman.js';

describe('arcade/games/hangman/hangman.js', () => {
  it('угадывание правильной буквы открывает её', () => {
    let state = createState({ word: 'КОД' });
    state = update(state, { type: 'GUESS_LETTER', letter: 'К' });
    expect(state.guessedLetters).toContain('К');
    expect(state.status).toBe('PLAYING');
  });

  it('ошибочная буква увеличивает счётчик ошибок', () => {
    let state = createState({ word: 'КОД' });
    state = update(state, { type: 'GUESS_LETTER', letter: 'А' });
    expect(state.wrongLetters).toContain('А');
  });

  it('достижение максимального числа ошибок приводит к LOST', () => {
    let state = createState({ word: 'КОД', maxErrors: 1 });
    state = update(state, { type: 'GUESS_LETTER', letter: 'Ы' });
    expect(state.status).toBe('LOST');
  });

  it('открытие всех букв приводит к WON', () => {
    let state = createState({ word: 'ДА' });
    state = update(state, { type: 'GUESS_LETTER', letter: 'Д' });
    state = update(state, { type: 'GUESS_LETTER', letter: 'А' });
    expect(state.status).toBe('WON');
  });
});
```

Запусти тесты через Bun:

```bash
bun test arcade/games/hangman/
```

Все тесты должны успешно пройти.

---

### Запуск и проверка первой игры

**kind:** `text`

Создай файл точки входа `arcade/games/hangman/run.js`:

```javascript
import { startEngine } from '../../engine.js';
import { hangmanInputAdapter, renderHangman } from '../../render/hangman.js';
import { createState, getView, update } from './hangman.js';

startEngine({
  title: 'Виселица',
  adapter: hangmanInputAdapter,
  render: renderHangman,
  createState,
  update,
  getView,
});
```

Запусти игру в своем терминале:

```bash
bun arcade/games/hangman/run.js
```

Попробуй ввести буквы, проверь рестарт по нажатию клавиши `R` и заверши игру клавишей `Q`.
Архитектурный фундамент готов! На следующем уроке мы перейдем к графике двумерных сеток.
