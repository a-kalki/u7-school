# Глубокое сравнение: isEqualDeep(a, b)

**Краткое содержание:**
Урок завершает тему глубокой обработки объектов функцией `isEqualDeep` — рекурсивным сравнением двух значений любой структуры. В отличие от `isEqual` из проекта 1 (которая работала только со строками), эта функция сравнивает числа, объекты, массивы и смешанные структуры на всех уровнях вложенности.

### 1. Отличие от isEqual

`isEqual(a, b)` из проекта 1 сравнивает только строки посимвольно. `isEqualDeep(a, b)` должна сравнивать **любые** значения:

| isEqual (проект 1) | isEqualDeep (проект 9) |
|---------------------|------------------------|
| Только строки | Любые типы |
| Посимвольное сравнение | Рекурсивное структурное сравнение |
| Разные длины → false | Разные типы → false |
| TypeError на не-строках | Работает со всем |

### 2. Алгоритм isEqualDeep

Функция принимает два значения и возвращает `true`, если они структурно идентичны:

1. **Примитивы** — сравнить через `===`. Числа, строки, булевы, `null`, `undefined`.
2. **Разные типы** — если один аргумент массив, а другой объект (или наоборот) → `false`.
3. **Массивы** — сравнить длину через `len`, затем рекурсивно сравнить каждый элемент.
4. **Объекты** — сравнить наборы ключей через `keys`, затем рекурсивно сравнить каждое значение.

```javascript
function isEqualDeep(a, b) {
  // 1. Строгое равенство для примитивов и одинаковых ссылок
  if (a === b) return true;

  // 2. Если типы разные — точно не равны
  if (typeof a !== typeof b) return false;

  // 3. null и примитивы уже обработаны (a === b для примитивов)
  if (a === null || b === null) return false; // одно null, другое нет
  if (typeof a !== 'object') return false;     // разные примитивы

  // 4. Один массив, другой — объект
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // 5. Оба — массивы
  if (Array.isArray(a)) {
    if (len(a) !== len(b)) return false;
    for (let i = 0; i < len(a); i++) {
      if (!isEqualDeep(a[i], b[i])) return false;
    }
    return true;
  }

  // 6. Оба — объекты
  const keysA = keys(a);
  const keysB = keys(b);
  if (len(keysA) !== len(keysB)) return false;

  for (let i = 0; i < len(keysA); i++) {
    const key = keysA[i];
    // Проверяем, что ключ есть в b (не унаследованный, а собственный)
    if (!b.hasOwnProperty(key)) return false;
    if (!isEqualDeep(a[key], b[key])) return false;
  }
  return true;
}
```

### 3. Почему hasOwnProperty в сравнении объектов

При сравнении объектов мы проверяем `b.hasOwnProperty(key)`, а не просто `b[key] !== undefined`. Причина: значение может быть `undefined` и при этом быть собственным свойством:

```javascript
const a = { x: undefined };
const b = {};

// Без hasOwnProperty:
// a имеет ключ 'x' со значением undefined
// b['x'] === undefined → true, и мы можем ошибочно посчитать их равными
// или рекурсивно сравнить undefined с undefined — получим true
// но a и b структурно разные!

isEqualDeep({ x: undefined }, {}); // должно быть false
```

### 4. Граничные случаи

- `isEqualDeep(1, 1)` → `true`
- `isEqualDeep(1, '1')` → `false` (разные типы)
- `isEqualDeep(null, null)` → `true`
- `isEqualDeep(null, undefined)` → `false`
- `isEqualDeep([1, 2], [1, 2])` → `true`
- `isEqualDeep([1, 2], [1, 2, 3])` → `false` (разная длина)
- `isEqualDeep({ a: 1 }, { a: 1 })` → `true`
- `isEqualDeep({ a: 1 }, { a: 2 })` → `false`
- `isEqualDeep({ a: { b: 1 } }, { a: { b: 1 } })` → `true` (глубокая проверка)
- `isEqualDeep({ a: 1 }, { a: 1, b: 2 })` → `false` (разное количество ключей)
- `isEqualDeep([], {})` → `false` (массив vs объект)

**Видео:** [Глубокое сравнение isEqualDeep.mp4](https://drive.google.com/file/d/placeholder)
