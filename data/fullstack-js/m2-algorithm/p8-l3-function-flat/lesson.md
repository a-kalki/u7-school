# Функция flat(arr, depth) — разглаживание вложенных массивов

**Краткое содержание:**
`flat` «разглаживает» вложенные массивы до указанной глубины. Её можно реализовать двумя способами — через классическую рекурсию или через `reduce`. Оба подхода правильные, выбирай тот, который понятнее.

### Вариант 1: через рекурсию

1. Проверить тип: `arr` — массив. Иначе `throw new TypeError`
2. Создать пустой массив `result`
3. Пройти циклом по исходному массиву
4. Для каждого элемента:
   - Если элемент — **массив** и `depth > 0` → рекурсивно вызвать `flat(элемент, depth - 1)` и добавить все результаты в `result`
   - Иначе → добавить элемент в `result`
5. Вернуть `result`

```javascript
function flat(arr, depth) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (depth === undefined) depth = 1;
  const result = [];
  for (let i = 0; i < len(arr); i++) {
    if (Array.isArray(arr[i]) && depth > 0) {
      const flattened = flat(arr[i], depth - 1);
      for (let j = 0; j < len(flattened); j++) {
        push(result, flattened[j]);
      }
    } else {
      push(result, arr[i]);
    }
  }
  return result;
}
```

### Вариант 2: через reduce

`flat` можно выразить через `reduce` — это показывает связь между рекурсией и свёрткой:

```javascript
function flat(arr, depth) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (depth === undefined) depth = 1;
  return reduce(arr, (acc, item) => {
    if (Array.isArray(item) && depth > 0) {
      const flattened = flat(item, depth - 1);
      for (let i = 0; i < len(flattened); i++) {
        push(acc, flattened[i]);
      }
    } else {
      push(acc, item);
    }
    return acc;
  }, []);
}
```

**Выбирай любой подход** — оба используют рекурсию и дают одинаковый результат. Вариант с `reduce` более декларативный (описывает **что** сделать), вариант с прямым циклом — более императивный (описывает **как**).

### Рекурсия: база и шаг

- **База рекурсии:** элемент не массив (`!Array.isArray(item)`) **или** `depth === 0` — просто кладём элемент в результат.
- **Шаг рекурсии:** элемент — массив и `depth > 0` → вызываем `flat(item, depth - 1)`.

### Параметр depth

- `depth = 1` (по умолчанию): разгладить один уровень вложенности
- `depth = 2`: разгладить два уровня
- `depth = Infinity`: разгладить полностью, до плоского массива

### Иммутабельность

`flat` **не меняет** исходный массив — создаёт и возвращает новый. В JSDoc отметь иммутабельность.

**Видео:** [p8-l3. Функция flat.mp4](https://drive.google.com/file/d/placeholder)
