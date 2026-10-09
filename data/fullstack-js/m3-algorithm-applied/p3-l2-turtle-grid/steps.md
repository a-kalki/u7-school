# Шаги урока: Графика в терминале: Сетки, координаты и игра «Черепашка» (PR 1)

---

### От одномерного текста к двумерному пространству

**kind:** `text`

В прошлом уроке мы запустили ядро игрового движка и текстовую «Виселицу». Сегодня мы делаем качественный шаг вперёд: выходим в двумерное пространство координат `(x, y)` и учимся строить двумерные сетки (Grid).

Большинство классических видеоигр — шахматы, тетрис, змейка, рогалики, 2048 — используют дискретную сетку в качестве своего пространства.

**Ключевые концепции урока:**
- Система экранных координат терминала: начало `(0, 0)` в левом верхнем углу, ось `X` направлена вправо, ось `Y` — вниз.
- Матричное представление поля: массив строк `grid[y][x]`.
- Векторная арифметика: направление задаётся смещениями `{ dx, dy }`.
- Универсальный рендерер сетки с ANSI-рамками.
- Реализация интерактивной «Черепашки» (Turtle Graphics) и оформление **Pull Request 1**.

---

### Экранная система координат и матрицы в JavaScript

**kind:** `text`

В математической декартовой системе координат ось `Y` обычно направлена вверх. Но в компьютерной графике и в терминалах принят другой стандарт:

```text
(0,0) ──── X (вправо: x += 1) ────►
  │   [0][0]  [0][1]  [0][2]
  │
  Y   [1][0]  [1][1]  [1][2]
  │
(вниз: [2][0]  [2][1]  [2][2]
y += 1)
  ▼
```

**Обрати внимание на порядок индексов в коде:**
Когда мы объявляем матрицу как массив строк:
```javascript
const grid = [
  ['.', '.', '.'], // строка y = 0
  ['.', 'T', '.'], // строка y = 1
  ['.', '.', '.'], // строка y = 2
];
```
Обращение к ячейке с координатами `x` и `y` всегда пишется как **`grid[y][x]`** (сначала номер строки `y`, затем номер столбца `x`). Это одна из самых частых причин ошибок у начинающих разработчиков — запомни это правило!

---

### Направления и векторное смещение

**kind:** `text`

Чтобы перемещать объект в дискретном пространстве, достаточно описать таблицу векторов смещения:

```javascript
const DIRECTIONS = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

const DELTAS = {
  UP:    { dx:  0, dy: -1 },
  RIGHT: { dx:  1, dy:  0 },
  DOWN:  { dx:  0, dy:  1 },
  LEFT:  { dx: -1, dy:  0 },
};
```

Поворот на 90 градусов по часовой стрелке — это просто циклический сдвиг индекса в массиве `DIRECTIONS`:

```javascript
function turnRight(currentDirection) {
  const currentIndex = DIRECTIONS.indexOf(currentDirection);
  const nextIndex = (currentIndex + 1) % DIRECTIONS.length;
  return DIRECTIONS[nextIndex];
}

function turnLeft(currentDirection) {
  const currentIndex = DIRECTIONS.indexOf(currentDirection);
  const prevIndex = (currentIndex - 1 + DIRECTIONS.length) % DIRECTIONS.length;
  return DIRECTIONS[prevIndex];
}
```

А смещение точки с координатами `{ x, y }` в заданном направлении — простая сумма:

```javascript
const delta = DELTAS[currentDirection];
const nextX = currentX + delta.dx;
const nextY = currentY + delta.dy;
```

---

### Универсальный модуль отрисовки: arcade/render/grid.js

**kind:** `text`

Создадим переиспользуемый модуль визуализации двумерных полей: `arcade/render/grid.js`.

Он будет использоваться практически во всех наших играх: Сокобане, Сапёре, Крестиках-ноликах, Змейке и Уворачивальщике.

```javascript
/**
 * arcade/render/grid.js — Рендер символьных матриц с рамками
 */

export function renderGrid(viewData) {
  const {
    title = 'Сетка',
    grid = [],
    score = 0,
    status = 'PLAYING',
    extraInfo = [],
  } = viewData;

  const height = grid.length;
  const width = height > 0 ? grid[0].length : 0;

  console.log(`=== ${title} ===`);
  if (score !== undefined) {
    console.log(`Счёт / Шаги: ${score} | Статус: ${status}`);
  }

  // Верхняя рамка
  console.log('┌' + '─'.repeat(width) + '┐');

  // Строки поля
  for (let y = 0; y < height; y += 1) {
    const line = grid[y].join('');
    console.log('│' + line + '│');
  }

  // Нижняя рамка
  console.log('└' + '─'.repeat(width) + '┘');

  // Дополнительная информация и подсказки
  for (const info of extraInfo) {
    console.log(info);
  }
}
```

---

### Игра «Черепашка»: arcade/games/turtle/turtle.js

**kind:** `text`

«Черепашка» (Turtle) — знаменитая концепция языка Logo, на которой поколения программистов учились векторной графике.

Черепашка живёт на поле `20x10`, умеет ходить вперёд/назад, поворачивать и рисовать след при опущенном пере.

Создай файл `arcade/games/turtle/turtle.js`:

