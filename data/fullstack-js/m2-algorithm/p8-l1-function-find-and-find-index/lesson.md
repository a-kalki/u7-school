# Функции find(arr, callback) и findIndex(arr, callback) — поиск в массиве

**Краткое содержание:**
Первые две функции проекта 8. `find` ищет первый элемент, удовлетворяющий условию callback, и возвращает его (или `undefined`). `findIndex` делает то же самое, но возвращает индекс (или `-1`). Обе используют ранний выход — обход останавливается при первом `true`.

### find(arr, callback)

1. Проверить типы: `arr` — массив, `callback` — функция. Иначе `throw new TypeError`
2. Пройти циклом по массиву: `for (let i = 0; i < len(arr); i++)`
3. На каждой итерации вызвать `callback(arr[i], i, arr)`. Если вернул `true` — сразу вернуть `arr[i]`
4. Если цикл завершился — вернуть `undefined`

```javascript
function find(arr, callback) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (typeof callback !== 'function') throw new TypeError('Ожидается функция');
  for (let i = 0; i < len(arr); i++) {
    if (callback(arr[i], i, arr)) return arr[i];
  }
  return undefined;
}
```

### findIndex(arr, callback)

Алгоритм полностью аналогичен `find`, но возвращает **индекс** вместо элемента:

1. Те же проверки типов
2. Тот же цикл с ранним выходом
3. Если `callback(...)` → `true` — вернуть `i`
4. Если не найдено — вернуть `-1`

```javascript
function findIndex(arr, callback) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (typeof callback !== 'function') throw new TypeError('Ожидается функция');
  for (let i = 0; i < len(arr); i++) {
    if (callback(arr[i], i, arr)) return i;
  }
  return -1;
}
```

### Ранний выход

В отличие от `forEach` и `map`, которые обходят все элементы, `find` и `findIndex` останавливаются при первом совпадении. Это роднит их с `some`, который тоже использует ранний выход. Но `some` возвращает `boolean`, а `find`/`findIndex` — сам элемент или его индекс.

### Возвращаемые значения и граничные случаи

- `find` при отсутствии совпадения возвращает `undefined`. В тестах используй `toBeUndefined()`, а не `toBe(undefined)` — это точнее.
- `findIndex` при отсутствии возвращает `-1`.
- Для пустого массива: `find` → `undefined`, `findIndex` → `-1`.

### Иммутабельность

Обе функции **не меняют** исходный массив. В JSDoc отметь иммутабельность и ранний выход.

**Видео:** [Функции find и findIndex.mp4](https://drive.google.com/file/d/placeholder)
