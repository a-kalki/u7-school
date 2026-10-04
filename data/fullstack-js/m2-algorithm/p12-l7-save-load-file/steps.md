# Шаги урока: Сохранение и чтение файла (`node:fs`)

---

### Зачем файл

**kind:** `text`

Пока все наши данные жили в памяти: объявил массив — он есть, пока работает программа. Перезапустил `bun` — данных нет. **Файл** решает эту задачу: то, что записано на диск, переживает перезапуск.

У нас уже есть обе половины работы со строкой:

- `toCSV(data)` — массив объектов → строка;
- `fromCSV(text)` — строка → массив объектов.

Осталось связать их с файлом. Цепочка целиком:

```
массив объектов → toCSV → строка → запись в файл
файл → чтение строки → fromCSV → массив объектов
```

В этом уроке напишем синхронные функции `saveToFile(path, data)` и `loadFromFile(path)` и проверим, что данные переживают круг через настоящий файл.

---

### Синхронный API модуля `node:fs`

**kind:** `text`

Для синхронной работы с файлами в Bun и Node.js используется встроенный модуль `'node:fs'`. Никаких промисов и `await` — всё работает просто и последовательно.

**Запись:**

```js
import { writeFileSync } from 'node:fs';

writeFileSync('users.txt', 'строка', 'utf8');
```

Создаёт файл или перезаписывает его.

**Чтение:**

```js
import { readFileSync } from 'node:fs';

const text = readFileSync('users.txt', 'utf8');
```

Возвращает содержимое как строку.

**Проверка существования:**

```js
import { existsSync } from 'node:fs';

const ok = existsSync('users.txt'); // true / false
```

Операции синхронные — программа ждёт завершения записи или чтения диска и сразу возвращает результат.

Проверь сам через `bun repl`:

```js
import { writeFileSync, readFileSync } from 'node:fs';
writeFileSync('/tmp/demo.txt', 'Привет', 'utf8');
console.log(readFileSync('/tmp/demo.txt', 'utf8')); // Привет
```

---

### Функция saveToFile(path, data)

**kind:** `text`

Реализуй синхронную функцию `saveToFile(path, data)`. Создай файлы `business-utils/file-storage.js` и `business-utils/file-storage.test.js`, следуй TDD.

**Функция принимает:**
- `path`: `string` — путь к файлу;
- `data`: `array` — массив плоских объектов (как у `toCSV`).

**Функция возвращает:** `undefined`.

**Важно:** функция **иммутабельная** — `data` не меняется. Строку формирует готовая `toCSV`, а в файл её пишет `writeFileSync`.

```js
import { writeFileSync } from 'node:fs';

function saveToFile(path, data) {
  const text = toCSV(data);
  writeFileSync(path, text, 'utf8');
}
```

Тестовые случаи:
- после вызова файл существует: `existsSync(path)` → `true`
- содержимое файла равно `toCSV(data)`: `readFileSync(path, 'utf8')` → `'a\n1\n'`
- пустой массив: `toCSV([])` → `''`, и файл записывается пустым
- файл перезаписывается, а не дополняется

Для тестов бери временный путь (например, `'business-utils/temp-test.csv'`).

**Важно: никаких моков!** Мы не подделываем файловую систему — Bun работает с диском за микросекунды. Мы пишем в реальный физический файл и читаем реальный файл. Чтобы тесты не оставляли мусора на диске, настройте очистку в `afterEach`:

```js
import { unlinkSync, existsSync } from 'node:fs';

const testPath = 'business-utils/temp-test.csv';

afterEach(() => {
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
});
```

---

### Функция loadFromFile(path)

**kind:** `text`

Реализуй синхронную функцию `loadFromFile(path)` в том же файле.

**Функция принимает:**
- `path`: `string` — путь к файлу.

**Функция возвращает:** `array` — массив объектов.

**Важно:** читает строку через `readFileSync(path, 'utf8')` и разбирает готовой `fromCSV`.

```js
import { readFileSync } from 'node:fs';

function loadFromFile(path) {
  const text = readFileSync(path, 'utf8');
  return fromCSV(text);
}
```

