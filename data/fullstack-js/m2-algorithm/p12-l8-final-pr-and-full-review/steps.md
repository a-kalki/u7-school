# Шаги урока: Финальный прогон, PR и сообщение в чат

---

### Бизнес-сценарий: магия функций в связке

**kind:** `text`

Пришло время почувствовать настоящую инженерную силу! Все 6 утилит, которые ты реализовал, объединяются в законченный процесс бэкенд-сервиса интернет-магазина.

Создай файл `business-utils/scenario.js` (или запусти через `bun`):

```javascript
import { getQueryParams } from './get-query-params.js';
import { parseUrl } from './parse-url.js';
import { groupBy } from './group-by.js';
import { saveToFile, loadFromFile } from './file-storage.js';
import { unlinkSync, existsSync } from 'node:fs';

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

// 5. Сохраняем каждую группу в отдельный CSV-файл на диске
const completedPath = 'business-utils/orders-completed.csv';
const pendingPath = 'business-utils/orders-pending.csv';

saveToFile(completedPath, groups.completed);
saveToFile(pendingPath, groups.pending);

// 6. Проверяем файл на диске: строка не разорвалась, перенос экранирован!
const rawFileContent = readFileSync(completedPath, 'utf8');
console.log('--- Содержимое файла на диске ---');
console.log(rawFileContent);
// Ровно 3 строки файла: 1 строка заголовков + 2 заказа! Заказ Ивана не порвал таблицу.

// 7. Читаем отчёт обратно через loadFromFile
const loadedCompleted = loadFromFile(completedPath);
console.log('Восстановлено заказов:', loadedCompleted.length);
console.log('Отзыв Ивана в памяти:', JSON.stringify(loadedCompleted[0].review));
// В памяти снова реальный перенос строки: 'Отличный сервис!\nКурьеру спасибо.'!

// 8. Чистим за собой временные файлы отчётов
if (existsSync(completedPath)) unlinkSync(completedPath);
if (existsSync(pendingPath)) unlinkSync(pendingPath);

console.log('Сценарий успешно выполнен! Все утилиты работают как часы.');
```

Запусти сценарий:
```bash
bun business-utils/scenario.js
```

Посмотри, как органично они работают вместе: парсинг URL → группировка → сериализация → сохранение на диск → чтение с восстановлением всех типов и переносов строк.

Удали `business-utils/scenario.js` после проверки или добавь как демонстрационный пример.

---

### Полный прогон всех тестов

**kind:** `text`

Запусти все тесты модуля — от проекта 1 до проекта 12:

```
bun test
```

Все зелёные. Если что-то упало — разберись и исправь **до** продолжения.

Особое внимание:
- `fromCSV` — round-trip с `toCSV`
- `saveToFile`/`loadFromFile` — round-trip через реальный файл
- `getQueryParams` — декодирование URL-кодирования
- `parseUrl` — корректный порядок разбора компонентов

---

### Проверка JSDoc на всех функциях проекта 12

**kind:** `text`

Проверь JSDoc у всех 6 бизнес-утилит:

- `getQueryParams`: `@param {string} url`, `@returns {object}`, использование `decodeURIComponent`
- `parseUrl`: `@param {string} url`, `@returns {object}` с перечислением всех полей (protocol, host, port, path, query, hash)
- `toCSV`: `@param {Array<object>} data`, `@returns {string}`, правила экранирования
- `fromCSV`: `@param {string} csvString`, `@returns {Array<object>}`, round-trip совместимость с `toCSV`, конечный автомат
- `groupBy`: `@param {array} array`, `@param {string} key`, `@returns {object}`, что объекты в группах не клонируются
- `saveToFile`: `@param {string} path`, `@param {Array<object>} data`, `@returns {undefined}`, синхронная запись через `writeFileSync`
- `loadFromFile`: `@param {string} path`, `@returns {Array<object>}`, синхронное чтение через `readFileSync`

Пропущено что-то — дополни.

---

### Состояние репозитория и пуш ветки

**kind:** `text`

`git status` — clean. `git log --oneline` — история отражает порядок реализации: `getQueryParams` → `parseUrl` → `groupBy` → `toCSV` → `fromCSV` → `saveToFile`/`loadFromFile`.

Если есть незакоммиченное — закоммить:

```
git add -A
git commit -m "Финальные правки: JSDoc и тесты проекта 12"
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
Проект 12: Бизнес-утилиты — query, URL, CSV, файлы, группировка
```

**Описание — заполни по шаблону:**

```markdown
## Что сделано

Реализованы 6 бизнес-утилит (папка business-utils/):

- getQueryParams(url) — разбор query-строки URL в объект; URL-кодирование через decodeURIComponent
- parseUrl(url) — разбор URL на 6 компонентов: protocol, host, port, path, query, hash
- toCSV(data) — массив объектов → строка нашего формата с экранированием
- fromCSV(csvString) — строка нашего формата → массив объектов, конечный автомат с флагом inString
- groupBy(array, key) — группировка массива объектов по значению ключа
- saveToFile(path, data) / loadFromFile(path) — сохранение и чтение таблицы в текстовый файл через Bun API

## Особенности реализации

- Все функции иммутабельные — исходные данные не меняются
- fromCSV и toCSV взаимно обратимы (round-trip), в том числе через файл
- fromCSV читает и LF, и CRLF (пропускает \r вне строки)
- parseUrl разбирает URL от внешних разделителей к внутренним
- groupBy использует hasOwnProperty; объекты в группах — те же ссылки
- Используются только свои функции (indexOf, slice, len, keys, push)
  и разрешённые глобальные (decodeURIComponent, String, Bun)

## Как запустить тесты

bun test
```

Что важно для ревьюеров, может быть не очевидно — обязательно указывай. Если считаешь, что команда «в теме», часть разделов можно сократить.

---

### Сообщение в чат

**kind:** `text`

Выложи сообщение в общий чат:

```
🔍 PR на ревью: [Проект 12: Бизнес-утилиты — query, URL, CSV, файлы, группировка]
📎 Ссылка: https://github.com/твой-username/js-algorithms/pull/N
📋 Нужно 2 апрува для мержа
```

---

### Ревью-цикл, мерж и ретро: напоминания

**kind:** `text`

Полная методика — в проекте 4. Короткий ориентир:

1. **Пришли комментарии** → разбери на 🐛 баги / 🎨 стиль / 📝 документацию / 💡 предложения
2. **Правки** → в той же ветке, одно исправление = один коммит, затем `git push`
3. **Ответы** → на каждый комментарий + Resolve conversation
4. **Re-request review** → 2 апрува + все resolved → мерж
5. **Мерж** → `git switch main && git pull && git branch -d feat/business-utils && git fetch --prune`

На что смотреть в этом PR: `fromCSV(toCSV(data))` восстанавливает исходные данные? `fromCSV` правильно обрабатывает запятую внутри кавычек и экранированные `\"`/`\n`? `loadFromFile` после `saveToFile` возвращает те же типы? `parseUrl` отделяет `#` раньше `?`? `groupBy` не клонирует объекты?

**Ретро.** Проговори по памяти: почему `fromCSV` нельзя реализовать через `indexOf`/`slice`? Чем `toCSV` отличается от простой склейки через запятую? Что общего у всех бизнес-утилит?

---

### Что дальше

**kind:** `text`

Проект 12 завершён! Всего реализовано ~55 функций.

Впереди **проект 13** — «Сортировка и бинарный поиск»: реализуешь классические алгоритмы сортировки и бинарный поиск, сравнишь их производительность.
