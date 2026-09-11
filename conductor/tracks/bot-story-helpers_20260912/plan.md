# План: Декларативные хелперы ответов стори бота

*Спецификация: [spec.md](./spec.md)*

---

## Фаза 1: Билдеры и делегаты (core)

- [x] Task: Реализовать билдеры ответов в core `9d3522f`
  - [x] Написать падающие unit-тесты `response-builders.test.ts` (все функции: дефолты `isMultiple: false`, kind-уведомления, чистота вызовов)
  - [x] Реализовать `packages/core/src/ui/bot/response-builders.ts`: `screen/ask/warn/note/go/kb/btn/btnUrl`
  - [x] Экспорт из `@u7-scl/core/ui`; ворота `lint/tslint/test` чисто
- [x] Task: Protected-делегаты на `BotUiStory` `0da5d6a`
  - [x] Тесты: делегаты возвращают результат билдеров; `btn` + `cb`-композиция
  - [x] Реализация тонких `protected`-методов (`screen/ask/warn/note/go/kb/btn/btnUrl`)
- [x] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Миграция образцовых стори (courses, streams)

- [x] Task: Мигрировать `course-catalog.story.ts` — эталон каталога (26 литералов); тесты стори зелёные без правок `6965493`
- [x] Task: Мигрировать `view-stream.story.ts` — эталон wizard/`awaitInput`/`delegate`/`release` (21) `c4e416e`
- [x] Task: Мигрировать `stream-catalog`, `inactivity` `8fdfcd2`
- [x] Task: Билдер `notify(text)` — дефолтный тон 🔔 (решение владельца): тесты, реализация, делегат; замена 2 литералов в `view-stream` `ec2b1c1`
- [x] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Миграция mentor + questionnaire

- [x] Task: Мигрировать `create-stream` — самый большой wizard (35 полей, 11 `awaitInput`); локальные kb-хелперы → `kb/btn` `5f507c3`
- [x] Task: Мигрировать `monitor`, `my-streams`, `submenu`, `activate-stream`, `view-stream-mentor` `58d0a27`
- [x] Task: Мигрировать `fill.story`, `invite.story` (wizard + release) `2153442`
- [x] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4: Миграция learning, app/user + core-литералы

- [x] Task: Мигрировать learning-стори: `hub`, `step-view`, `nav-tree`, `progress` `800a2bc`
- [x] Task: Мигрировать `community`, `notify.story` `977d2a5`
- [x] Task: Мигрировать core: `bot-controller.ts` (`#errorScreen`, `unknownCommand` → билдеры; убрать дубль метода со стори), `core/ui-app.ts` (4 литерала) `e435baf`
- [x] Task: Мигрировать app-слой: `app/core/ui-app.ts` (7 литералов), `learning/shared.ts` `4587ca7`
- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)

## Фаза 5: Документация и закрытие

- [ ] Task: Обновить styleguide `bot-ui-story.md` — раздел «Хелперы ответов» (когда хелпер / когда литерал-спред), живой образец — мигрированная стори
- [ ] Task: Закрытие трека — финальный прогон `bun run check`, `summary.md`, обновление `tracks.md`
- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)
