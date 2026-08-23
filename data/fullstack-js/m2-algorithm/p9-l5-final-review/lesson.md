# Финальный прогон проекта 9

**Краткое содержание:**
Финальная проверка всех функций проекта 9: полный прогон тестов, проверка совместимости новых функций объектов с уже существующими функциями строк и массивов. Этот урок — контрольная точка перед отправкой кода на ревью.

### Что проверяем

1. Все 5 функций проекта 9 в папке `objects/`:
   - `keys(obj)` — массив собственных ключей
   - `values(obj)` — массив значений (через композицию с `keys`)
   - `entries(obj)` — массив пар `[ключ, значение]` (через композицию с `keys`)
   - `cloneDeep(value)` — глубокое копирование (рекурсия)
   - `isEqualDeep(a, b)` — глубокое сравнение (рекурсия)

2. У каждой функции:
   - Файл реализации (`.js`)
   - Файл тестов (`.test.js`)
   - JSDoc с параметрами, возвратом, исключениями и особенностями

3. Полный прогон `bun test` — все тесты зелёные, включая старые функции из проектов 1–8

### Проверка JSDoc

Для каждой функции убедись, что JSDoc содержит:
- `@param {type} name — описание` для каждого параметра
- `@returns {type} — описание`
- `@throws {TypeError} — условие` где есть проверка типов
- Особенности: иммутабельность, рекурсия (для `cloneDeep`, `isEqualDeep`), композиция (для `values`, `entries`), использование `hasOwnProperty`

### Проверка совместимости

Новые функции объектов должны корректно работать с функциями из предыдущих проектов:
- `keys`, `values`, `entries` используют `push` из проекта 5
- `cloneDeep` использует `keys`, `len`, `Array.isArray` и рекурсивно вызывает саму себя
- `isEqualDeep` использует `keys`, `len`, `Array.isArray` и рекурсивно вызывает саму себя

### Типичные ошибки

1. **null в cloneDeep:** `typeof null === 'object'`. Без отдельной проверки на `null` функция пытается вызвать `keys(null)` и падает с `TypeError`.
2. **Порядок проверок в isEqualDeep:** `typeof a !== typeof b` должно быть до проверки массив/объект.
3. **hasOwnProperty в isEqualDeep:** без неё `{ x: undefined }` и `{}` могут быть ошибочно признаны равными.
4. **Копирование массивов в cloneDeep:** если использовать `for...in` вместо `for` с индексом, порядок может быть нарушен, плюс `for...in` по массиву перебирает не только элементы.

### Полный список папок и файлов

```
js-algorithms/
├── len.js
├── is-equal.js
├── is-not-equal.js
├── is-more.js
├── is-less.js
├── is-more-or-equal.js
├── is-less-or-equal.js
├── index-of.js
├── includes.js
├── starts-with.js
├── ends-with.js
├── reverse.js             ← строковый reverse
├── repeat.js
├── substring.js
├── slice.js               ← строковый slice
├── trim.js
├── replace.js
├── replace-all.js
├── pad.js
├── upper-case.js
├── lower-case.js
├── arrays/
│   ├── len.js
│   ├── at.js
│   ├── push.js
│   ├── pop.js
│   ├── unshift.js
│   ├── shift.js
│   ├── index-of.js
│   ├── last-index-of.js
│   ├── includes.js
│   ├── fill.js
│   ├── reverse.js         ← массивовый reverse
│   ├── concat.js
│   ├── slice.js           ← массивовый slice
│   ├── join.js
│   ├── splice.js
│   ├── flat.js
│   ├── for-each.js
│   ├── map.js
│   ├── filter.js
│   ├── some.js
│   ├── every.js
│   ├── find.js
│   ├── find-index.js
│   └── reduce.js
└── objects/
    ├── keys.js
    ├── values.js
    ├── entries.js
    ├── clone-deep.js
    └── is-equal-deep.js
```

**Видео:** [Финальный прогон проекта 9.mp4](https://drive.google.com/file/d/placeholder)
