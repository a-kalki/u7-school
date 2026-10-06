# Шаги урока: Финал проекта: прогон, PR и код-ревью

---

### Бизнес-сценарий: утилиты в связке

**kind:** `text`

Пришло время почувствовать настоящую инженерную силу! Все утилиты, которые ты реализовал, объединяются в законченный сценарий обработки заказов интернет-магазина.

Создай файл `business-utils/scenario.js` (или запусти через `bun`):

```javascript
import { getQueryParams } from './get-query-params.js';
import { parseUrl } from './parse-url.js';
import { groupBy } from './group-by.js';
import { toCSV } from './to-csv.js';
import { fromCSV } from './from-csv.js';

// 1. Пришёл входящий URL запроса от фронтенда
const requestUrl = 'https://store.example.com/api/orders?status=all&priority=high';

// 2. Разбираем URL и параметры
const urlParts = parseUrl(requestUrl);
const params = getQueryParams(requestUrl);
console.log('Запрос к сервису:', urlParts.host, urlParts.path);
console.log('Параметры фильтрации:', params);

// 3. Данные заказов из базы (обрати внимание на типы, 0 и многострочный отзыв!)
const orders = [
  { id: 101, customer: 'Иван', amount: 3500, isPaid: true, status: 'completed', review: 'Отличный сервис!\nКурьеру спасибо.' },
  { id: 102, customer: 'Ольга', amount: 0, isPaid: false, status: 'pending', review: 'Жду подтверждения' },
  { id: 103, customer: 'Анна', amount: 7200, isPaid: true, status: 'completed', review: 'Всё в срок' },
  { id: 104, customer: 'Денис', amount: 1500, isPaid: false, status: 'canceled', review: 'Передумал.\nПрошу вернуть средства.' },
];

// 4. Группируем заказы по статусу через groupBy
const groups = groupBy(orders, 'status');
console.log('Статусы в обработке:', Object.keys(groups));

// 5. Сериализуем группу completed в текст нашего формата
const csv = toCSV(groups.completed);
console.log('--- Текст нашего формата ---');
console.log(csv);
// Ровно 3 строки: 1 строка заголовков + 2 заказа! Заказ Ивана не порвал таблицу.

// 6. Читаем отчёт обратно через fromCSV
const restored = fromCSV(csv);
console.log('Восстановлено заказов:', restored.length);
console.log('Отзыв Ивана в памяти:', JSON.stringify(restored[0].review));
// В памяти снова реальный перенос строки: 'Отличный сервис!\nКурьеру спасибо.'!

console.log('Данные совпадают после round-trip:', JSON.stringify(restored) === JSON.stringify(groups.completed));

console.log('Сценарий успешно выполнен! Все утилиты работают как часы.');
```

Запусти сценарий:
```bash
bun business-utils/scenario.js
```

Посмотри, как органично они работают вместе: парсинг URL → группировка → сериализация → десериализация с восстановлением всех типов и переносов строк.

Удали `business-utils/scenario.js` после проверки или добавь как демонстрационный пример.

---

### Полный прогон всех тестов

**kind:** `text`

Запусти все тесты своего репозитория:

```
bun test
```

Все зелёные. Если что-то упало — разберись и исправь **до** продолжения.

Особое внимание:
- `fromCSV` — round-trip с `toCSV`
- `getQueryParams` — декодирование URL-кодирования
- `parseUrl` — корректный порядок разбора компонентов
- `groupBy` — группировка по ключу и сохранение ссылок на объекты

---

### Проверка JSDoc на всех функциях проекта

**kind:** `text`

Проверь JSDoc у всех бизнес-утилит проекта:

- `getQueryParams`: `@param {string} url`, `@returns {object}`, использование `decodeURIComponent`
- `parseUrl`: `@param {string} url`, `@returns {object}` с перечислением всех полей (protocol, host, port, path, query, hash)
- `groupBy`: `@param {array} array`, `@param {string} key`, `@returns {object}`, что объекты в группах не клонируются
- `toCSV`: `@param {Array<object>} data`, `@returns {string}`, правила экранирования
- `fromCSV`: `@param {string} csvString`, `@returns {Array<object>}`, round-trip совместимость с `toCSV`, конечный автомат

