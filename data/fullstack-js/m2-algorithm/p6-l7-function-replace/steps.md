# Шаги урока: Функция replace(str, search, replacement)

---

### Реализация replace() через TDD

**kind:** `text`

> Убедись, что ты в ветке `feat/string-transform`

Реализуй функцию `replace(str, search, replacement)` — замена первого вхождения подстроки. Создай файлы `string-utils/replace.js` и `string-utils/replace.test.js`, следуй TDD.

**Функция принимает:**
- `str`: `string` — исходная строка
- `search`: `string` — что ищем
- `replacement`: `string` — на что заменяем

**Функция возвращает:** `string` — строка с заменённым первым вхождением. Если `search` не найден — исходная строка.

**Напоминание:**
- Заглушка → JSDoc → тесты → REFACTOR → коммит

Тестовые случаи (каждый — отдельный `test(...)`):
- Должна заменить `'world'` на `'everyone'`: `('hello world', 'world', 'everyone')` → `'hello everyone'`
- Должна заменить в начале: `('hello world', 'hello', 'hi')` → `'hi world'`
- Должна заменить в конце: `('hello world', 'world', 'earth')` → `'hello earth'`
- Должна заменить в середине: `('hello world', 'ello', 'i')` → `'hi world'`
- Должна вернуть исходную строку, если search не найден: `('hello', 'help', 'hhhh')` → `'hello'`
- Должна работать с заменой на более длинную: `('hi', 'i', 'ello')` → `'hello'`
- Должна работать с заменой на более короткую: `('hello', 'ello', 'i')` → `'hi'`
- Должна работать с заменой на пустую строку: `('hello', 'll', '')` → `'heo'`
- Должна заменить только первое вхождение при множественных: `('banana', 'na', 'ba')` → `'babana'`
- Должна работать с кириллицей: `('привет мир', 'мир', 'всем')` → `'привет всем'`
- Должна выбросить `TypeError` если любой аргумент не строка

---

### Сохрани изменения

**kind:** `text`

Когда все тесты пройдут:

```
git add string-utils/replace.js string-utils/replace.test.js
git commit -m "Реализована replace — замена первого вхождения подстроки"
```
