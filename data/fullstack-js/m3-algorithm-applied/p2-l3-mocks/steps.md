# Шаги урока: Инфраструктура хранения, моки и первая функция репозитория

### Персистентность и модуль `node:fs`

**kind:** `text`

До сих пор данные в наших уроках существовали только в памяти работающего процесса. Если остановить скрипт, все переменные бесследно исчезают.

Для создания полноценного сервиса нужна **персистентность** — свойство данных переживать перезапуск программы. Самый простой способ персистентности — сохранение на диск в файл.

В средах Node.js и Bun для синхронной работы с файлами используется встроенный системный модуль `'node:fs'`.

```javascript
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';

const testFile = 'temp-demo.txt';

// 1. Запись строки в файл (создание или перезапись)
writeFileSync(testFile, 'Привет, диск!', 'utf8');

// 2. Проверка наличия файла
console.log('Файл существует?', existsSync(testFile)); // true

// 3. Чтение содержимого файла как строки
const content = readFileSync(testFile, 'utf8');
console.log('Прочитано:', content); // 'Привет, диск!'

// 4. Удаление временного файла
unlinkSync(testFile);
```

Операции выполняются синхронно, последовательно.

---

### Готовый файл `infra/file-storage.js`

**kind:** `text`

Создай каталог `infra/` внутри папки проекта `m2-m3-algorithms/m3-p2-http/`.

Создай файл `infra/file-storage.js` и скопируй в него готовую реализацию инфраструктурного слоя:

```javascript
import { writeFileSync, readFileSync } from 'node:fs';
import { toCSV } from '../../utils/business/to-csv.js';
import { fromCSV } from '../../utils/business/from-csv.js';

// Сохраняет массив плоских объектов в файл в формате CSV.
export function saveToFile(path, data) {
  const text = toCSV(data);
  writeFileSync(path, text, 'utf8');
}

// Читает CSV-файл и восстанавливает массив объектов.
export function loadFromFile(path) {
  const text = readFileSync(path, 'utf8');
  return fromCSV(text);
}
```

Обрати внимание на чистоту архитектуры: функции `saveToFile` и `loadFromFile` не содержат ни строчки логики о заказах, интернет-магазинах или сетевых запросах. Это универсальный низкоуровневый инструмент.

---

### Проверка round-trip на реальном диске

**kind:** `text`

Создай временный тестовый файл `infra/file-storage.test.js` и убедись, что данные переживают полный круг сохранения и чтения:

```javascript
import { test, expect, afterEach } from 'bun:test';
import { existsSync, unlinkSync } from 'node:fs';
import { saveToFile, loadFromFile } from './file-storage.js';

const TEST_PATH = 'infra/temp-roundtrip.csv';

afterEach(() => {
  if (existsSync(TEST_PATH)) {
    unlinkSync(TEST_PATH);
  }
});

test('round-trip: массив объектов сохраняется в файл и считывается обратно', () => {
  const sampleData = [
    { id: 1, customer: 'Анна', amount: 5000, isPaid: true },
    { id: 2, customer: 'Борис', amount: 3200, isPaid: false },
  ];

  saveToFile(TEST_PATH, sampleData);
  const loaded = loadFromFile(TEST_PATH);

  expect(loaded).toEqual(sampleData);
});
```

Запусти проверку: `bun test infra/file-storage.test.js`. Убедись, что тест зелёный.

---

### Проблема: почему тесты бизнес-логики не должны писать на диск

**kind:** `text`

Далее будет использоваться термин — `Репозиторий`, не путайте это с тем же термином в контексте гита. В контексте приложения, это слово означает другое.

Репозиторий это абстракция, представьте что это место куда можно положить что то, а потом вытащить. Наш репозиторий предоставит метод добавления, обновления и получения заказов. При этом он будет записывать на диск используя подготовленные функции `loadFromFile`, `saveToFile`.

При этом, мы будем эти функции работы с заказом (например `getOrder`) реализовывать через TDD и при этом в момент выполнения тестов, мы не хотим чтобы происходила запись на диск.

