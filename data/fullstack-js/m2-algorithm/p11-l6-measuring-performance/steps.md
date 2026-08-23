# Шаги урока: Измеряем скорость сортировок и поиска

---

### Зачем измерять и как правильно

**kind:** `text`

Ты реализовал четыре алгоритма, которые делают «одно и то же». Чтобы увидеть разницу в скорости, нужен замер. В JavaScript время замеряют через глобальную `performance.now()` — она возвращает миллисекунды с долями.

Но **один замер — это шум**: на время влияют нагрев движка, сборщик мусора, другие процессы. Поэтому правильный стенд:
1. **прогревает** функцию (первый вызов не замеряем);
2. запускает функцию **несколько раз**;
3. берёт **минимальное** время — оно ближе всего к «чистой» скорости алгоритма.

---

### Скрипт замера: создай файл sorting/sort-benchmark.js

**kind:** `code`

**language:** `javascript`

```javascript
import { len } from '../arrays/len.js';
import { push } from '../arrays/push.js';
import { indexOf } from '../arrays/index-of.js';
import { bubbleSort } from './bubble-sort.js';
import { insertionSort } from './insertion-sort.js';
import { selectionSort } from './selection-sort.js';
import { quickSort } from './quick-sort.js';
import { binarySearch } from './binary-search.js';

const SIZES = [100, 500, 1000, 2000, 4000, 8000];
const RUNS = 5;

function randomArray(size) {
  const arr = [];
  for (let i = 0; i < size; i++) {
    push(arr, Math.floor(Math.random() * size));
  }
  return arr;
}

function measure(fn, input) {
  fn(input); // прогрев — первый вызов не замеряем
  let best = Infinity;
  for (let i = 0; i < RUNS; i++) {
    const start = performance.now();
    fn(input);
    const elapsed = performance.now() - start;
    if (elapsed < best) best = elapsed;
  }
  return best;
}

const algorithms = [
  { name: 'bubbleSort', fn: bubbleSort },
  { name: 'insertionSort', fn: insertionSort },
  { name: 'selectionSort', fn: selectionSort },
  { name: 'quickSort', fn: quickSort },
];

const sizesCount = len(SIZES);
const algorithmsCount = len(algorithms);

for (let s = 0; s < sizesCount; s++) {
  const input = randomArray(SIZES[s]);
  let line = 'n=' + SIZES[s];
  for (let a = 0; a < algorithmsCount; a++) {
    const ms = measure(algorithms[a].fn, input);
    line = line + '  |  ' + algorithms[a].name + ': ' + Math.round(ms * 100) / 100 + 'мс';
  }
  console.log(line);
}

// Поиск: линейный (indexOf) против бинарного (binarySearch)
const searchSize = 1000000;
const sorted = [];
for (let i = 0; i < searchSize; i++) push(sorted, i); // уже отсортированный массив
const target = searchSize - 1; // ищем последний элемент — худший случай для перебора

const linearSearch = (arr) => indexOf(arr, target);
const binarySearchForTarget = (arr) => binarySearch(arr, target);

const linearMs = measure(linearSearch, sorted);
const binaryMs = measure(binarySearchForTarget, sorted);

console.log('--- Поиск в массиве из ' + searchSize + ' элементов (ищем ' + target + ') ---');
console.log('indexOf (перебор): ' + Math.round(linearMs * 100) / 100 + 'мс');
console.log('binarySearch: ' + Math.round(binaryMs * 100) / 100 + 'мс');
```

---

### Разбери, что делает скрипт

**kind:** `text`

Пройдись по коду и ответь себе:

- `randomArray(size)` — за что отвечает? Как `Math.random()` и `Math.floor` дают целое число от 0 до `size`?
- `measure(fn, input)` — почему первый вызов не замеряется? Почему берём минимальное время, а не первое попавшееся?
- Почему `input` не меняется между запусками (и поэтому все алгоритмы получают одинаковые данные)?
- Блок поиска в конце — зачем создаётся `sorted`? Почему ищем именно последний элемент (`searchSize - 1`)? Что делают обёртки `linearSearch` и `binarySearchForTarget`?

