# Пуш ветки и создание Pull Request для проекта 6

**Краткое содержание:**
Студент отправляет feature-ветку `feat/array-transform` на GitHub и создаёт Pull Request с 7 новыми функциями трансформации массивов.

### 1. Проверка готовности

Перед пушем убедись, что:
- Все 7 функций реализованы в папке `arrays/`: `fill`, `reverse`, `concat`, `slice`, `join`, `splice`, `flat`
- Каждая функция задокументирована в JSDoc (мутабельные функции отмечены явно: `fill`, `reverse`, `splice`)
- Все тесты проходят: `bun test`
- `git status` показывает «nothing to commit, working tree clean»
- Ты в ветке `feat/array-transform`: `git branch`

### 2. Отправка ветки на GitHub

```bash
git push -u origin feat/array-transform
```

### 3. Создание Pull Request

1. Перейди на GitHub в репозиторий `js-algorithms`
2. Нажми **Compare & pull request** для ветки `feat/array-transform`
3. Выбери base: `main`, compare: `feat/array-transform`

### 4. Оформление PR

В описании перечисли все 7 функций с пометками «мутабельная» / «иммутабельная». Отметь важные моменты:
- `fill`, `reverse`, `splice` — мутабельные, меняют массив на месте
- `concat`, `slice`, `join`, `flat` — иммутабельные, создают новый массив
- `flat` — первая функция с рекурсией
- `splice` — самая сложная, объединяет удаление и вставку

**Видео:** [p6-l8. Пуш и PR проекта 6.mp4](https://drive.google.com/file/d/placeholder)
