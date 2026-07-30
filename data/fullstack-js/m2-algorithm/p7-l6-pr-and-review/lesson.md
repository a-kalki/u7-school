# Пуш ветки и создание Pull Request для проекта 7

**Краткое содержание:**
Студент отправляет feature-ветку `feat/iterative-methods` на GitHub и создаёт Pull Request с 5 новыми функциями — итеративными методами массивов.

### 1. Проверка готовности

Перед пушем убедись, что:
- Все 5 функций реализованы в папке `arrays/`: `forEach`, `map`, `filter`, `some`, `every`
- Каждая функция задокументирована в JSDoc (все иммутабельные; `some` и `every` — отмечен ранний выход)
- Все тесты проходят: `bun test`
- `git status` показывает «nothing to commit, working tree clean»
- Ты в ветке `feat/iterative-methods`: `git branch`

### 2. Отправка ветки на GitHub

```bash
git push -u origin feat/iterative-methods
```

### 3. Создание Pull Request

1. Перейди на GitHub в репозиторий `js-algorithms`
2. Нажми **Compare & pull request** для ветки `feat/iterative-methods`
3. Выбери base: `main`, compare: `feat/iterative-methods`

### 4. Оформление PR

В описании перечисли все 5 функций с краткими пояснениями:
- `forEach` — перебор, вызывает callback для каждого элемента
- `map` — трансформация, новый массив из результатов callback
- `filter` — фильтрация, новый массив из прошедших проверку
- `some` — хотя бы один удовлетворяет условию (ранний выход при `true`)
- `every` — все удовлетворяют условию (ранний выход при `false`)

Отметь, что все функции иммутабельные. Напомни про ранний выход у `some`/`every`.

**Видео:** [p7-l6. Пуш и PR проекта 7.mp4](https://drive.google.com/file/d/placeholder)