```javascript
const DIRECTIONS = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

const DELTAS = {
  UP: { dx: 0, dy: -1 },
  RIGHT: { dx: 1, dy: 0 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
};

const TURTLE_ICONS = {
  UP: '▲',
  RIGHT: '►',
  DOWN: '▼',
  LEFT: '◄',
};

export function createState(options = {}) {
  return {
    width: options.width || 20,
    height: options.height || 10,
    x: options.x !== undefined ? options.x : 0,
    y: options.y !== undefined ? options.y : 0,
    direction: options.direction || 'RIGHT',
    penDown: options.penDown !== undefined ? options.penDown : true,
    trail: options.trail || [], // массив координат следа: [{ x, y }]
    movesCount: 0,
  };
}

export function update(state, action) {
  if (!action) return state;

  if (action.type === 'ROTATE_RIGHT') {
    const idx = DIRECTIONS.indexOf(state.direction);
    const nextDir = DIRECTIONS[(idx + 1) % DIRECTIONS.length];
    return { ...state, direction: nextDir };
  }

  if (action.type === 'ROTATE_LEFT') {
    const idx = DIRECTIONS.indexOf(state.direction);
    const prevDir = DIRECTIONS[(idx - 1 + DIRECTIONS.length) % DIRECTIONS.length];
    return { ...state, direction: prevDir };
  }

  if (action.type === 'TOGGLE_PEN') {
    return { ...state, penDown: !state.penDown };
  }

  if (action.type === 'CLEAR') {
    return { ...state, trail: [] };
  }

  if (action.type === 'FORWARD') {
    const delta = DELTAS[state.direction];
    const targetX = Math.max(0, Math.min(state.width - 1, state.x + delta.dx));
    const targetY = Math.max(0, Math.min(state.height - 1, state.y + delta.dy));

    let newTrail = state.trail;
    if (state.penDown) {
      const alreadyHas = state.trail.some((p) => p.x === state.x && p.y === state.y);
      if (!alreadyHas) {
        newTrail = [...state.trail, { x: state.x, y: state.y }];
      }
    }

    return {
      ...state,
      x: targetX,
      y: targetY,
      trail: newTrail,
      movesCount: state.movesCount + 1,
    };
  }

  return state;
}

export function getView(state) {
  const grid = Array.from({ length: state.height }, () =>
    Array(state.width).fill(' ')
  );

  // Рисуем след
  for (const point of state.trail) {
    if (point.y < state.height && point.x < state.width) {
      grid[point.y][point.x] = '·';
    }
  }

  // Рисуем черепашку
  grid[state.y][state.x] = TURTLE_ICONS[state.direction];

  return {
    title: 'Черепашья графика (Turtle)',
    grid,
    score: state.movesCount,
    status: 'ACTIVE',
    extraInfo: [
      `Позиция: (${state.x}, ${state.y}) | Перо: ${state.penDown ? 'ОПУЩЕНО [ON]' : 'ПОДНЯТО [OFF]'}`,
      'Управление: W/Стрелка вверх — шаг вперед | A/D — поворот | Пробел — перо | C — очистить',
    ],
  };
}
```

---

### Тестирование логики Черепашки

**kind:** `text`

Создай файл тестов `arcade/games/turtle/turtle.test.js`:

```javascript
import { describe, expect, it } from 'bun:test';
import { createState, update } from './turtle.js';

describe('arcade/games/turtle/turtle.js', () => {
  it('поворот направо меняет направление по часовой стрелке', () => {
    let state = createState({ direction: 'UP' });
    state = update(state, { type: 'ROTATE_RIGHT' });
    expect(state.direction).toBe('RIGHT');
    state = update(state, { type: 'ROTATE_RIGHT' });
    expect(state.direction).toBe('DOWN');
  });

  it('движение вперед оставляет след при опущенном пере', () => {
    let state = createState({ x: 0, y: 0, direction: 'RIGHT', penDown: true });
    state = update(state, { type: 'FORWARD' });
    expect(state.x).toBe(1);
    expect(state.trail).toContainEqual({ x: 0, y: 0 });
  });

  it('черепашка не выходит за границы поля', () => {
    let state = createState({ width: 5, height: 5, x: 0, y: 0, direction: 'LEFT' });
    state = update(state, { type: 'FORWARD' });
    expect(state.x).toBe(0); // осталась у левой границы
  });
});
```

Запусти тесты:

```bash
bun test arcade/games/turtle/
```

---

### Запуск Черепашки и оформление Pull Request 1

**kind:** `text`

Создай файл запуска `arcade/games/turtle/run.js`:

```javascript
import { startEngine } from '../../engine.js';
import { renderGrid } from '../../render/grid.js';
import { turtleInputAdapter } from '../../render/turtle.js';
import { createState, getView, update } from './turtle.js';

startEngine({
  title: 'Черепашка',
  adapter: turtleInputAdapter,
  render: renderGrid,
  createState,
  update,
  getView,
});
```

Запусти и протестируй управление в терминале:

```bash
bun arcade/games/turtle/run.js
```

### Задание на Pull Request 1:
1. Создай ветку: `git checkout -b feature/turtle`.
2. Убедись, что все тесты ядра и Черепашки проходят: `bun test arcade/`.
3. Закоммить изменения и отправь ветку на GitHub: `git push -u origin feature/turtle`.
4. Открой **Pull Request 1** с названием «feat(arcade): Ядро терминального движка и игра Черепашка» и отправь ссылку ментору на проверку.

После аппрува PR 1 переходи к следующему уроку, где ты выберешь свою первую большую пошаговую игру!
