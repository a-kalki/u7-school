# Функции values(obj) и entries(obj)

**Краткое содержание:**
Урок посвящён реализации `values(obj)` и `entries(obj)` на основе уже готовой `keys`. Ключевая идея — композиция: не дублируем `for...in`, а переиспользуем `keys`. Это демонстрирует важный принцип DRY (Don't Repeat Yourself).

### 1. Принцип композиции

У нас уже есть `keys(obj)` — она возвращает массив собственных ключей. Имея массив ключей, мы можем получить значения и пары `[ключ, значение]` без повторного `for...in`:

```
keys(obj) → ['name', 'age', 'city']
values(obj) → [obj['name'], obj['age'], obj['city']] → ['Анна', 25, 'Москва']
entries(obj) → [['name', 'Анна'], ['age', 25], ['city', 'Москва']]
```

Это и есть композиция: `values` и `entries` строятся поверх `keys`, а не дублируют её логику.

### 2. values(obj) — массив значений

Алгоритм:
1. Проверить тип аргумента (`typeof obj !== 'object' || obj === null` → `TypeError`)
2. Получить ключи через `keys(obj)`
3. Для каждого ключа взять `obj[ключ]` и добавить в результат через `push`

```javascript
function values(obj) {
  if (typeof obj !== 'object' || obj === null) {
    throw new TypeError('Ожидается объект');
  }

  const result = [];
  const objKeys = keys(obj);
  for (let i = 0; i < len(objKeys); i++) {
    push(result, obj[objKeys[i]]);
  }
  return result;
}
```

Обрати внимание: мы используем наш `len` для подсчёта количества ключей и наш `push` для накопления результата. Вся цепочка построена на собственных функциях.

### 3. entries(obj) — массив пар [ключ, значение]

Алгоритм аналогичен `values`, но каждый элемент результата — массив из двух элементов `[ключ, значение]`:

```javascript
function entries(obj) {
  if (typeof obj !== 'object' || obj === null) {
    throw new TypeError('Ожидается объект');
  }

  const result = [];
  const objKeys = keys(obj);
  for (let i = 0; i < len(objKeys); i++) {
    const key = objKeys[i];
    const pair = [key, obj[key]];
    push(result, pair);
  }
  return result;
}
```

### 4. Почему композиция, а не копирование

Плохой подход — скопировать `for...in` + `hasOwnProperty` в каждую функцию:

```javascript
// ПЛОХО: дублирование кода
function values(obj) {
  const result = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {  // тот же код, что и в keys!
      push(result, obj[key]);
    }
  }
  return result;
}
```

Хороший подход — переиспользовать `keys`:

```javascript
// ХОРОШО: композиция
function values(obj) {
  const objKeys = keys(obj);  // переиспользуем готовое
  const result = [];
  for (let i = 0; i < len(objKeys); i++) {
    push(result, obj[objKeys[i]]);
  }
  return result;
}
```

Преимущества композиции:
- Меньше кода — меньше мест для ошибок
- Если логика `keys` изменится (например, другой порядок) — `values` и `entries` изменятся автоматически
- Легче тестировать и поддерживать

### 5. Граничные случаи

- `values({})` → `[]`
- `entries({})` → `[]`
- `values({ a: 1 })` → `[1]`
- `entries({ a: 1 })` → `[['a', 1]]`
- `values(null)` → `TypeError`
- `entries('строка')` → `TypeError`
- Значения могут быть любого типа: числа, строки, массивы, объекты, `null`, `undefined`

**Видео:** [Функции values и entries.mp4](https://drive.google.com/file/d/placeholder)
