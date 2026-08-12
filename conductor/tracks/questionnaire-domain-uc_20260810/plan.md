# План реализации — Домен и UC слой questionnaire

> **Связанные документы:** [development-roadmap.md](../../development-roadmap.md) (Релиз 3), [metrics-system.md](../../metrics-system.md), [bot-ui-refactoring.md](../../bot-ui-refactoring.md) (Трек 7 — заглушка onboarding)

## Фаза 1: Интерфейс QuestionnaireBotFacade

- [x] Task: Объявить QuestionnaireBotFacade (TDD) `7c675fb`

## Фаза 2: QuestionnairePool + агрегат

- [x] Task: Создать `QuestionnairePool` тип и валидацию
- [x] Task: `intention` → `invited`, `IntentionResponse` → `InviteResponse`
- [x] Task: `static create(respondentId, pool: QuestionnairePool)` (TDD)
- [x] Task: `createInvite()` → InviteResponse с inviteText, howToFill (TDD)
- [x] Task: `decline()` — invited → abandoned (TDD)
- [x] Task: `start()` без параметров (TDD)
- [x] Task: `getQuestionnaireActionResponse()` (TDD)
- [x] Task: Удалить старые методы
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: UC слой — 9 UC через TDD

- [x] Task: Обновить uc-metas.ts
- [x] Task: Путь A — send-invite UC (TDD)
- [x] Task: Путь A — start UC (TDD)
- [x] Task: Путь B — start-by-invite UC (TDD)
- [x] Task: Путь B — decline-invite UC (TDD)
- [x] Task: Путь B — handle-action UC (TDD)
- [x] Task: abandon, get-current, get-questionnaire, get-questionnaires-by-user (TDD)
- [x] Task: Обновить QuestionnaireApiModule и резолвер
- [ ] Task: Conductor - Ручная верификация 'Фаза 3'

## Фаза 4: Доменный фасад + интеграция

- [x] Task: QuestionnaireInProcFacade (TDD)
- [x] Task: Интеграция с create-api-app.ts
- [ ] Task: Conductor - Ручная верификация 'Фаза 4'
