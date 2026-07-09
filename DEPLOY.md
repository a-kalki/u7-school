# Релиз 1 «Фундамент» — инструкция по деплою

**Дата:** 2026-07-09
**Версия:** Первый релиз архитектурной эволюции Stream
**Документ-источник:** `conductor/architecture-evolution.md`

---

## Что было сделано

Релиз 1 включает **четыре трека**, реализованных на backend-уровне (без поставки UI):

### Трек A: Роль AUTHOR
- Добавлена новая роль `AUTHOR` — создаёт программу обучения (модули, курсы, уроки, шаги).
- `MENTOR` теперь только преподаёт (создаёт/ведёт потоки, мониторит студентов).
- Пользователь может иметь несколько ролей одновременно.
- **Нур уже имеет роль AUTHOR** в `users.json`.

### Трек 0: Агрегат Course
- Новый доменный агрегат `Course`: объединяет модули в последовательность с этапами и направлениями (tech/business).
- Создан курс «Fullstack JS» с этапом «Основы JS» (модули «Синтаксис» и «Алгоритмика»).
- Новый файл данных: `data/courses/courses.json`.
- UC: `create-course`, `list-courses`, `get-course`, `add-module-to-course`.

### Трек 1: Жизненный цикл студента
- Статусы студента: `enrolled` → `active` → `abandoned` | `advanced` | `not_advanced`.
- **Старые статусы `dropped` и `expelled` заменены на `abandoned`** с полем `abandonDetails`.
- Добавлены финальные статусы `advanced`/`not_advanced` с `completionDetails`.
- Роль `STUDENT` теперь динамическая: выдаётся при зачислении, снимается при завершении/отчислении.
- `User.nick` — новое опциональное поле (для прямых сообщений).
- `TgFacade` — новый порт для отправки сообщений из UC.
- Confirm-паттерн — формализованный UI-паттерн подтверждения действий.

### Трек 2: ContentPath
- Новый value object `ContentPath` с форматом `A:B:C:D` (module:project:lesson:step).
- UC `resolve-content-path` с ролевым доступом (curious/student/mentor).
- `CourseDs` — domain service для навигации по контенту.

---

## Что нужно для миграции

### 1. Миграция статусов студентов ⚠️ КРИТИЧНО

Старые статусы `dropped` и `expelled` больше не поддерживаются. Без миграции бот упадёт при попытке прочитать таких студентов.

**Команда:**
```bash
cd /srv/u7-school
bun run scripts/migrate-student-statuses.ts --prod
```

**Что делает скрипт:**
- `dropped` → `abandoned` + `abandonDetails: { who: 'self', cause: 'voluntary' }`
- `expelled` → `abandoned` + `abandonDetails: { who: 'mentor', cause: 'by_mentor' }`
- Остальные статусы (`enrolled`, `active`, `advanced`, `not_advanced`) не трогает.
- Создаёт бэкап в `data/migrations/students-backup-<timestamp>.json`.
- **Идемпотентен** — повторный запуск безопасен.

### 2. Инициализация курса ⚠️ НЕОБХОДИМО

Новый файл `data/courses/courses.json` должен существовать. Без него бот упадёт при любом обращении к курсам.

**Команда:**
```bash
cd /srv/u7-school
bun run scripts/init-course.ts
```

**Что делает скрипт:**
- Создаёт `data/courses/courses.json` с курсом «Fullstack JS».
- Проверяет, что модули «Синтаксис» и «Алгоритмика» существуют в `modules.json`.
- **Идемпотентен** — если курс уже есть, ничего не делает.

### 3. Проверка данных (рекомендуется)

Убедись, что все нужные файлы на месте и имеют правильную структуру:

