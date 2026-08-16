# Функция map(arr, callback) — трансформация массива

**Краткое содержание:**
`map(arr, callback)` — вызывает callback для каждого элемента и собирает результаты в **новый массив**. Исходный массив не меняется.

### Алгоритм

1. Проверить типы: `arr` — массив, `callback` — функция. Иначе `throw new TypeError`
2. Создать новый пустой массив `result`
3. Пройти циклом по исходному массиву: `for (let i = 0; i < len(arr); i++)`
4. На каждой итерации: `result[i] = callback(arr[i], i, arr)`
5. Вернуть `result`

```javascript
function map(arr, callback) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (typeof callback !== 'function') throw new TypeError('Ожидается функция');
  const result = [];
  for (let i = 0; i < len(arr); i++) {
    result[i] = callback(arr[i], i, arr);
  }
  return result;
}
```

### Отличие map от forEach

`forEach` только перебирает и ничего не возвращает. `map` — **трансформирует**: каждый элемент проходит через callback, и из результатов строится новый массив той же длины.

### Иммутабельность

`map` **не меняет** исходный массив — создаёт и возвращает новый. В JSDoc отметь иммутабельность. В тестах проверь, что исходный массив не изменился после вызова.

**Видео:** [Функция map.mp4](https://drive.google.com/file/d/placeholder)