Тестовые случаи:
- читает то, что записал `saveToFile`
- файл с данными `'a\n1\n'` → `[{ a: 1 }]`
- пустой файл → `[]`
- несуществующий файл → ошибка: `expect(() => loadFromFile('нет.txt')).toThrow()`
- Windows-файл с CRLF: `'a\r\n1\r\n'` → `[{ a: 1 }]`

---

### Комплект объектов для проб

**kind:** `text`

Чтобы проверять на реальных данных, собери один набор объектов на все случаи. Создай `business-utils/test-data.js` и экспортируй массив.

В наборе должны быть:
- разные типы: строка, число, boolean, `null`, `undefined`;
- falsy-значения: `0`, `false`, пустая строка `''`;
- спецсимволы: запятая, кавычка, обратный слэш, перенос строки.

Пример:

```js
export const users = [
  { name: 'Анна', age: 25, home: '25', pet: null, isWorked: true, note: 'дружелюбная' },
  { name: 'Борис', age: 0, home: '', pet: 'кот', isWorked: false, note: undefined },
  { name: 'Вера, "Победа"', age: -3.14, home: 'a\\b', pet: 'пёс\nи друг', isWorked: true, note: 'сложная' },
];
```

Помни: ключи берутся по первому объекту, поэтому набор ключей во всех объектах должен совпадать.

---

### Round-trip через файл

**kind:** `text`

Главная проверка пары функций — круг через файл:

```js
const path = 'users.txt';

await saveToFile(path, users);
const back = await loadFromFile(path);

// back равен users: те же значения и типы
```

Напиши тесты:
1. Round-trip на всём наборе `users`: `back` глубоко равен `users`.
2. Типы сохраняются: `age: 0` остаётся числом, `null` — `null`, `undefined` — `undefined`.
3. Файл на диске содержит реальные `\n` (LF), а не литералы `\` + `n`.
4. Если файл сохранён вручную с CRLF (`'a,b\r\n1,2\r\n'`), `loadFromFile` всё равно вернёт `[{ a: 1, b: 2 }]`.

Подсказка: чтобы проверить содержимое файла, используй `await Bun.file(path).text()`.

---

### Вопросы на понимание

**kind:** `text`

Ответь на вопросы. Если не знаешь — проверь гипотезу кодом через `bun`.

**1.** Зачем нужен файл, если `toCSV` уже превращает данные в строку?

**2.** Почему `saveToFile` и `loadFromFile` асинхронные? Что было бы не так, если бы они были обычными синхронными функциями?

**3.** Чем `Bun.write` отличается от `toCSV`? Почему в `saveToFile` мы не формируем строку вручную?

**4.** Что вернёт `loadFromFile` для пустого файла? Почему?

**5.** Файл сохранили на Windows, он стал CRLF (`\r\n`). Почему `fromCSV` его всё равно прочитает?

---

### Сохрани изменения

**kind:** `text`

Когда все тесты пройдут:

```bash
git add business-utils/file-storage.js business-utils/file-storage.test.js business-utils/test-data.js
git commit -m "Реализованы saveToFile и loadFromFile — работа с файлами"
```

---

### Термины урока

**kind:** `text`

Пройдись по основным понятиям урока. Если что-то не можешь объяснить своими словами — вернись к соответствующему шагу.

**Термины:**
* **Файл** — именованное хранилище данных на диске, переживает перезапуск программы.
* **`Bun.write(path, text)`** — асинхронная запись строки в файл (создаёт или перезаписывает).
* **`Bun.file(path)`** — объект-файл Bun; `.text()` читает содержимое, `.exists()` проверяет наличие.
* **Асинхронность** — операция возвращает `Promise`; результат получают через `await`, не блокируя программу.
* **`async` / `await`** — синтаксис для работы с асинхронными операциями «как с обычными».
* **UTF-8** — кодировка текста, в которой Bun пишет и читает файлы.
* **Персистентность** — свойство данных сохраняться между запусками программы.
* **Round-trip через файл** — `loadFromFile` после `saveToFile` возвращает исходные данные и типы.
* **LF / CRLF** — варианты переноса строки (`\n` и `\r\n`); `fromCSV` читает оба.