```bash
cd /srv/u7-school

# Проверка наличия всех файлов данных
echo "=== Проверка файлов ==="
for f in \
  data/users/users.json \
  data/streams/streams.json \
  data/streams/students.json \
  data/courses/courses.json \
  data/courses/modules.json \
  data/courses/lessons.json \
  data/courses/steps.json \
  data/questionnaires/questionnaires.json
do
  if [ -f "$f" ]; then
    echo "✅ $f"
  else
    echo "❌ $f — ОТСУТСТВУЕТ!"
  fi
done

# Проверка статусов студентов (не должно быть dropped/expelled)
echo ""
echo "=== Проверка статусов студентов ==="
bun -e "
const s = await Bun.file('data/streams/students.json').json();
const bad = s.filter(x => x.status === 'dropped' || x.status === 'expelled');
if (bad.length > 0) {
  console.log('❌ Найдены старые статусы (' + bad.length + '):');
  bad.forEach(x => console.log('  - ' + x.uuid + ': ' + x.status));
  process.exit(1);
} else {
  console.log('✅ Все статусы актуальны (нет dropped/expelled)');
}
"

# Проверка курса
echo ""
echo "=== Проверка курса ==="
bun -e "
const c = await Bun.file('data/courses/courses.json').json();
if (c.length > 0) {
  console.log('✅ Курсов в системе: ' + c.length);
  c.forEach(x => console.log('  - ' + x.title + ' (' + x.uuid + ')'));
} else {
  console.log('❌ Нет ни одного курса!');
  process.exit(1);
}
"
```

---

## Порядок деплоя

```bash
# 1. Зайти на сервер
ssh kalki_server

# 2. Перейти в директорию проекта
cd /srv/u7-school

# 3. Получить актуальный код
git pull

# 4. Установить зависимости (если изменились)
bun install

# 5. Миграция статусов студентов (КРИТИЧНО — ДО запуска бота!)
bun run scripts/migrate-student-statuses.ts --prod

# 6. Инициализация курса (КРИТИЧНО — ДО запуска бота!)
bun run scripts/init-course.ts

# 7. Проверить данные
# (выполнить проверки из раздела «Проверка данных» выше)

# 8. Собрать проект
bun run build

# 9. Перезапустить бота
# (команда зависит от process manager: pm2, systemd, etc.)
# Например:
pm2 restart u7-bot
# или
systemctl restart u7-bot
```

---

## Новые файлы данных (структура)

После миграции структура `data/` должна выглядеть так:

```
data/
├── users/
│   ├── users.json          # пользователи (добавлена роль AUTHOR у Нура)
│   └── seed.json           # сиды новых пользователей
├── streams/
│   ├── streams.json        # потоки (без изменений)
│   └── students.json       # студенты (статусы мигрированы: нет dropped/expelled)
├── courses/
│   ├── courses.json        # NEW: агрегаты курсов
│   ├── modules.json        # модули (без изменений)
│   ├── lessons.json        # уроки (без изменений)
│   └── steps.json          # шаги (без изменений)
├── questionnaires/
│   └── questionnaires.json # анкеты (без изменений)
└── migrations/
    └── students-backup-*.json  # бэкапы миграций
```

---

## Возможные проблемы

### 1. Бот падает с ошибкой валидации StudentSchema
**Причина:** не выполнили миграцию статусов.
**Решение:** запустить `bun run scripts/migrate-student-statuses.ts --prod`.

### 2. Ошибка «курс не найден»
**Причина:** не создан `courses.json`.
**Решение:** запустить `bun run scripts/init-course.ts`.

### 3. Модули из курса не резолвятся
**Причина:** UUID модулей в `courses.json` не совпадают с реальными в `modules.json`.
**Проверка:** скрипт `init-course.ts` выводит результат проверки модулей при создании.

---

## Откат

Если что-то пошло не так:

```bash
# Восстановить студентов из бэкапа
cp data/migrations/students-backup-<timestamp>.json data/streams/students.json

# Удалить курс (если проблема в нём)
rm data/courses/courses.json

# Откатить код
git checkout <предыдущий-коммит>
```
