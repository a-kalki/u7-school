# Функция reduce(arr, callback, initialValue) — свёртка массива

**Краткое содержание:**
`reduce` — самая мощная из итеративных функций. Она «сворачивает» массив в одно значение, проходя по элементам и накапливая результат в аккумуляторе. В отличие от `map` (всегда возвращает массив) и `filter` (всегда возвращает подмножество), `reduce` может вернуть что угодно: число, строку, объект, массив.

### Алгоритм

1. Проверить типы: `arr` — массив, `callback` — функция. Иначе `throw new TypeError`
2. Определить начальное состояние аккумулятора и стартовый индекс:
   - Если `initialValue` передан (`arguments.length >= 3`) → `accumulator = initialValue`, `startIndex = 0`
   - Если `initialValue` не передан → `accumulator = arr[0]`, `startIndex = 1`
3. Если массив пуст и `initialValue` не передан → `throw new TypeError('Reduce of empty array with no initial value')`
4. Пройти циклом от `startIndex` до `len(arr)`: на каждой итерации `accumulator = callback(accumulator, arr[i], i, arr)`
5. Вернуть `accumulator`

```javascript
function reduce(arr, callback, initialValue) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (typeof callback !== 'function') throw new TypeError('Ожидается функция');

  const hasInitial = arguments.length >= 3;
  const length = len(arr);

  if (length === 0 && !hasInitial) {
    throw new TypeError('Reduce of empty array with no initial value');
  }

  let accumulator = hasInitial ? initialValue : arr[0];
  const startIndex = hasInitial ? 0 : 1;

  for (let i = startIndex; i < length; i++) {
    accumulator = callback(accumulator, arr[i], i, arr);
  }

  return accumulator;
}
```

### Два режима работы

| | С initialValue | Без initialValue |
|---|---|---|
| accumulator | `initialValue` | `arr[0]` |
| Обход начинается с | индекса `0` | индекса `1` |
| Пустой массив | → `initialValue` | → `TypeError` |

### Примеры использования

Сумма чисел:
```js
reduce([1, 2, 3], (acc, x) => acc + x, 0); // → 6
```

Конкатенация строк:
```js
reduce(['a', 'b', 'c'], (acc, s) => acc + s, ''); // → 'abc'
```

Поиск максимума (без initialValue):
```js
reduce([3, 7, 2, 9], (acc, x) => x > acc ? x : acc); // → 9
```

Группировка по ключу (возвращает объект):
```js
reduce([{k: 'a', v: 1}, {k: 'b', v: 2}, {k: 'a', v: 3}], (acc, item) => {
  if (acc[item.k] === undefined) acc[item.k] = [];
  push(acc[item.k], item.v);
  return acc;
}, {}); // → { a: [1, 3], b: [2] }
```

### Мутабельность аккумулятора

`reduce` **не меняет** исходный массив, но аккумулятор может мутировать внутри callback (как в примере с группировкой — мы мутируем `acc` через `push`). Это нормально: аккумулятор — это рабочая структура, которую мы строим. В JSDoc отметь иммутабельность исходного массива.

**Видео:** [Функция reduce.mp4](https://drive.google.com/file/d/placeholder)