**Причины:**
1. **Скорость:** обращение к диску медленнее работы с памятью в тысячи раз. При сотнях тестов запуск станет мучительно долгим.
2. **Хрупкость:** если тест упал посередине и не успел удалить файл, следующий тест начнёт работу с «грязным» состоянием.
3. **Изоляция:** тесты не должны зависеть от файловой системы операционной системы, прав доступа или свободного места.

Мы хотим, чтобы наш код вызывал `loadFromFile` и `saveToFile`, но данные при этом мгновенно читались и сохранялись в обычную переменную в памяти тестового процесса.

Для этого используют **тестовые дублёры (Test Doubles):** — `mock`, `stub`, `spy`. Часто все три разновидности дублеров обобщаются одним словом **Мок**, но по ответственностям они делятся на эти три группы.

---

### Тестовые дублёры: Stub, Spy и Mock — в чём разница

**kind:** `text`

Три главные роли термина **Мок**:

1. **Стаб (Stub, заглушка):** отвечает заранее заготовленными данными. Его цель — снабдить тестируемый код нужным входом («когда запросят файл — верни массив из 2 заказов») или сымитировать ошибку. Стаб не проверяет, как именно его вызвали.
2. **Спай (Spy, шпион):** оборачивает метод существующего объекта и подсматривает за вызовами (сколько раз вызвали, с какими аргументами). Оригинальный метод при этом продолжает работать по-настоящему.
3. **Мок (Mock):** функция с запрограммированными ожиданиями. Фокус мока — проверка взаимодействия: «я ожидаю, что репозиторий вызовет `saveToFile` ровно 1 раз и передаст туда обновлённый массив».

Тестовый фреймворк Bun предоставляет три инструмента для всех этих сценариев:
- `mock()` — создание независимой функции;
- `spyOn()` — шпионаж за методом существующего объекта;
- `mock.module()` — подмена импорта целого файла.

---

### Инструмент 1: Автономная функция `mock()` и проверка вызовов

**kind:** `text`

Функция `mock(implementation)` создаёт обёртку, которая запоминает все свои вызовы.

#### 1. Создание и вызов

```javascript
import { mock, test, expect } from 'bun:test';

const double = (x) => x * 2;

// Создаём мок с логикой удвоения:
const doubleMock = mock(double);

// ВАЖНО: чтобы мок зарегистрировал вызов, нужно вызвать именно doubleMock!
const result = doubleMock(5);

expect(result).toBe(10);
expect(doubleMock).toHaveBeenCalledTimes(1);
expect(doubleMock).toHaveBeenCalledWith(5);

// Вызов вне мока, не регистрируется
double(2);
expect(doubleMock).toHaveBeenCalledTimes(1);
expect(doubleMock).toHaveBeenCalledWith(5);
```

#### 2. Настройка возвращаемого значения (поведение стаба)

```javascript
const loadMock = mock();

// Все последующие вызовы возвращают этот массив:
loadMock.mockReturnValue([{ id: 1, customer: 'Анна' }]);
expect(loadMock()).toEqual([{ id: 1, customer: 'Aнна' }])
expect(loadMock()).toEqual([{ id: 1, customer: 'Aнна' }])

// Только следующий один вызов вернёт пустой массив, дальше по умолчанию:
loadMock.mockReturnValueOnce([]);
expect(loadMock()).toEqual([]);
expect(loadMock()).toEqual([{ id: 1, customer: 'Aнна' }])

// Подмена реализации на лету (передаем колбэк):
loadMock.mockImplementation((id) => [{ id, customer: 'Тест' }]);
expect(loadMock(99)).toEqual([{ id: 99, customer: 'Тест' }])
```

#### 3. Матчеры проверок в тестах

- `expect(fn).toHaveBeenCalled()` — была вызвана хотя бы раз;
- `expect(fn).toHaveBeenCalledTimes(n)` — вызвана ровно `n` раз;
- `expect(fn).toHaveBeenCalledWith(arg1, arg2)` — вызвана с конкретными аргументами;
- `expect(fn).toHaveBeenLastCalledWith(...)` — последний вызов был с этими аргументами.

---

### Инструмент 2: Наблюдение за методом через `spyOn(object, method)`

**kind:** `text`

