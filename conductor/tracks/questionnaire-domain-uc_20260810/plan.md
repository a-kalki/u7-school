# План реализации — Домен и UC слой questionnaire

## Фаза 1: Интерфейс QuestionnaireBotFacade

- [ ] Task: Объявить QuestionnaireBotFacade (TDD)
    - [ ] Написать тест на тип интерфейса
    - [ ] Создать `packages/questionnaire/src/domain/bot-facade.ts`
    - [ ] `sendQuestionnaireInvite(user: User, response: InviteResponse)`
    - [ ] `startQuestionnaire(user: User, response: QuestionnaireActionResponse)`
    - [ ] Экспорт в domain/index.ts
- [ ] Task: Conductor - Ручная верификация 'Фаза 1'

## Фаза 2: QuestionnairePool + агрегат

- [ ] Task: Создать `QuestionnairePool` тип и валидацию
    - [ ] Добавить в `question.ts`: `QuestionnairePoolSchema`, `QuestionnairePool`
    - [ ] Поля: inviteText, howToFill?, completionText?, cancelWarning?, questions
    - [ ] Написать тесты валидации
- [ ] Task: `intention` → `invited`, `IntentionResponse` → `InviteResponse`
    - [ ] entity.ts: статус, types.ts: тип ответа, поле inviteText/howToFill
- [ ] Task: `static create(respondentId, pool: QuestionnairePool)` (TDD)
    - [ ] Тест: статус invited, pool сохранён целиком (не только questions)
    - [ ] Реализовать
- [ ] Task: `createInvite()` → InviteResponse с inviteText, howToFill (TDD)
    - [ ] Тест: возвращает InviteResponse с inviteText из pool
    - [ ] Реализовать
- [ ] Task: `decline()` — invited → abandoned (TDD)
    - [ ] Тест: invited → abandoned, событие QuestionnaireDeclined
    - [ ] Тест: ошибка если не invited
    - [ ] Реализовать
- [ ] Task: `start()` без параметров (TDD)
    - [ ] Тест: invited → in_progress, engine из pool.questions
    - [ ] Реализовать
- [ ] Task: Удалить старые методы
    - [ ] `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: UC слой — 9 UC через TDD

- [ ] Task: Обновить uc-metas.ts
    - [ ] `user: User` для команд, `userId` для query, типизировать output
    - [ ] 9 UC (добавлен decline-invite)
- [ ] Task: Путь A — send-invite UC (TDD)
    - [ ] Тест: Ar.create → save → createInvite → botFacade.sendQuestionnaireInvite
    - [ ] Реализация
- [ ] Task: Путь A — start UC (TDD)
    - [ ] Тест: Ar.create → ar.start() → save → botFacade.startQuestionnaire
    - [ ] Реализация
- [ ] Task: Путь B — start-by-invite UC (TDD)
    - [ ] Тест: load → ar.start() → save → return response (botFacade НЕ вызван)
    - [ ] Реализация
- [ ] Task: Путь B — decline-invite UC (TDD)
    - [ ] Тест: load → ar.decline() → save → return cancelWarning
    - [ ] Реализация
- [ ] Task: Путь B — handle-action UC (TDD)
    - [ ] Тест: `{questionnaireId, type, value}`, return response, botFacade НЕ вызван
    - [ ] Реализация
- [ ] Task: abandon, get-current, get-questionnaire, get-questionnaires-by-user (TDD)
- [ ] Task: Обновить QuestionnaireApiModule и резолвер
    - [ ] Убрать `questionnaireEngine`, добавить `botFacade`
    - [ ] `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 3'

## Фаза 4: Доменный фасад + интеграция

- [ ] Task: QuestionnaireInProcFacade (TDD)
    - [ ] Тест: sendInvite(user, pool) → module.execute('send-invite', ...)
    - [ ] Тест: start(user, pool) → module.execute('start', ...)
    - [ ] Реализация — только делегирование
- [ ] Task: Интеграция с create-api-app.ts
    - [ ] Замокать botFacade, пробросить в резолвер
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 4'
