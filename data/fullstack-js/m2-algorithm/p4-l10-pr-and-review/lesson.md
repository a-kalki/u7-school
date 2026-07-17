# Пуш ветки и создание Pull Request для проекта 4

**Краткое содержание:**
Студент отправляет feature-ветку `feat/string-transform` на GitHub и создаёт Pull Request с 8 новыми функциями проекта 4. Урок закрепляет навыки работы с remote и PR, добавляя требование JSDoc в описание.

### 1. Проверка готовности

Перед пушем убедись, что:
- Все 8 функций реализованы: `substring`, `slice`, `trim`, `replace`, `replaceAll`, `pad`, `upperCase`, `lowerCase`
- Каждая функция задокументирована в JSDoc (см. урок 4.1)
- Все тесты проходят: `bun test`
- `git status` показывает «nothing to commit, working tree clean»
- Ты в ветке `feat/string-transform`: `git branch`

### 2. Отправка ветки на GitHub

```bash
git push -u origin feat/string-transform
```

### 3. Создание Pull Request

1. Перейди на GitHub в репозиторий `js-algorithms`
2. Нажми **Compare & pull request** для ветки `feat/string-transform`
3. Выбери base: `main`, compare: `feat/string-transform`

### 4. Оформление PR

**Заголовок:**
```
Проект 4: JSDoc и функции трансформации строк
```

**Описание:**

```markdown
## Что сделано

- Все функции из проектов 1–3 задокументированы в JSDoc
- Реализованы 8 новых функций для трансформации строк:

  - `substring(str, start, end)` — извлечение подстроки с нормализацией индексов
  - `slice(str, start, end)` — извлечение с поддержкой отрицательных индексов
  - `trim(str)` — удаление пробелов с начала и конца
  - `replace(str, search, replacement)` — замена первого вхождения
  - `replaceAll(str, search, replacement)` — замена всех вхождений
  - `pad(str, length, char, side)` — дополнение строки символами
  - `upperCase(str)` — перевод латиницы в верхний регистр
  - `lowerCase(str)` — перевод латиницы в нижний регистр

- Каждая функция задокументирована в JSDoc (`@param`, `@returns`, `@throws`, `@example`)

## Как запустить тесты

bun test

## На что обратить внимание

- В upperCase/lowerCase используется `.charCodeAt()` и `String.fromCodePoint()` — это разрешённые методы
- `replaceAll` не применяет замену рекурсивно к уже заменённому тексту
- `slice` поддерживает отрицательные индексы (в отличие от `substring`)
```

### 5. Приглашение ревьюеров и pin

- Добавь 2 ревьюеров
- Закрепи сообщение со ссылкой на PR в чате

---

**Видео:** [p4-l10. PR и ревью.mp4](https://drive.google.com/file/d/placeholder)
