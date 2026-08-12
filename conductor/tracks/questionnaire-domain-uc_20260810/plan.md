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

- [ ] Task: Переименовать `intention` → `invited`, `IntentionResponse` → `InviteResponse`
    - [ ] Обновить QuestionnaireStatusSchema в entity.ts
    - [ ] Обновить InviteResponse в types.ts
    - [ ] Обновить все ссылки в агрегате и тестах
- [ ] Task: `static create(respondentId, pool)` — фабрика с pool
    - [ ] Написать тесты: создаёт агрегат, статус invited, pool сохранён
    - [ ] Реализовать: сохраняет pool сразу, не создаёт engine
- [ ] Task: `createInvite()` — возвращает InviteResponse
    - [ ] Написать тесты: для invited возвращает InviteResponse, для других статусов — ошибка
    - [ ] Реализовать
- [ ] Task: `start()` — без параметров, использует сохранённый pool
    - [ ] Написать тесты: invited → in_progress, engine из pool, первый вопрос
    - [ ] Написать тесты: ошибка если не invited
    - [ ] Реализовать
- [ ] Task: Удалить старые методы
    - [ ] Удалить `static createIntention`
    - [ ] Удалить `start(pool)` с параметром
    - [ ] `startNew` оставить как хелпер (create + start)
- [ ] Task: `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: UC слой — 8 UC через TDD

- [ ] Task: Обновить uc-metas.ts
    - [ ] `user: User` для команд, `userId` для query
    - [ ] Типизировать output
    - [ ] Меты для всех 8 UC
- [ ] Task: create-invite UC (TDD)
    - [ ] Тест: Ar.create → сохранить → botFacade.sendQuestionnaireInvite вызван
    - [ ] Реализация
- [ ] Task: start-new UC (TDD)
    - [ ] Тест: Ar.create + ar.start → сохранить → botFacade.startQuestionnaire вызван
    - [ ] Реализация
- [ ] Task: start UC (TDD)
    - [ ] Тест: загрузить ar → ar.start → сохранить → botFacade.startQuestionnaire вызван
    - [ ] Тест: ошибка если не invited
    - [ ] Реализация
- [ ] Task: handle-action UC (TDD)
    - [ ] Тест: вход `{questionnaireId, type, value}`, НЕ вызывает botFacade
    - [ ] Реализация
- [ ] Task: abandon UC (TDD)
    - [ ] Тест: вход `{questionnaireId}`
    - [ ] Реализация
- [ ] Task: get-current UC (TDD)
    - [ ] Тест: возвращает текущее состояние
    - [ ] Реализация
- [ ] Task: get-questionnaire, get-questionnaires-by-user (обновить userId)
- [ ] Task: Обновить QuestionnaireApiModule и резолвер
    - [ ] Убрать `questionnaireEngine`
    - [ ] Добавить `botFacade: QuestionnaireBotFacade`
    - [ ] Зарегистрировать все 8 UC
    - [ ] `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 3'

## Фаза 4: Доменный фасад + интеграция

- [ ] Task: QuestionnaireInProcFacade (TDD)
    - [ ] Тест: createInvite → module.execute('create-invite', ...)
    - [ ] Тест: startNew → module.execute('start-new', ...)
    - [ ] Тест: start → module.execute('start', ...)
    - [ ] Реализация — только делегирование
- [ ] Task: Интеграция с create-api-app.ts
    - [ ] Замокать `botFacade` (пока нет реализации)
    - [ ] Пробросить в резолвер questionnaire
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 4'
