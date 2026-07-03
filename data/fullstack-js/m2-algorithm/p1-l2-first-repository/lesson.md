# Первый репозиторий: git init, .gitignore и структура проекта

**Краткое содержание:**
Студент создаёт папку проекта `js-algorithms`, инициализирует Git-репозиторий и настраивает `.gitignore`. Урок знакомит с командами `git init`, `git status` и объясняет, зачем нужен `.gitignore`.

### Подробный конспект

#### 1. Создание проекта

Проект «JS Algorithms» — это папка, в которой мы будем писать все функции этого модуля. Каждая функция — отдельный файл, и у каждой функции будут тесты.

```bash
mkdir js-algorithms
cd js-algorithms
```

Внутри создадим начальные файлы:
- `index.js` — точка входа (будет импортировать и экспортировать все функции)
- `index.test.js` — точка входа для тестов (пока пустая)

```bash
# Linux / macOS / Git Bash:
touch index.js index.test.js

# Windows (cmd):
type nul > index.js && type nul > index.test.js
```

#### 2. Инициализация Git-репозитория

Команда `git init` создаёт в текущей папке скрытую директорию `.git` — именно в ней Git хранит всю историю, ветки и настройки.

```bash
git init
# Initialized empty Git repository in .../js-algorithms/.git/
```

После `git init` можно проверить состояние:

```bash
git status
# On branch main
# No commits yet
# Untracked files: index.js, index.test.js
```

**Untracked files** — файлы, которые Git видит, но пока не отслеживает. Чтобы Git начал следить за ними, нужно добавить их в stage (об этом в уроке 1.9 про коммиты).

#### 3. Файл .gitignore

Некоторые файлы и папки **не должны** попадать в Git:

- `node_modules/` — зависимости (их можно установить заново через `bun install`)
- `.env` — файлы с секретами (ключи API, пароли)
- `.DS_Store` (macOS), `Thumbs.db` (Windows) — системные файлы
- `dist/`, `build/` — скомпилированные файлы

Файл `.gitignore` говорит Git, какие файлы и папки игнорировать. Создадим его в корне проекта:

```bash
# Linux / macOS / Git Bash:
touch .gitignore

# Windows (cmd):
type nul > .gitignore
```

Содержимое `.gitignore`:

```
node_modules/
.env
.DS_Store
dist/
```

**Синтаксис .gitignore:**
- `node_modules/` — игнорировать всю папку
- `*.log` — игнорировать все файлы с расширением `.log`
- `!important.log` — исключение: этот файл НЕ игнорировать
- `#` — комментарий

#### 4. Проверка: .gitignore работает?

```bash
git status
# Теперь .gitignore в untracked (это нормально — его мы закоммитим),
# а node_modules (если есть) — не показывается
```

#### 5. Полная структура проекта

После настройки папка `js-algorithms` выглядит так:

```
js-algorithms/
├── .git/              # скрытая папка — хранилище Git
├── .gitignore         # правила игнорирования
├── index.js           # точка входа
└── index.test.js      # точка входа для тестов
```

Файлы пока пустые — мы наполним их в следующих уроках.

---

**Ссылки для самостоятельного изучения:**
- [Git Get Started](https://www.w3schools.com/git/git_getstarted.asp) — начало работы с Git
- [Git Ignore](https://www.w3schools.com/git/git_ignore.asp) — файл .gitignore

**Видео:** [p1-l2. Первый репозиторий.mp4](https://drive.google.com/file/d/placeholder)
