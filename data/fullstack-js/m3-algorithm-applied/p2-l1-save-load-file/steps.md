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
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';

writeFileSync('users.txt', 'Anna,Boris,Nurlan', 'utf8'); // запись в файл
const isBeforeExist = existsSync('users.txt'); // существует ли файл: true
const text = readFileSync('users.txt', 'utf8'); // чтение из файла
unlinkSync('users.txt'); // удалить файл
const isAfterExist = existsSync('users.txt'); // существует ли файл: false

console.log('Был ли записан файл:', isBeforeExist ? 'Да' : 'Нет');
console.log('Записано в файл:', text);
console.log('Успешно ли удален файл:', isAfterExist ? 'Нет' : 'Да');
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

**Важно:** Чтобы тесты не оставляли мусора на диске, настройте очистку в `afterEach`:

```js
import { unlinkSync, existsSync } from 'node:fs';

const testPath = 'business-utils/temp-test.csv';

afterEach(() => {
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
});
```

Тестовые случаи:
- после вызова файл существует: `existsSync(path)` → `true`
- содержимое файла равно `toCSV(data)`: `readFileSync(path, 'utf8')` → `'a\n1\n'`
- пустой массив: `toCSV([])` → `''`, и файл записывается пустым
- файл перезаписывается, а не дополняется

Для тестов бери временный путь (например, `'business-utils/temp-test.csv'`).

---

### Функция loadFromFile(path)

**kind:** `text`

Реализуй синхронную функцию `loadFromFile(path)` в том же файле.

**Функция принимает:**
- `path`: `string` — путь к файлу.

**Функция возвращает:** `array` — массив объектов.

**Важно:** читает строку через `readFileSync(path, 'utf8')` и разбирает готовой `fromCSV`.

Тестовые случаи:
- читает то, что записал `saveToFile`
- файл с данными `'a\n1\n'` → `[{ a: 1 }]`
- пустой файл → `[]`
- несуществующий файл → ошибка: 'Файла по пути `<your-path>` не существует.'
- Windows-файл с CRLF: `'a\r\n1\r\n'` → `[{ a: 1 }]`

---

### Комплект объектов для проб

**kind:** `text`

Давай проверим все функции в одном потоке. Создай `business-utils/test-data.js` и экспортируй массив.

Ниже набор данных и запись и чтение. Ниже напиши код который проверит данные. Как проверять на твое усмотрение. Как удалять (сразу в коде или в ручную позже), тоже на твой выбор.

Заметь: ключи берутся по первому объекту, поэтому набор ключей во всех объектах должен совпадать. Т.е пропущенные ключи во втором объекте восстановятся при чтении со значением undefined.

```js
export const users = [
  { name: 'Анна', age: 25, home: '25', pet: null, isWorked: true, note: 'дружелюбная' },
  { name: 'Борис', age: 0, pet: 'кот', isWorked: false },
  { name: 'Вера, "Победа"', age: -3.14, home: 'a\\b', pet: 'пёс\nи друг', isWorked: true, note: 'сложная' },
];

const path = 'users.txt';

await saveToFile(path, users);
const back = loadFromFile(path);

// back равен users: те же значения и типы
```

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
* **UTF-8** — кодировка текста, в которой Bun пишет и читает файлы.
* **Персистентность** — свойство данных сохраняться между запусками программы.
* **Round-trip через файл** — (туда-обратно) `loadFromFile` после `saveToFile` возвращает исходные данные и типы.
