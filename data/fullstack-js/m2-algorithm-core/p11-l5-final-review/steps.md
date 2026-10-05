# Шаги урока: Финальный прогон проекта 11

---

### Полный прогон тестов

**kind:** `text`

Запусти все тесты — новые функции объектов не должны сломать старые:

```
bun test
```

Все зелёные. Если что-то упало — разберись и исправь **до** продолжения.

Особое внимание:
- `cloneDeep` — не падает на `null`, копирует вложенные структуры
- `isEqualDeep` — различает `{ x: undefined }` и `{}`, верно сравнивает массивы
- `keys`/`values`/`entries` — работают с `push`/`len` из `array-utils/`

---

### Проверка JSDoc

**kind:** `text`

У всех 5 функций проекта 11 проверь JSDoc:

- `@param` для каждого параметра — с типом и описанием
- `@returns` с типом и описанием
- `@throws` там, где есть проверка типов (`TypeError`)
- особенности: иммутабельность, рекурсия (`cloneDeep`, `isEqualDeep`), композиция (`values`, `entries`), `hasOwnProperty`

Пример для `cloneDeep`:

```javascript
/**
 * Создаёт глубокую копию значения.
 * Для примитивов возвращает значение как есть.
 * Для массивов и объектов создаёт новую структуру с рекурсивным копированием элементов.
 *
 * @param {*} value — значение для копирования
 * @returns {*} — глубокая копия, изменение которой не затрагивает оригинал
 */
```

Пропущено что-то — дополни.

---

### Ручная проверка цепочки функций

**kind:** `text`

Проверь, что функции работают вместе. Можно без создания файла — через `bun -e "<код>"` (флаг `-e` выполняет переданную строку; следи за кавычками и путями в `import`).

```javascript
import { keys } from './object-utils/keys';
import { values } from './object-utils/values';
import { cloneDeep } from './object-utils/clone-deep';
import { isEqualDeep } from './object-utils/is-equal-deep';

const obj = { name: 'Анна', scores: [5, 4, 5] };

console.log('keys:', keys(obj));     // ['name', 'scores']
console.log('values:', values(obj)); // ['Анна', [5, 4, 5]]

const copy = cloneDeep(obj);
copy.name = 'Борис';
copy.scores[0] = 3;
console.log('оригинал не изменился:', obj); // { name: 'Анна', scores: [5, 4, 5] }

console.log('isEqualDeep(obj, copy):', isEqualDeep(obj, copy)); // false
console.log('isEqualDeep(obj, cloneDeep(obj)):', isEqualDeep(obj, cloneDeep(obj))); // true
```

---

### Состояние репозитория

**kind:** `text`

`git status` — clean, ты в ветке `feat/object-methods`. `git log --oneline` — осмысленная история коммитов: `keys` → `values`/`entries` → `cloneDeep` → `isEqualDeep`.

Если есть незакоммиченное — закоммить:

```
git add -A
git commit -m "Финальные правки: JSDoc и тесты проекта 11"
```
