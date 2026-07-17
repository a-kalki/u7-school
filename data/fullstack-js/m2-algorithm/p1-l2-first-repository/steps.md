# Шаги урока: Первый репозиторий

---

### Инициализация репозитория и git init

**kind:** `text`

Изучи материал по началу работы с Git:

- [Git Get Started](https://www.w3schools.com/git/git_getstarted.asp) — инициализация репозитория, `git init`
- [Git Ignore](https://www.w3schools.com/git/git_ignore.asp) — файл `.gitignore`

После прочтения создай свой первый репозиторий:

```
mkdir js-algorithms
cd js-algorithms
git init
```

Создай начальные файлы:

```
# Linux / macOS / Git Bash:
touch index.js index.test.js .gitignore

# Windows (cmd):
type nul > index.js && type nul > index.test.js && type nul > .gitignore
```

---

### Настройка .gitignore

**kind:** `text`

Настрой `.gitignore` — открой его в редакторе и добавь:

```
node_modules/
.env
.DS_Store
dist/
```

Проверь, что Git видит файлы:

```
git status
```

Ты должен увидеть `index.js`, `index.test.js` и `.gitignore` в секции **Untracked files**.

---

### Контрольные вопросы по Git

**kind:** `text`

Ответь на вопросы:

1. Что делает команда `git init`?
2. Для чего нужен файл `.gitignore`?
3. Как добавить в ингорируемые определенные файлы, например с расширением `.log`?
4. Как добавить в ингорируемые папку и все его содержимое?
5. Что такое whitelist и blacklist в контексте `.gitignore`?