В чём отличие `spyOn` от `mock()`?
- `mock()` создаёт **новую отдельную функцию** с нуля.
- `spyOn(obj, methodName)` цепляется к **уже существующему методу реального объекта**.

#### Поведение по умолчанию: оригинальный метод выполняется!

```javascript
import { spyOn, test, expect } from 'bun:test';

// Объект с методом
const userStorage = {
  getDiscount(amount) {
    return amount > 1000 ? 10 : 0;
  },
};

// Ставим шпиона на метод:
const spy = spyOn(userStorage, 'getDiscount');

// Вызываем реальный метод объекта (не мок и не шпиона):
const discount = userStorage.getDiscount(2000);

// Оригинальный метод честно отработал:
expect(discount).toBe(10);

// И шпион записал вызов:
expect(spy).toHaveBeenCalledTimes(1);
expect(spy).toHaveBeenCalledWith(2000);

// Очищаем и возвращаем объекту исходный вид:
spy.mockRestore();
```

#### Временное заглушение метода

Если нужно временно подавить вывод `console.log` в тестах или подменить результат метода:

```javascript
const logSpy = spyOn(console, 'log').mockImplementation(() => {});

console.log('Это сообщение не попадёт в консоль');
expect(logSpy).toHaveBeenCalledTimes(1);

// ОБЯЗАТЕЛЬНО восстанавливаем оригинальный метод!
logSpy.mockRestore();
```

Метод `spy.mockRestore()` критически важен: если его не вызвать, метод останется заглушенным во всех следующих тестах файла.

---

### Инструмент 3: Подмена статических импортов через `mock.module`

**kind:** `text`

Когда файл репозитория `order-repo.js` делает прямой статический импорт:

```javascript
import { loadFromFile, saveToFile } from '../../infra/file-storage.js';
```

Здесь `loadFromFile` — не метод объекта (поэтому `spyOn` не применить) и не параметр функции (поэтому передать `mock()` через аргументы нельзя). Зависимость жёстко зашита через путь импорта.

Для таких случаев используется **`mock.module(path, factory)`**:
Он перехватывает путь импорта на уровне системы модулей Bun:

```javascript
import { mock, test, expect, beforeEach } from 'bun:test';

// Заводим базу в памяти:
let fakeDb = [];

// Подменяем модуль file-storage.js:
mock.module('../../infra/file-storage.js', () => ({
  loadFromFile: mock(() => [...fakeDb]),
  saveToFile: mock((path, data) => {
    fakeDb = [...data];
  }),
}));

// Импортируем тестируемый файл:
import { getOrder } from './order-repo.js';

test('находит заказ по id', () => {
  fakeDb = [{ id: 1, customer: 'Анна' }];
  const order = getOrder(1);
  expect(order).toEqual({ id: 1, customer: 'Анна' });
});
```

Когда `order-repo.js` выполняет `loadFromFile`, он получает подставную функцию из `mock.module`, работающую с переменной `fakeDb`, и ни одного байта на диск не записывается.

---

### Гигиена тестов и матрица выбора

**kind:** `text`

#### Управление состоянием моков:

1. **`mockFn.mockClear()`** — сбрасывает счётчики вызовов и историю аргументов. **Поведение и реализация сохраняются.** Всегда вызывай в `beforeEach`.
2. **`mockFn.mockReset()`** — сбрасывает историю вызовов **и саму реализацию** (мок снова возвращает `undefined`).
3. **`spy.mockRestore()`** — снимает шпиона и возвращает объекту оригинальный метод. Вызывай в `afterEach`.

#### Матрица выбора: что и когда применять

**Ситуация:** Подменить функцию или метод (вместо оригинального, что то другое).
**Инструмент:** `mock(fn)`.
**Почему:** Создаёт изолированную функцию с проверками вызовов.

**Ситуация:** Подсмотреть за методом объекта или временно заглушить `console.log`.
**Инструмент:** `spyOn(obj, 'method')`.
**Почему:** Метод уже существует на объекте; можно наблюдать или временно переопределить с возвратом через `mockRestore`.

