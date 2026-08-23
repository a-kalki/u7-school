# Функция filter(arr, callback) — фильтрация массива

**Краткое содержание:**
`filter(arr, callback)` — вызывает callback для каждого элемента и оставляет только те, для которых callback вернул `true`. Возвращает **новый массив**, исходный не меняет.

### Алгоритм

1. Проверить типы: `arr` — массив, `callback` — функция. Иначе `throw new TypeError`
2. Создать новый пустой массив `result`
3. Пройти циклом по исходному массиву: `for (let i = 0; i < len(arr); i++)`
4. Если `callback(arr[i], i, arr) === true` → добавить `arr[i]` в `result` (через `push` или `result[len(result)] = arr[i]`)
5. Вернуть `result`

```javascript
function filter(arr, callback) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (typeof callback !== 'function') throw new TypeError('Ожидается функция');
  const result = [];
  for (let i = 0; i < len(arr); i++) {
    if (callback(arr[i], i, arr)) {
      // push уже реализован — используй свою функцию из arrays/push.js
      push(result, arr[i]);
    }
  }
  return result;
}
```

### Фильтрация vs трансформация

`map` всегда возвращает массив той же длины — каждый элемент преобразуется. `filter` может вернуть массив **меньшей** длины (или пустой) — элементы, не прошедшие проверку, просто пропускаются.

### Иммутабельность

`filter` **не меняет** исходный массив — создаёт новый из прошедших проверку элементов.

**Видео:** [Функция filter.mp4](https://drive.google.com/file/d/placeholder)