> Новые глобальные функции `performance.now()`, `Math.random()` и значение `Infinity` — **разрешённые глобальные** (как `decodeURIComponent` в проекте 10), это не методы массивов/строк/объектов.

---

### Если что-то пойдет не так

**kind:** `text`

Сейчас мы будем запускать наш стенд. На всякий случай обсудим случаи когда что то может пойти не так.

**«Maximum call stack size exceeded» (переполнение стека).**
Причина: `quickSort` на большом **уже отсортированном** массиве — рекурсия уходит на глубину n (опорный элемент — первый).
Что править: в `sort-benchmark.js` — `SIZES = [100, 500, 1000, 2000]` (в эксперименте уже так). Если всё равно падает — уменьши размеры.

**«Cannot find module .../arrays/len.js».**
Причина: неверный путь импорта (скрипт лежит в `sorting/`, а функции массивов — в `arrays/`).
Что править: в начале `sort-benchmark.js` — строки `import { len } from '../arrays/len.js'` и `import { push } from '../arrays/push.js'`. Убедись, что файлы `arrays/len.js` и `arrays/push.js` существуют.

**Скрипт висит дольше минуты.**
Причина: пузырёк/вставки/выбор — медленные на больших массивах.
Что править: в `sort-benchmark.js` — `const SIZES = [...]`, убери большие значения (8000, 4000).

**В выводе одни 0мс.**
Причина: на маленьких размерах время слишком мало, чтобы его заметить.
Что править: увеличь `RUNS` или размеры в `SIZES`.

---

### Запусти стенд

**kind:** `text`

```bash
bun sorting/sort-benchmark.js
```

Запуск может занять 10–15 секунд — это и есть та самая медлительность, которую мы измеряем. Не прерывай его.

---

### Запиши результаты

**kind:** `text`

Сохрани вывод скрипта — он понадобится в финальном уроке. Для наглядности выпиши время каждого алгоритма (в миллисекундах) в таком виде:

• n=100 — bubbleSort: …, insertionSort: …, selectionSort: …, quickSort: …
• n=500 — bubbleSort: …, insertionSort: …, selectionSort: …, quickSort: …
• n=1000 — bubbleSort: …, insertionSort: …, selectionSort: …, quickSort: …
• n=2000 — bubbleSort: …, insertionSort: …, selectionSort: …, quickSort: …
• n=4000 — bubbleSort: …, insertionSort: …, selectionSort: …, quickSort: …
• n=8000 — bubbleSort: …, insertionSort: …, selectionSort: …, quickSort: …

И отдельно запиши строки поиска: сколько времени занял `indexOf` и сколько `binarySearch` на массиве из 1 000 000 элементов.

---

### Эксперимент: отсортированный массив

**kind:** `text`

Поменяй генератор так, чтобы он возвращал уже отсортированный массив (`arr[i] = i` вместо случайных значений), и поставь `SIZES = [100, 500, 1000, 2000]`. Запусти снова.

Ответь на вопросы:
1. Что произошло с `insertionSort` на отсортированном массиве? Почему?
2. Что произошло с `quickSort`? Почему?
3. Как это связано с разбором из урока 4 про выбор опорного элемента?

---

### Вопросы на понимание

**kind:** `text`

**1.** Во сколько раз выросло время `bubbleSort` при переходе от n=2000 к n=4000? А время `quickSort`? Сравни рост.

**2.** Почему на n=100 разница между алгоритмами почти незаметна, а на n=8000 — огромна?

**3.** Почему `Array.prototype.sort` использовать нельзя, а `performance.now()`, `Math.random()` и `Math.floor` — можно?

**4.** Во сколько раз `binarySearch` быстрее `indexOf` на массиве из 1 000 000 элементов? Почему такая разница?

---

### Сохрани изменения

**kind:** `text`

Когда закончишь эксперименты:

```bash
git add sorting/sort-benchmark.js
git commit -m "Добавлен бенчмарк сортировок с замером времени"
```

> Верни `SIZES` к исходным значениям, если менял их, — в финальном уроке снова запустим стенд.
