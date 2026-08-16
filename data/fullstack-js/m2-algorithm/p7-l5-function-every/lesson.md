# Функция every(arr, callback) — проверка «все»

**Краткое содержание:**
`every(arr, callback)` — проверяет, удовлетворяют ли **все** элементы условию. Возвращает `false` при первом несовпадении и прекращает обход (ранний выход).

### Алгоритм

1. Проверить типы: `arr` — массив, `callback` — функция. Иначе `throw new TypeError`
2. Пройти циклом по массиву: `for (let i = 0; i < len(arr); i++)`
3. Если `callback(arr[i], i, arr) === false` → немедленно вернуть `false` (ранний выход)
4. После цикла (все подошли) → вернуть `true`

```javascript
function every(arr, callback) {
  if (!Array.isArray(arr)) throw new TypeError('Ожидается массив');
  if (typeof callback !== 'function') throw new TypeError('Ожидается функция');
  for (let i = 0; i < len(arr); i++) {
    if (!callback(arr[i], i, arr)) {
      return false;
    }
  }
  return true;
}
```

### Ранний выход every vs some

- `some` выходит при первом `true` (нашёл подходящий — дальше не нужно)
- `every` выходит при первом `false` (нашёл неподходящий — дальше не нужно)

Логическая симметрия: `some` = ∃ (существует), `every` = ∀ (для всех).

### Пустой массив

Для пустого массива `every` возвращает `true` — вакуумная истина: если элементов нет, утверждение «все элементы удовлетворяют условию» формально верно.

**Видео:** [Функция every.mp4](https://drive.google.com/file/d/placeholder)
