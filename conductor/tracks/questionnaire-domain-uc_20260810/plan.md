# План реализации — Домен и UC слой questionnaire

## Фаза 1: Интерфейс QuestionnaireBotFacade

- [ ] Task: Объявить QuestionnaireBotFacade
    - [ ] Создать `packages/questionnaire/src/domain/bot-facade.ts`
    - [ ] Интерфейс: `startQuestionnaire(user: User, response: QuestionnaireActionResponse): Promise<void>`
    - [ ] Экспорт в domain/index.ts
- [ ] Task: Conductor - Ручная верификация 'Фаза 1'

## Фаза 2: UC слой — перепроектирование

- [ ] Task: Обновить uc-metas.ts
    - [ ] `userId` вместо `telegramId`
    - [ ] Типизировать output (не `unknown`)
    - [ ] Добавить меты для `get-current`
- [ ] Task: Реализовать start UC
    - [ ] Вход: `{userId, pool}` — принимает pool напрямую
    - [ ] Создаёт `QuestionnaireAr.startNew(userId, pool)`, сохраняет
    - [ ] Возвращает `QuestionnaireActionResponse`
- [ ] Task: Реализовать handle-action UC
    - [ ] Вход: `{questionnaireId, type, value}` — ищет по questionnaireId
- [ ] Task: Реализовать abandon UC
    - [ ] Вход: `{questionnaireId}`
- [ ] Task: Добавить get-current UC
    - [ ] Вход: `{questionnaireId}` → `ar.getCurrent()`
- [ ] Task: Обновить get-questionnaire и get-questionnaires-by-user (userId)
- [ ] Task: Обновить QuestionnaireApiModule и резолвер
    - [ ] Убрать `questionnaireEngine` из резолвера
    - [ ] Добавить `botFacade: QuestionnaireBotFacade`
- [ ] Task: Написать/обновить тесты UC
    - [ ] `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: Доменный фасад

- [ ] Task: Реализовать QuestionnaireFacade.startQuestionnaire
    - [ ] Принимает `(userId, pool)`
    - [ ] Дёргает UC `start` через `this.module.execute(...)`
    - [ ] Получает `QuestionnaireActionResponse`, вызывает `botFacade.startQuestionnaire(user, response)`
- [ ] Task: Написать тесты на фасад
- [ ] Task: Интеграция с create-api-app.ts
    - [ ] Пробросить `botFacade` в резолвер questionnaire
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 3'
