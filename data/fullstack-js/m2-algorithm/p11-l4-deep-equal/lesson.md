# Глубокое сравнение: isEqualDeep(a, b)

**Краткое содержание:**
Урок завершает тему глубокой обработки объектов функцией `isEqualDeep` — рекурсивным сравнением двух значений любой структуры. В отличие от `isEqual` из проекта 3 (только строки), эта функция сравнивает числа, объекты, массивы и смешанные структуры на всех уровнях вложенности.

**Время:** ~22 мин

**Основные темы:**
- Реализация isEqualDeep()
- Вопросы на понимание
- Сохрани изменения

**Термины:**
структурное равенство — совпадение значений на всех уровнях вложенности, а не ссылок

### Источники

- [Глубокое сравнение isEqualDeep.mp4](https://drive.google.com/file/d/placeholder)

### Алгоритм

1. `a === b` → `true` (примитивы и одинаковые ссылки)
2. Разные `typeof` → `false`
3. `null` или примитив → `false` (разные значения)
4. Один массив, другой объект → `false`
5. Оба массива: сравнить `len`, затем рекурсивно каждый элемент
6. Оба объекта: сравнить наборы `keys`, затем рекурсивно каждое значение (с проверкой `b.hasOwnProperty(key)`)

```javascript
function isEqualDeep(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (len(a) !== len(b)) return false;
    for (let i = 0; i < len(a); i++) {
      if (!isEqualDeep(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = keys(a);
  const keysB = keys(b);
  if (len(keysA) !== len(keysB)) return false;

  for (let i = 0; i < len(keysA); i++) {
    const key = keysA[i];
    if (!b.hasOwnProperty(key)) return false;
    if (!isEqualDeep(a[key], b[key])) return false;
  }
  return true;
}
```

### hasOwnProperty в сравнении объектов

Проверяем `b.hasOwnProperty(key)`, а не `b[key] !== undefined`. Иначе `{ x: undefined }` и `{}` можно ошибочно счесть равными: у обоих `obj.x === undefined`, но ключ `x` есть только у первого.

**Видео:** [Глубокое сравнение isEqualDeep.mp4](https://drive.google.com/file/d/placeholder)
