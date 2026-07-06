# Пуш ветки и создание Pull Request

**Краткое содержание:**
Студент отправляет свою feature-ветку на GitHub и создаёт Pull Request с новыми функциями проекта 3. Урок повторяет и закрепляет навыки работы с remote и PR из проекта 2.

### 1. Проверка готовности

Перед пушем убедись, что:
- Все 6 функций реализованы (`indexOf`, `includes`, `startsWith`, `endsWith`, `reverse`, `repeat`)
- Все тесты проходят: `bun test`
- Все изменения закоммичены: `git status` показывает «nothing to commit, working tree clean»
- Ты находишься в ветке `feat/substring-search`: `git branch`

### 2. Отправка ветки на GitHub

Ты уже настроил SSH и remote в проекте 2. Если remote по какой-то причине отсутствует, проверь:

```bash
git remote -v
```

Должен показывать `origin git@github.com:твой-username/js-algorithms.git`.

Отправь ветку:

```bash
git push -u origin feat/substring-search
```

Флаг `-u` (или `--set-upstream`) запоминает связь локальной ветки с удалённой. В следующий раз достаточно будет просто `git push`.

### 3. Создание Pull Request

1. Перейди на GitHub в свой репозиторий `js-algorithms`
2. GitHub обычно показывает жёлтую плашку: «feat/substring-search had recent pushes» — нажми **Compare & pull request**
3. Если плашки нет — перейди на вкладку **Pull requests** и нажми **New pull request**
4. Выбери ветки: base = `main`, compare = `feat/substring-search`

### 4. Оформление PR

**Заголовок:** кратко опиши, что сделано:
```
Проект 3: реализованы функции поиска подстрок и утилиты для строк
```

**Описание:** используй структуру:

```markdown
## Что сделано

Реализованы 6 функций для работы со строками:

- `indexOf(str, search)` — наивный поиск подстроки
- `includes(str, search)` — проверка наличия подстроки
- `startsWith(str, search)` — проверка начала строки
- `endsWith(str, search)` — проверка конца строки
- `reverse(str)` — переворот строки
- `repeat(str, count)` — повторение строки

## Как запустить тесты

bun test
```

### 5. Приглашение ревьюеров

1. В правой панели PR нажми **Reviewers**
2. Выбери двух ревьюеров (тех же, что и в проектах 1 и 2)
3. **Важно:** нужно получить **2 аппрува** перед мержем

### 6. Закрепление сообщения в чате

Скопируй ссылку на PR из адресной строки браузера. Она выглядит так:
```
https://github.com/твой-username/js-algorithms/pull/2
```

Закрепи (pin) сообщение с этой ссылкой в чате группы, чтобы ревьюеры могли быстро найти PR.
