# Функция slice(arr, start, end) — копирование подмассива

**Краткое содержание:**
`slice(arr, start, end)` возвращает новый массив из элементов от `start` до `end` (не включая `end`). Иммутабельная — исходный массив не меняется. Поддерживает отрицательные индексы.

### Алгоритм

1. Проверить типы: `arr` — массив, `start` и `end` (если переданы) — числа. Иначе `throw new TypeError`
2. Если `end` не передан — установить `end = len(arr)`
3. Нормализовать `start`: если отрицательный → `len(arr) + start`. Если всё ещё < 0 → 0. Если > `len(arr)` → `len(arr)`
4. Нормализовать `end`: если отрицательный → `len(arr) + end`. Если > `len(arr)` → `len(arr)`. Если < 0 → 0
5. Если `start >= end` после нормализации — вернуть пустой массив `[]`
6. Создать новый массив `result = []`
7. Скопировать элементы от `start` до `end` (не включая): `result[i - start] = arr[i]`
8. Вернуть `result`

```javascript
function slice(arr, start, end) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (start !== undefined && typeof start !== 'number') throw new TypeError('start должен быть числом');
  if (end !== undefined && typeof end !== 'number') throw new TypeError('end должен быть числом');

  if (end === undefined) end = len(arr);

  if (start < 0) start = len(arr) + start;
  if (start < 0) start = 0;
  if (start > len(arr)) start = len(arr);

  if (end < 0) end = len(arr) + end;
  if (end > len(arr)) end = len(arr);
  if (end < 0) end = 0;

  if (start >= end) return [];

  const result = [];
  for (let i = start; i < end; i++) {
    result[i - start] = arr[i];
  }
  return result;
}
```

### Отличие от строкового slice

В проекте 4 мы реализовали `slice(str, start, end)` для строк — логика нормализации индексов та же, но результат — новая строка. Здесь `slice` для массивов создаёт новый массив.

### Связь с concat

`slice` и `concat` — две иммутабельные функции для создания новых массивов. `concat` объединяет два массива, `slice` копирует часть одного.

**Видео:** [Функция slice массива.mp4](https://drive.google.com/file/d/placeholder)
