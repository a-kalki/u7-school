# План реализации — Домен и UC слой questionnaire

## Фаза 1: Интерфейс QuestionnaireBotFacade

- [ ] Task: Объявить QuestionnaireBotFacade (TDD)
    - [ ] Написать тест на тип интерфейса
    - [ ] Создать `packages/questionnaire/src/domain/bot-facade.ts`
    - [ ] `sendQuestionnaireInvite(user: User, response: InviteResponse)`
    - [ ] `startQuestionnaire(user: User, response: QuestionnaireActionResponse)`
    - [ ] Экспорт в domain/index.ts
- [ ] Task: Conductor - Ручная верификация 'Фаза 1'

## Фаза 2: Агрегат — переработка API

- [ ] Task: `intention` → `invited`, `IntentionResponse` → `InviteResponse`
    - [ ] entity.ts: QuestionnaireStatusSchema, types.ts: InviteResponse
    - [ ] Обновить все ссылки в агрегате и тестах
- [ ] Task: `static create(respondentId, pool)` (TDD)
    - [ ] Тест: статус invited, pool сохранён
    - [ ] Реализовать
- [ ] Task: `createInvite()` → InviteResponse (TDD)
    - [ ] Тест: invited → InviteResponse, другие статусы → ошибка
    - [ ] Реализовать
- [ ] Task: `start()` без параметров (TDD)
    - [ ] Тест: invited → in_progress, engine из pool, первый вопрос
    - [ ] Тест: ошибка если не invited
    - [ ] Реализовать
- [ ] Task: Удалить старые методы
    - [ ] Удалить `createIntention`, `start(pool)` с параметром
    - [ ] `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: UC слой — 8 UC через TDD

- [ ] Task: Обновить uc-metas.ts
    - [ ] `user: User` для команд, `userId` для query, типизировать output
- [ ] Task: Путь A — send-invite UC (TDD)
    - [ ] Тест: Ar.create → save → createInvite → botFacade.sendQuestionnaireInvite
    - [ ] Реализация
- [ ] Task: Путь A — start UC (TDD)
    - [ ] Тест: Ar.create → ar.start() → save → botFacade.startQuestionnaire
    - [ ] Реализация
- [ ] Task: Путь B — start-by-invite UC (TDD)
    - [ ] Тест: load → ar.start() → save → return response, botFacade НЕ вызван
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
