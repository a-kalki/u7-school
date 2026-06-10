# План реализации: Миграция OnboardingController (без UserStory)

## Фаза 1: Тесты на новый интерфейс

- [ ] Task: Написать тесты на handleStart
    - [ ] Тест: возвращает кнопку «Заполнить анкету»
- [ ] Task: Написать тесты на handleCallback
    - [ ] Тест: callback запускает анкету, возвращает captureInput
    - [ ] Тест: callback ответа рендерит следующий вопрос
- [ ] Task: Написать тесты на handleMessage
    - [ ] Тест: текстовое сообщение в активной анкете
    - [ ] Тест: текстовое сообщение без активной анкеты → ошибка
- [ ] Task: Написать тесты на handleCancel
    - [ ] Тест: /cancel вызывает abandon и releaseInput

## Фаза 2: Реализация нового OnboardingController

- [ ] Task: Обновить onboarding-controller.ts
    - [ ] Наследовать `BotController<OnboardingBotAppMeta>`
    - [ ] `name = 'onboarding'`, `stories = []`
    - [ ] Перенести логику `#handleCommand` → `handleCallback`
    - [ ] Перенести логику `#handleAction` → `handleMessage` + `handleCallback`
    - [ ] Заменить `menu: 'onboarding'` на `captureInput`
    - [ ] Заменить `questionnaireCompleted` на `releaseInput`
    - [ ] `handleStart` возвращает кнопку «Заполнить анкету»
    - [ ] `handleCancel` вызывает abandon + releaseInput
- [ ] Task: Обновить тесты под новый интерфейс
    - [ ] Адаптировать существующие тесты: вызов через handleCallback/handleMessage вместо handleUpdate
    - [ ] Проверить captureInput/releaseInput в ответах
    - [ ] Проверить формат callback'ов: префикс 'onboarding:'

## Фаза 3: Верификация

- [ ] Task: Запустить тесты onboarding: `bun run test:p onboarding`
- [ ] Task: Проверить типы: `bun run tslint:p onboarding`
- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)
