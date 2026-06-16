# Итоговый отчёт: Stream Guest & Student (US-1..US-5)

**Цель:** доработать сторис «Витрина», «Карточка», «Запись», «Обучение» и «Прогресс» до полного соответствия `user-stories.md`.

## Выполненные задачи

### US-1: Фильтр статусов в CatalogStory
- CatalogStory делает два запроса `list-streams` с фильтрами `enrollment` и `active`
- Результаты объединяются и дедуплицируются по `uuid`
- Завершённые и архивные потоки не отображаются

### US-2: Ролевые кнопки в ViewStreamStory
- GUEST/CANDIDATE на enrollment: «Записаться», «Программа курса», «Назад к списку»
- GUEST/CANDIDATE на active: «Уведомить о наборе», «Назад к списку»
- STUDENT/MENTOR: кнопка «Записаться» скрыта
- Имя ментора отображается через `this.appApi.execute('get-user', ...)`
- Кнопка «Программа курса» показывает сжатый `contentSnapshot`

### US-3: Дата старта в EnrollStory
- В сообщение о записи добавлена дата старта в формате `дд.мм.гггг`

### US-4: Названия уроков/проектов в LearningStory
- При переходе на новый урок: «Урок «{Old}» завершён. Начинаем: «{New}»!»
- При переходе на новый проект: «Проект «{Old}» завершён. Начинаем: «{New}»!»
- Названия извлекаются из `contentSnapshot`

### US-5: Полные данные в ProgressStory
- Добавлены: имя ментора (через `appApi.get-user`), дата старта, ссылка на чат
- Текущий проект и урок из `contentSnapshot` по `currentStepId`

## Рефакторинг (по итогам ревью)

- Убран дублирующий `GetUserUc` из stream — используется `appApi.execute('get-user')`
- Убран локальный `interface Actor` — везде `User` из `@u7-scl/app/domain`
- Убраны все `as unknown as` — вызовы `execute()` строго типизированы
- `escapeMarkdown` и `formatDate` перенесены в `BotUserStory` (core)
- Callback data — деструктуризация `const [cmd, id] = action.split(':')`
- Проверки ролей через `UserPolicy` и `StreamPolicy` вместо ручных `roles.includes()`
- `init()` с двумя аргументами: `init(moduleApi, appApi)`

## Созданные/изменённые файлы

- `packages/stream/src/ui/bot/stories/catalog.story.ts` (+/-)
- `packages/stream/src/ui/bot/stories/view-stream.story.ts` (переписан)
- `packages/stream/src/ui/bot/stories/enroll.story.ts` (+/-)
- `packages/stream/src/ui/bot/stories/learning.story.ts` (+/-)
- `packages/stream/src/ui/bot/stories/progress.story.ts` (+/-)
- `packages/stream/src/ui/bot/stories/monitor.story.ts` (+/-)
- `packages/stream/src/ui/bot/stories/activate-stream.story.ts` (+/-)
- `packages/stream/src/ui/bot/stories/create-stream.story.ts` (+/-)
- `packages/stream/src/ui/bot/controller/stream-controller.test.ts` (+/-)
- Все тесты соответствующих сторис обновлены
- `packages/core/src/ui/bot/bot-user-story.ts` (+`escapeMarkdown`, +`formatDate`)
- `conductor/code_styleguides/skills/bot-user-story.md` (создан)

## Решения

- **Не создавать UC-прокси в stream для вызова user-фасада** — использовать `this.appApi.execute('get-user', ...)`
- **Policy-объекты для проверки прав** — `UserPolicy`, `StreamPolicy` вместо ручных проверок
- **Protected-методы в BotUserStory** — `escapeMarkdown`, `formatDate` не дублируются

## Ограничения
- Push-рассылка студентам при активации потока не реализована (трек Stream UX Backlog)
- Сообщение ментору при активации: «задания выданы», а не «доставлены» (честно отражает push/pull модель)
