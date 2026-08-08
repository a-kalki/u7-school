# План реализации — Трек 8: Зачистка и обновление документации

---

## Фаза 1: Удаление старого кода

- [x] Task: Удалить UI-директории доменных пакетов
    - [x] `packages/stream/src/ui/` — целиком
    - [x] `packages/course/src/ui/` — целиком (уже отсутствовала)
    - [x] `packages/onboarding/src/ui/` — целиком
    - [x] `packages/app/src/ui/` — целиком
    - [x] `packages/app/src/domain/u7-bot-app-meta.ts` (уже отсутствовал)

- [x] Task: Обновить `package.json` exports
    - [x] `packages/stream/package.json` — убрать UI-экспорты
    - [x] `packages/course/package.json` — убрать UI-экспорты
    - [x] `packages/onboarding/package.json` — убрать UI-экспорты (не было)
    - [x] `packages/app/package.json` — убрать `u7-bot-app-meta` экспорт (уже чист)

- [x] Task: Проверить отсутствие битых импортов
    - [x] `bun run tslint` — нет ошибок
    - [x] `grep -r "packages/stream/src/ui" --include="*.ts"` — пусто
    - [x] `grep -r "packages/course/src/ui" --include="*.ts"` — пусто

- [ ] Task: Conductor - User Manual Verification 'Удаление старого кода' (Protocol in workflow.md)

---

## Фаза 2: Обновление документации

- [ ] Task: Обновить `code_styleguides/architecture.md`
    - [ ] Убрать `ui/` из структуры доменных модулей

- [ ] Task: Обновить `code_styleguides/skills/bot-controller.md`
    - [ ] Описать новую иерархию контроллеров
    - [ ] Добавить `UiApp`, `publicActions`

- [ ] Task: Обновить `code_styleguides/skills/bot-user-story.md`
    - [ ] Обновить пути к стори
    - [ ] Добавить `uiApp.getAction<T>(name)`

- [ ] Task: Обновить `conductor/index.md`
    - [ ] Проверить и обновить все ссылки на перенесённые файлы

- [ ] Task: Обновить `packages/core/src/ui/bot/README.md`
    - [ ] Актуализировать правила навигации

- [ ] Task: Разделить `ui-spec.md` на 4 файла
    - [ ] `apps/u7-bot/src/controllers/courses/ui-spec.md`
    - [ ] `apps/u7-bot/src/controllers/streams/ui-spec.md`
    - [ ] `apps/u7-bot/src/learning/ui-spec.md`
    - [ ] `apps/u7-bot/src/mentor/ui-spec.md`
    - [ ] Удалить старый `packages/stream/src/ui/bot/ui-spec.md`

- [ ] Task: Создать `apps/u7-bot/README.md`
    - [ ] Описать структуру приложения, контроллеры, соглашения

- [ ] Task: Conductor - User Manual Verification 'Обновление документации' (Protocol in workflow.md)

---

## Фаза 3: Финальная проверка

- [ ] Task: Прогнать `bun run check`
    - [ ] `biome check` — чисто
    - [ ] `tsc --noEmit` — чисто
    - [ ] `bun test` — все тесты проходят

- [ ] Task: Проверить отсутствие циклических зависимостей
    - [ ] `tsc --noEmit` не выдаёт циклов
    - [ ] Визуальная проверка графа импортов

- [ ] Task: Обновить `conductor/tracks.md`
    - [ ] Отметить Трек 8 как выполненный
    - [ ] Переместить Релиз 1 в архив

- [ ] Task: Создать `summary.md` в `conductor/tracks/bot-ui-refactoring/` (если нет)
    - [ ] Итоговый отчёт по всему рефакторингу

- [ ] Task: Conductor - User Manual Verification 'Финальная проверка' (Protocol in workflow.md)