**Ситуация:** Подменить файл, который тестируемый модуль импортирует через `import`.
**Инструмент:** `mock.module(path, factory)`.
**Почему:** Зависимость зашита в код модуля; нужно подменить её на уровне загрузчика модулей.

---

### Практика: закрепляем инструменты мокирования

**kind:** `text`

Чтобы почувствовать, как ведут себя моки в деле, создай файл `infra/mock-demo.test.js`. Напиши три коротких теста, по одному на каждый разобранный инструмент:

```javascript
import { test, expect, mock, spyOn, beforeEach, afterEach } from 'bun:test';

// 1. Проверяем автономный mock()
test('mock() запоминает вызовы и возвращает настроенные данные', () => {
  const doubler = mock((x) => x * 2);

  const res1 = doubler(4);
  const res2 = doubler(10);

  expect(res1).toBe(8);
  expect(res2).toBe(20);
  expect(doubler).toHaveBeenCalledTimes(2);
  expect(doubler).toHaveBeenCalledWith(4);
  expect(doubler).toHaveBeenLastCalledWith(10);
});

// 2. Проверяем spyOn() и mockRestore()
test('spyOn() следит за объектом и корректно восстанавливается', () => {
  const service = {
    greet(name) {
      return `Привет, ${name}!`;
    },
  };

  const spy = spyOn(service, 'greet');

  const greeting = service.greet('Нурболат');

  expect(greeting).toBe('Привет, Нурболат!');
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith('Нурболат');

  spy.mockRestore();
});

// 3. Проверяем mock.module()
test('mock.module() перехватывает обращение к модулю в памяти', async () => {
  let inMemoryData = [{ id: 1, text: 'тест' }];

  mock.module('./file-storage.js', () => ({
    loadFromFile: mock(() => inMemoryData),
    saveToFile: mock((path, data) => {
      inMemoryData = data;
    }),
  }));

  // выражение await import(...) позволяет выполнять импорт не в момент парсинга файла,
  // а по ходу потока выполнения.
  const { loadFromFile, saveToFile } = await import('./file-storage.js');

  expect(loadFromFile('любой-путь.csv')).toEqual([{ id: 1, text: 'тест' }]);

  saveToFile('любой-путь.csv', [{ id: 2, text: 'обновлено' }]);
  expect(inMemoryData).toEqual([{ id: 2, text: 'обновлено' }]);
});
```

Запусти тесты: `bun test infra/mock-demo.test.js`. Убедись, что все проверки по мокам зелёные!

---

### Критерии приёмки

**kind:** `text`

- Файл `infra/file-storage.js` содержит готовые `saveToFile` и `loadFromFile`.
- Тест `infra/file-storage.test.js` подтверждает round-trip на диске и удаляет временный файл после себя.
- Тест `infra/mock-demo.test.js` на практике подтверждает работу всех трёх инструментов: `mock`, `spyOn` и `mock.module`.
- Никакие лишние файлы не остаются на диске после прогона тестов.
- Все тесты слоя инфраструктуры проходят успешно: команда `bun test infra/` зелёная.

---

### Сохрани изменения

**kind:** `text`

Когда тесты успешно пройдут:

```bash
git add infra/
git commit -m "Добавлен слой infra и освоено мокирование в тестах"
```

---

### Термины урока

**kind:** `text`

Пройдись по понятиям урока.

**Термины:**
* **Инфраструктурный слой (Infra)** — код для работы с внешними техническими подсистемами.
* **Персистентность** — свойство данных сохраняться на диске после завершения программы.
* **Round-trip** — сквозная проверка сохранения и обратного чтения данных.
* **Тестовый дублёр (Test Double)** — фальшивый заменитель реальной зависимости в тестах.
* **Стаб (Stub)** — дублёр, отвечающий заранее заготовленными данными (фокус на входе).
* **Спай (Spy)** — дублёр, подсматривающий за вызовами реального метода объекта.
* **Мок (Mock)** — дублёр с запрограммированными ожиданиями по вызовам (фокус на поведении).
* **Изоляция** — тестирование функции отдельно от реальной файловой системы и сети.
* **Гигиена тестов** — сброс состояния моков и хранилищ между тестовыми кейсами (`mockClear`, `beforeEach`).
