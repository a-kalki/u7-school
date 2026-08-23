# Функция forEach(arr, callback) — перебор массива

**Краткое содержание:**
Первая функция проекта 7. `forEach(arr, callback)` — перебирает массив и вызывает callback для каждого элемента. Callback уже знаком из модуля 1, здесь мы применяем его для работы с массивами.

### Алгоритм

1. Проверить типы: `arr` — массив, `callback` — функция. Иначе `throw new TypeError`
2. Пройти циклом по массиву: `for (let i = 0; i < len(arr); i++)`
3. На каждой итерации вызвать `callback(arr[i], i, arr)`
4. Ничего не возвращать (`undefined`)

```javascript
function forEach(arr, callback) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (typeof callback !== 'function') throw new TypeError('Ожидается функция');
  for (let i = 0; i < len(arr); i++) {
    callback(arr[i], i, arr);
  }
}
```

### Callback-аргументы

Callback получает три аргумента в порядке:
1. **элемент** — текущий элемент массива
2. **индекс** — позиция элемента
3. **массив** — ссылка на исходный массив

Это стандартный контракт для всех итеративных методов.

### Иммутабельность

`forEach` **не меняет** исходный массив и ничего не возвращает. Это «чистый» перебор — все изменения данных происходят внутри callback.

**Видео:** [Функция forEach.mp4](https://drive.google.com/file/d/placeholder)
