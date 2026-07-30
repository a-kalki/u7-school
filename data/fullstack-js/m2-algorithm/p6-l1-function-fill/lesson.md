# Функция fill(arr, value, start, end) — заполнение массива

**Краткое содержание:**
Первая функция проекта 6. `fill(arr, value, start, end)` заполняет массив (или его часть) указанным значением. Мутабельная — меняет массив на месте и возвращает его же.

### Алгоритм

1. Проверить типы: `arr` — массив, `value` — любое. Иначе `throw new TypeError`
2. Если `start` не передан — установить `start = 0`
3. Если `end` не передан — установить `end = len(arr)`
4. Нормализовать `start`: если отрицательный → `len(arr) + start`. Если всё ещё < 0 → 0. Если > `len(arr)` → `len(arr)`
5. Нормализовать `end`: если отрицательный → `len(arr) + end`. Если > `len(arr)` → `len(arr)`. Если < 0 → 0
6. Если `start >= end` после нормализации — вернуть `arr` без изменений
7. Цикл от `start` до `end` (не включая): `arr[i] = value`
8. Вернуть `arr`

```javascript
function fill(arr, value, start = 0, end = len(arr)) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  // нормализация start
  if (start < 0) start = len(arr) + start;
  if (start < 0) start = 0;
  if (start > len(arr)) start = len(arr);
  // нормализация end
  if (end < 0) end = len(arr) + end;
  if (end > len(arr)) end = len(arr);
  if (end < 0) end = 0;
  // заполнение
  for (let i = start; i < end; i++) {
    arr[i] = value;
  }
  return arr;
}
```

### Мутабельность

`fill` **меняет** исходный массив на месте и возвращает его же (не копию). Это удобно для цепочек, но требует осторожности в тестах. В JSDoc отметь мутабельность.

### Отличие fill от ручного заполнения

Без `fill` чтобы заполнить массив, нужно писать цикл вручную. `fill` делает это одной строкой и поддерживает частичное заполнение (от `start` до `end`).

**Видео:** [p6-l1. Функция fill.mp4](https://drive.google.com/file/d/placeholder)
