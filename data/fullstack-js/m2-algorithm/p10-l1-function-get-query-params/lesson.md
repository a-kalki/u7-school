# Функция getQueryParams(url)

**Краткое содержание:**
Первая бизнес-утилита — разбор query-строки URL. Студент применяет `indexOf`, `slice`, `push`, `split`-подобную логику и обработку URL-кодирования для преобразования строки параметров в объект.

### 1. Что такое query-строка

Query-строка — это часть URL после знака `?`, содержащая параметры в формате `ключ=значение`, разделённые `&`:

```
https://example.com/search?q=javascript&page=2&sort=asc
                              ^^^^^^^^^^^^^^^^^^^^^^^^
                              query-строка
```

Параметры: `q=javascript`, `page=2`, `sort=asc`.

### 2. Алгоритм getQueryParams

Функция принимает полный URL (строку) и возвращает объект с параметрами:

1. Найти позицию `?` через `indexOf`. Если `?` нет — вернуть `{}`.
2. Взять подстроку после `?`.
3. Разбить её по `&` — найти позиции разделителей и нарезать подстроки.
4. Каждую подстроку разбить по `=` на ключ и значение.
5. Декодировать URL-кодирование для ключа и значения.
6. Собрать результат в объект.

```javascript
function getQueryParams(url) {
  if (typeof url !== 'string') throw new TypeError('Ожидается строка');

  const result = {};

  // 1. Ищем '?'
  const qPos = indexOf(url, '?');
  if (qPos === -1) return result;

  // 2. Берём строку после '?'
  let query = slice(url, qPos + 1, len(url));

  // 3. Разбираем параметры
  while (len(query) > 0) {
    // Ищем '&'
    const ampPos = indexOf(query, '&');
    let pair;
    if (ampPos === -1) {
      pair = query;
      query = '';
    } else {
      pair = slice(query, 0, ampPos);
      query = slice(query, ampPos + 1, len(query));
    }

    // 4. Разбиваем пару по '='
    const eqPos = indexOf(pair, '=');
    let key, value;
    if (eqPos === -1) {
      key = pair;
      value = '';
    } else {
      key = slice(pair, 0, eqPos);
      value = slice(pair, eqPos + 1, len(pair));
    }

    // 5. Декодируем URL-кодирование
    result[decodeURI(key)] = decodeURI(value);
  }

  return result;
}
```

### 3. URL-кодирование (percent-encoding)

Некоторые символы в URL кодируются: пробел → `%20`, кириллица → `%D0%9F` и т.д. Для декодирования используем встроенную `decodeURIComponent` — она **разрешена**, так как не является методом строк/массивов/объектов (это глобальная функция).

Однако, если хочешь реализовать своё декодирование — алгоритм:
1. Найти `%` в строке
2. Взять два следующих символа
3. Преобразовать из шестнадцатеричной системы в десятичную
4. Получить символ по коду через `String.fromCodePoint`

### 4. Граничные случаи

- `getQueryParams('https://example.com')` → `{}`
- `getQueryParams('https://example.com?')` → `{}`
- `getQueryParams('https://example.com?a=1')` → `{ a: '1' }`
- `getQueryParams('https://example.com?a=1&b=2')` → `{ a: '1', b: '2' }`
- `getQueryParams('https://example.com?a=1&a=2')` → `{ a: '2' }` (последнее значение перезаписывает)
- `getQueryParams('https://example.com?name=%D0%90%D0%BD%D0%BD%D0%B0')` → `{ name: 'Анна' }`
- `getQueryParams('https://example.com?key')` → `{ key: '' }` (ключ без значения)
- `getQueryParams(123)` → `TypeError`

### 5. Какие свои функции используем

- `len` — длина строки
- `indexOf` — поиск символов `?`, `&`, `=`
- `slice` — извлечение подстрок
- `push` — не используется напрямую, но результат собирается в объект через `result[key] = value`

**Видео:** [p10-l1. Функция getQueryParams.mp4](https://drive.google.com/file/d/placeholder)
