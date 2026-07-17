# Функция substring(str, start, end) — извлечение подстроки

**Краткое содержание:**
Урок посвящён реализации функции `substring(str, start, end)` — извлечение подстроки с обработкой граничных случаев. Студент самостоятельно пишет тесты и реализацию по текстовому описанию задачи и тестовых случаев.

### Алгоритм

Функция `substring(str, start, end)` должна вернуть подстроку от индекса `start` до `end` (не включая `end`), с нормализацией аргументов по правилам стандартного `String.prototype.substring`.

**Шаги алгоритма:**
1. Проверить типы: `str` должен быть string, `start` и `end` — number. Если нет — `throw new TypeError`
2. Нормализовать `start` и `end`:
   - Если `start` или `end` — `NaN` или отрицательные → привести к `0`
   - Если `start` или `end` больше длины строки → обрезать до длины строки
   - Если `start > end` — поменять их местами
3. Пройти циклом от `start` до `end` (не включая `end`), собирая символы в результирующую строку
4. Вернуть результирующую строку

### Реализация

Студент реализует функцию в файле `substring.js` и тесты в `substring.test.js`, следуя TDD (red → green → refactor).

**Напоминание:**
- Создай ветку для новых функций: `git switch -c feat/string-transform`
- Создай файл `substring.js` с заглушкой: `export function substring(str, start, end) { return ''; }`
- Добавь JSDoc к заглушке
- Создай файл `substring.test.js`
- Следуй TDD: RED → GREEN → REFACTOR

### Тестовые случаи

Студент должен написать тесты для следующих случаев:

| Случай | Входные данные | Ожидаемый результат |
|--------|---------------|---------------------|
| Обычное извлечение | `substring('hello', 0, 5)` | `'hello'` |
| Извлечение из середины | `substring('hello', 1, 4)` | `'ell'` |
| Один символ | `substring('hello', 0, 1)` | `'h'` |
| От 0 до конца | `substring('hello', 0, 10)` | `'hello'` (end обрезан) |
| start > end — меняются местами | `substring('hello', 4, 1)` | `'ell'` |
| Отрицательный start → 0 | `substring('hello', -2, 3)` | `'hel'` |
| Отрицательный end → 0, но start > end после нормализации | `substring('hello', 3, -1)` | `'hel'` |
| NaN → 0 | `substring('hello', NaN, 3)` | `'hel'` |
| start >= длины строки | `substring('hello', 5, 10)` | `''` |
| Оба индекса за границами | `substring('hello', 10, 20)` | `''` |
| Пустая строка | `substring('', 0, 1)` | `''` |
| Кириллица | `substring('привет', 1, 4)` | `'рив'` |
| Первый аргумент не строка | `substring(123, 0, 1)` | `TypeError` |
| Start не число | `substring('hello', 'a', 3)` | `TypeError` |

---

**Видео:** [p4-l2. Функция substring.mp4](https://drive.google.com/file/d/placeholder)
