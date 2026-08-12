# План реализации — Домен и UC слой questionnaire

## Фаза 1: Интерфейс QuestionnaireBotFacade

- [ ] Task: Объявить QuestionnaireBotFacade (TDD)
    - [ ] Написать тест на тип интерфейса (компиляция)
    - [ ] Создать `packages/questionnaire/src/domain/bot-facade.ts`
    - [ ] `sendQuestionnaireInvite(user: User, response: InviteResponse): Promise<void>`
    - [ ] `startQuestionnaire(user: User, response: QuestionnaireActionResponse): Promise<void>`
    - [ ] Экспорт в domain/index.ts
- [ ] Task: Conductor - Ручная верификация 'Фаза 1'

## Фаза 2: Агрегат — переработка API

- [ ] Task: `intention` → `invited`, `IntentionResponse` → `InviteResponse`
    - [ ] Обновить QuestionnaireStatusSchema в entity.ts
    - [ ] Обновить InviteResponse в types.ts
    - [ ] Обновить все ссылки в агрегате
- [ ] Task: `static create(respondentId, pool)` — фабрика с pool (TDD)
    - [ ] Тест: создаёт агрегат, статус invited, pool сохранён
    - [ ] Реализовать
- [ ] Task: `createInvite()` → InviteResponse (TDD)
    - [ ] Тест: для invited возвращает InviteResponse, для других — ошибка
    - [ ] Реализовать
- [ ] Task: `start()` — без параметров, использует сохранённый pool (TDD)
    - [ ] Тест: invited → in_progress, engine из pool, первый вопрос
    - [ ] Тест: ошибка если не invited
    - [ ] Реализовать
- [ ] Task: Почистить старые методы
    - [ ] Удалить `createIntention`, `start(pool)` с параметром
    - [ ] Обновить `startNew` (create + start)
    - [ ] `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: UC слой — 8 UC через TDD

- [ ] Task: Обновить uc-metas.ts
    - [ ] `user: User` для команд, `userId` для query
    - [ ] Типизировать output
    - [ ] Меты для всех 8 UC
- [ ] Task: Путь A — send-invite UC (TDD)
    - [ ] Тест: Ar.create → save → createInvite → botFacade.sendQuestionnaireInvite вызван
    - [ ] Реализация
- [ ] Task: Путь A — start UC (TDD)
    - [ ] Тест: Ar.create → ar.start() → save → botFacade.startQuestionnaire вызван
    - [ ] Реализация
- [ ] Task: Путь B — start-by-invite UC (TDD)
    - [ ] Тест: загрузить → ar.start() → save → return response (botFacade НЕ вызван)
    - [ ] Тест: ошибка если не invited
    - [ ] Реализация
- [ ] Task: Путь B — handle-action UC (TDD)
    - [ ] Тест: `{questionnaireId, type, value}`, return response (botFacade НЕ вызван)
    - [ ] Реализация
- [ ] Task: Путь B — abandon UC (TDD)
    - [ ] Тест: `{questionnaireId}`
    - [ ] Реализация
- [ ] Task: get-current, get-questionnaire, get-questionnaires-by-user (TDD)
- [ ] Task: Обновить QuestionnaireApiModule и резолвер
    - [ ] Убрать `questionnaireEngine`, добавить `botFacade`
    - [ ] Зарегистрировать все 8 UC
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
