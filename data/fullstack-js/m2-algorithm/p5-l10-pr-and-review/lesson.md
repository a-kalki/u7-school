# Пуш ветки и создание Pull Request для проекта 5

**Краткое содержание:**
Студент отправляет feature-ветку `feat/array-basics` на GitHub и создаёт Pull Request с 9 новыми функциями для работы с массивами. Урок закрепляет навыки работы с remote и PR, добавляя акцент на мутабельность в описание.

### 1. Проверка готовности

Перед пушем убедись, что:
- Все 9 функций реализованы в папке `arrays/`: `len`, `at`, `push`, `pop`, `unshift`, `shift`, `indexOf`, `lastIndexOf`, `includes`
- Каждая функция задокументирована в JSDoc (мутабельные функции отмечены явно)
- Все тесты проходят: `bun test`
- `git status` показывает «nothing to commit, working tree clean»
- Ты в ветке `feat/array-basics`: `git branch`

### 2. Отправка ветки на GitHub

```bash
git push -u origin feat/array-basics
```

### 3. Создание Pull Request

1. Перейди на GitHub в репозиторий `js-algorithms`
2. Нажми **Compare & pull request** для ветки `feat/array-basics`
3. Выбери base: `main`, compare: `feat/array-basics`

### 4. Оформление PR

В описании перечисли все 9 функций, отметь какие из них мутабельные, укажи как запустить тесты.


**Видео:** [Пуш и PR проекта 5.mp4](https://drive.google.com/file/d/placeholder)
