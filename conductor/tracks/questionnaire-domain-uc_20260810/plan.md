# План реализации — Домен и UC слой questionnaire

## Фаза 1: Интерфейс QuestionnaireBotFacade

- [ ] Task: Объявить QuestionnaireBotFacade
    - [ ] Написать тест на тип интерфейса (компиляция)
    - [ ] Создать `packages/questionnaire/src/domain/bot-facade.ts`
    - [ ] Интерфейс: `startQuestionnaire(user: User, response: QuestionnaireActionResponse): Promise<void>`
    - [ ] Экспорт в domain/index.ts
- [ ] Task: Conductor - Ручная верификация 'Фаза 1'

## Фаза 2: Агрегат — проверить поддержку intention+start

- [ ] Task: Проверить/поправить QuestionnaireAr для intention+start цепочки
    - [ ] Проверить что `createIntention` + `start(pool)` работают корректно
    - [ ] Проверить что `getCurrent()` для intention возвращает IntentionResponse
    - [ ] При необходимости — доработать агрегат
    - [ ] Написать/обновить тесты агрегата
    - [ ] `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: UC слой — start-new, create-intention, start

- [ ] Task: Обновить uc-metas.ts
    - [ ] `user: User` для команд, `userId` для query
    - [ ] Типизировать output (не `unknown`)
    - [ ] Меты для всех 8 UC
- [ ] Task: create-intention UC (TDD)
    - [ ] Написать тесты: создаёт intention, возвращает questionnaireId, ошибка если уже есть активная
    - [ ] Реализовать UC
- [ ] Task: start UC (TDD)
    - [ ] Написать тесты: запускает intention анкету с pool, ошибка если не intention
    - [ ] Реализовать UC
- [ ] Task: start-new UC (TDD)
    - [ ] Написать тесты: создаёт и запускает, возвращает QuestionnaireActionResponse
    - [ ] Реализовать UC (переименовать старый start)
- [ ] Task: handle-action UC (TDD)
    - [ ] Обновить тесты: вход `{questionnaireId, type, value}` вместо telegramId
    - [ ] Обновить реализацию
- [ ] Task: abandon UC (TDD)
    - [ ] Обновить тесты: вход `{questionnaireId}` вместо telegramId
    - [ ] Обновить реализацию
- [ ] Task: get-current UC (новый, TDD)
    - [ ] Написать тесты
    - [ ] Реализовать
- [ ] Task: get-questionnaire, get-questionnaires-by-user (обновить)
    - [ ] `userId` вместо telegramId в get-questionnaires-by-user
- [ ] Task: Обновить QuestionnaireApiModule и резолвер
    - [ ] Убрать `questionnaireEngine`
    - [ ] Добавить `botFacade: QuestionnaireBotFacade`
    - [ ] Обновить список UC в модуле
    - [ ] `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 3'

## Фаза 4: Доменный фасад + интеграция

- [ ] Task: QuestionnaireInProcFacade (TDD)
    - [ ] Написать тесты: startNew делегирует в UC + вызывает botFacade
    - [ ] Написать тесты: createIntention делегирует в UC
    - [ ] Написать тесты: start делегирует в UC + вызывает botFacade
    - [ ] Реализовать фасад — чистое делегирование в `this.module.execute(...)`
- [ ] Task: Интеграция с create-api-app.ts
    - [ ] Пробросить `userFacade` в резолвер questionnaire
    - [ ] Замокать `botFacade` на уровне create-api-app (пока нет реализации)
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 4'
