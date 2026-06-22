# Модули: import и export

## Что такое модуль

Модуль — это отдельный файл с кодом, который может импортировать и экспортировать функции, переменные, классы.

### Зачем нужны модули

- **Разделение кода** на логические части (каждый файл — одна ответственность)
- **Изоляция**: переменные и функции модуля не попадают в глобальную область видимости
- **Переиспользование**: один и тот же модуль можно импортировать в разные части приложения
- **Читаемость**: код разбит на небольшие файлы с понятными названиями

---

## Синтаксис: export

### Named export (именованный экспорт)

Можно экспортировать несколько сущностей из одного модуля.

```javascript
// 📁 math.js

// Экспорт при объявлении
export const PI = 3.14159;

export function sum(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

// Отдельный экспорт (после объявления)
const E = 2.71828;
export { E };
```

### Default export (экспорт по умолчанию)

Каждый модуль может иметь **один** default-экспорт.

```javascript
// 📁 User.js
export default class User {
  constructor(name) {
    this.name = name;
  }
}
```

---

## Синтаксис: import

### Импорт named-экспортов

```javascript
// 📁 main.js
import { sum, multiply, PI } from './math.js';

console.log(sum(2, 3));      // 5
console.log(multiply(2, 3)); // 6
```

### Импорт всего модуля как объекта

```javascript
import * as math from './math.js';

console.log(math.PI);          // 3.14159
console.log(math.sum(2, 3));   // 5
```

### Импорт default-экспорта

```javascript
import User from './User.js';

const user = new User('Алия');
```

### Импорт default + named вместе

```javascript
import User, { sayHi } from './User.js';
```

---

## Реэкспорт (re-export)

Полезно для создания «сборных» модулей (index.js / barrel-файлов).

```javascript
// 📁 lib/index.js
export { sum, multiply } from './math.js';
export { default as User } from './User.js';
```

Теперь можно импортировать всё из одного места:

```javascript
import { sum, User } from './lib/index.js';
```

---

## Особенности работы модулей

### Строгий режим (strict mode)

Модули всегда выполняются в строгом режиме (`"use strict"`). Код внутри модуля автоматически строгий.

### Своя область видимости

Каждая переменная или функция, объявленная на верхнем уровне модуля, не видна снаружи, пока её не экспортировать.

```javascript
// 📁 utils.js
const privateVar = 'секрет';       // не экспортирована — только внутри модуля
export const publicVar = 'доступно'; // экспортирована
```

### Выполняется один раз

Модуль выполняется только при первом импорте. Результат экспорта кешируется, и при повторных импортах используется тот же результат.

```javascript
// 📁 counter.js
export let count = 0;
export function inc() { count++; }

// 📁 a.js
import { count, inc } from './counter.js';
inc();

// 📁 b.js
import { count } from './counter.js';
console.log(count); // 1 — тот же модуль, общее состояние
```

### Асинхронная загрузка (в браузере)

Модули в браузере загружаются асинхронно (если подключены через `<script type="module">`). Не блокируют HTML-парсинг.

```html
<script type="module" src="main.js"></script>
```

---

## Сравнение: named vs default export

| Named export | Default export |
|---|---|
| Несколько на модуль | Один на модуль |
| Имя обязательно | Имя может быть любым при импорте |
| `import { sum }` — фигурные скобки | `import sum` — без скобок |
| Удобно для утилит (math, helpers) | Удобно для главной сущности (класс, компонент) |

---

## Источники на learn.javascript.ru

- [Модули](https://learn.javascript.ru/modules) — введение в модули, зачем они нужны
- [Экспорт и импорт](https://learn.javascript.ru/export-import) — синтаксис, named vs default, реэкспорт
- [Динамические импорты](https://learn.javascript.ru/modules-dynamic-imports) — `import()` как функция
