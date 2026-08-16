# Финальный PR и полный прогон модуля

**Краткое содержание:**
Завершающий урок модуля 2. Студент запускает полный прогон всех ~55 функций, проверяет JSDoc, пушит последнюю ветку и создаёт финальный PR. Это кульминация почти двух месяцев алгоритмической работы.

### Что проверяем перед пушем

1. Все 5 бизнес-утилит в папке `utils/`:
   - `getQueryParams(url)` — разбор query-строки
   - `parseUrl(url)` — разбор URL на компоненты
   - `toCSV(data)` — массив объектов → CSV
   - `fromCSV(csvString)` — CSV → массив объектов
   - `groupBy(array, key)` — группировка по ключу

2. У каждой функции — файл реализации (`.js`), файл тестов (`.test.js`), JSDoc.

3. Полный прогон `bun test` — все тесты от проекта 1 до проекта 10 зелёные.

4. `git status` — clean, `git log --oneline` — осмысленная история коммитов.

### Ветка и функции

- **Ветка:** `feat/business-utils`
- **5 функций** в папке `utils/`:

| Функция | Описание | Использует |
|---------|----------|-----------|
| `getQueryParams` | Разбор query-строки URL | `indexOf`, `slice`, `len`, `decodeURIComponent` |
| `parseUrl` | Разбор URL на 6 компонентов | `indexOf`, `slice`, `len` |
| `toCSV` | Массив объектов → CSV | `keys`, `len` |
| `fromCSV` | CSV → массив объектов | `len`, `push` (конечный автомат) |
| `groupBy` | Группировка по ключу | `len`, `push`, `hasOwnProperty` |

### Полная структура репозитория

```
js-algorithms/
├── len.js                    # строковый len
├── is-equal.js
├── is-not-equal.js
├── is-more.js
├── is-less.js
├── is-more-or-equal.js
├── is-less-or-equal.js
├── index-of.js               # строковый indexOf
├── includes.js               # строковый includes
├── starts-with.js
├── ends-with.js
├── reverse.js                # строковый reverse
├── repeat.js
├── substring.js
├── slice.js                  # строковый slice
├── trim.js
├── replace.js
├── replace-all.js
├── pad.js
├── upper-case.js
├── lower-case.js
├── arrays/
│   ├── len.js                # массивовый len
│   ├── at.js
│   ├── push.js
│   ├── pop.js
│   ├── unshift.js
│   ├── shift.js
│   ├── index-of.js           # массивовый indexOf
│   ├── last-index-of.js
│   ├── includes.js           # массивовый includes
│   ├── fill.js
│   ├── reverse.js            # массивовый reverse
│   ├── concat.js
│   ├── slice.js              # массивовый slice
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
├── objects/
│   ├── keys.js
│   ├── values.js
│   ├── entries.js
│   ├── clone-deep.js
│   └── is-equal-deep.js
└── utils/
    ├── get-query-params.js
    ├── parse-url.js
    ├── to-csv.js
    ├── from-csv.js
    └── group-by.js
```

### Пуш и PR

```bash
git push -u origin feat/business-utils
```

Заголовок PR: **Проект 10: Бизнес-утилиты — query, URL, CSV, группировка**

### На что обратить внимание ревьюерам

1. **fromCSV** — конечный автомат с флагом `inQuotes`, самая сложная функция
2. **toCSV/fromCSV round-trip** — взаимная обратимость
3. **getQueryParams** — использует `decodeURIComponent` (разрешённую глобальную функцию)
4. **parseUrl** — важен порядок разбора от внешних разделителей к внутренним
5. **groupBy** — объекты в группах не клонируются (те же ссылки)

### Что дальше

Проект 10 завершён. Всего реализовано ~55 функций. Впереди **проект 11** — «Сложность алгоритмов и структуры данных»: аналитический проект, в котором ты оценишь эффективность своего кода и узнаешь, какие структуры данных стоят за привычными операциями.

**Видео:** [Финальный прогон и PR проекта 10.mp4](https://drive.google.com/file/d/placeholder)
