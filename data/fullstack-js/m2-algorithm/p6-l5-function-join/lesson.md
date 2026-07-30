# Функция join(arr, separator) — склеивание массива в строку

**Краткое содержание:**
`join(arr, separator)` преобразует массив в строку, вставляя разделитель между элементами. Первая функция проекта, которая превращает массив в строку. Иммутабельная — исходный массив не меняется.

### Алгоритм

1. Проверить типы: `arr` — массив. Иначе `throw new TypeError`
2. Если `separator` не передан — использовать `','`
3. Если массив пуст — вернуть `''`
4. Начать с первого элемента: `result = '' + arr[0]` (преобразовать в строку)
5. Цикл от `1` до `len(arr)`: `result += separator + arr[i]`
6. Вернуть `result`

```javascript
function join(arr, separator) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (separator === undefined) separator = ',';

  const length = len(arr);
  if (length === 0) return '';

  let result = '';
  for (let i = 0; i < length; i++) {
    if (i > 0) result += separator;
    result += arr[i];
  }
  return result;
}
```

### Почему разделитель — запятая по умолчанию

Стандартный `Array.prototype.join` использует запятую по умолчанию. Это удобно для логирования и быстрого просмотра содержимого массива.

### Преобразование элементов в строку

При склеивании элементы автоматически преобразуются в строку через конкатенацию (`result += arr[i]`). `null` и `undefined` в JS при конкатенации со строкой становятся строками `'null'` и `'undefined'`.

### Иммутабельность

`join` не меняет массив — только читает его и создаёт строку.

**Видео:** [p6-l5. Функция join.mp4](https://drive.google.com/file/d/placeholder)