Пропущено что-то — дополни.

---

### Состояние репозитория и пуш ветки

**kind:** `text`

`git status` — clean. `git log --oneline` — история отражает порядок реализации: `getQueryParams` → `parseUrl` → `groupBy` → `toCSV` → `fromCSV`.

Если есть незакоммиченное — закоммить:

```
git add -A
git commit -m "Финальные правки: JSDoc и тесты проекта"
```

Затем пуш:

```
git push -u origin feat/business-utils
```

---

### Создание PR по шаблону

**kind:** `text`

Создай PR: base `main` ← compare `feat/business-utils`.

**Заголовок:**
```
Проект «Бизнес-утилиты»: query, URL, группировка, CSV
```

**Описание — заполни по шаблону:**

```markdown
## Что сделано

Реализованы бизнес-утилиты (папка business-utils/):

- getQueryParams(url) — разбор query-строки URL в объект; URL-кодирование через decodeURIComponent
- parseUrl(url) — разбор URL на 6 компонентов: protocol, host, port, path, query, hash
- groupBy(array, key) — группировка массива объектов по значению ключа
- toCSV(data) — массив объектов → строка нашего формата с экранированием
- fromCSV(csvString) — строка нашего формата → массив объектов, конечный автомат с флагом inString

## Особенности реализации

- Все функции иммутабельные — исходные данные не меняются
- fromCSV и toCSV взаимно обратимы (round-trip)
- fromCSV читает и LF, и CRLF (пропускает \r вне строки)
- parseUrl разбирает URL от внешних разделителей к внутренним
- groupBy использует hasOwnProperty; объекты в группах — те же ссылки
- Используются только свои функции (indexOf, slice, len, keys, push)
  и разрешённые глобальные (decodeURIComponent, String)

## Как запустить тесты

bun test
```

Что важно для ревьюеров, может быть не очевидно — обязательно указывай. Если считаешь, что команда «в теме», часть разделов можно сократить.

---

### Сообщение в чат

**kind:** `text`

Выложи сообщение в общий чат:

```
🔍 PR на ревью: [Проект «Бизнес-утилиты»: query, URL, группировка, CSV]
📎 Ссылка: https://github.com/твой-username/js-algorithms/pull/N
📋 Нужно 2 апрува для мержа
```

---

### Ревью-цикл, мерж и ретро: напоминания

**kind:** `text`

Полная методика — в проекте о Git-флоу и ревью из предыдущего модуля. Короткий ориентир:

1. **Пришли комментарии** → разбери на 🐛 баги / 🎨 стиль / 📝 документацию / 💡 предложения
2. **Правки** → в той же ветке, одно исправление = один коммит, затем `git push`
3. **Ответы** → на каждый комментарий + Resolve conversation
4. **Re-request review** → 2 апрува + все resolved → мерж
5. **Мерж** → `git switch main && git pull && git branch -d feat/business-utils && git fetch --prune`

На что смотреть в этом PR: `fromCSV(toCSV(data))` восстанавливает исходные данные? `fromCSV` правильно обрабатывает запятую внутри кавычек и экранированные `\"`/`\n`? `parseUrl` отделяет `#` раньше `?`? `groupBy` не клонирует объекты?

**Ретро.** Проговори по памяти: почему `fromCSV` нельзя реализовать через `indexOf`/`slice`? Чем `toCSV` отличается от простой склейки через запятую? Что общего у всех бизнес-утилит?

---

### Что дальше

**kind:** `text`

Проект «Бизнес-утилиты» завершён! Ты реализовал пять функций, которые разбирают входные данные и превращают объекты в текст и обратно.

Впереди **проект «HTTP-сервис»**: научишься сохранять готовые строки в файл, поднимешь собственный HTTP-сервер на `Bun.serve` и напишешь обработчики, которые используют твои утилиты.
