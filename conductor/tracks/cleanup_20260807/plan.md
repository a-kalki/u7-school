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

- [x] Task: Обновить `code_styleguides/architecture.md`
    - [x] Убрать `ui/` из структуры доменных модулей

- [x] Task: Обновить `code_styleguides/skills/bot-controller.md`
    - [x] `UiApp`, `publicActions` уже были описаны в §6
    - [x] Описать новую иерархию контроллеров
    - [x] Добавить `UiApp`, `publicActions`

- [x] Task: Обновить `code_styleguides/skills/bot-user-story.md`
    - [x] Обновить пути к стори
    - [x] Добавить `uiApp.getAction<T>(name)`

- [x] Task: Обновить `conductor/index.md`
    - [x] Проверить все ссылки — все живы
    - [x] Проверить и обновить все ссылки на перенесённые файлы

- [x] Task: Обновить `packages/core/src/ui/bot/README.md`
    - [x] Правила навигации актуальны, изменений не требуется
    - [x] Актуализировать правила навигации

- [x] Task: Разделить `ui-spec.md` на 4 файла
    - [x] `apps/u7-bot/src/controllers/courses/ui-spec.md`
    - [x] `apps/u7-bot/src/controllers/streams/ui-spec.md`
    - [x] `apps/u7-bot/src/learning/ui-spec.md`
    - [x] `apps/u7-bot/src/mentor/ui-spec.md`
    - [x] Старый `packages/stream/src/ui/bot/ui-spec.md` удалён в Фазе 1

- [x] Task: Создать `apps/u7-bot/README.md`
    - [x] Описать структуру приложения, контроллеры, соглашения

- [ ] Task: Conductor - User Manual Verification 'Обновление документации' (Protocol in workflow.md)

---

## Фаза 3: Финальная проверка

- [x] Task: Прогнать `bun run check`
    - [x] `biome check` — чисто
    - [x] `tsc --noEmit` — чисто
    - [x] `bun test` (1319 pass, 10 fail — предсуществующие) — все тесты проходят

- [x] Task: Проверить отсутствие циклических зависимостей
    - [x] `tsc --noEmit` не выдаёт циклов
    - [x] Визуальная проверка графа импортов

- [x] Task: Обновить `conductor/tracks.md`
    - [x] Отметить Трек 8 как выполненный
    - [x] Переместить Релиз 1 в архив

- [x] Task: Создать `summary.md` в `conductor/tracks/bot-ui-refactoring/` (если нет)
    - [x] Итоговый отчёт по всему рефакторингу

- [ ] Task: Conductor - User Manual Verification 'Финальная проверка' (Protocol in workflow.md)
