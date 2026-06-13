# План реализации: Миграция OnboardingController (без UserStory)

## Фаза 1: Тесты на новый интерфейс

- [x] Task: Написать тесты на handleStart
    - [x] Тест: возвращает кнопку «Заполнить анкету»
- [x] Task: Написать тесты на handleCallback
    - [x] Тест: callback запускает анкету, возвращает captureInput
    - [x] Тест: callback ответа рендерит следующий вопрос
- [x] Task: Написать тесты на handleMessage
    - [x] Тест: текстовое сообщение в активной анкете
    - [x] Тест: текстовое сообщение без активной анкеты → ошибка
- [x] Task: Написать тесты на handleCancel
    - [x] Тест: /cancel вызывает abandon и releaseInput

## Фаза 2: Реализация нового OnboardingController

- [x] Task: Обновить onboarding-controller.ts `a93b187`
    - [x] Наследовать `BotController<OnboardingBotAppMeta>`
    - [x] `name = 'onboarding'`, `stories = []`
    - [x] Перенести логику `#handleCommand` → `handleCallback`
    - [x] Перенести логику `#handleAction` → `handleMessage` + `handleCallback`
    - [x] Заменить `menu: 'onboarding'` на `captureInput`
    - [x] Заменить `questionnaireCompleted` на `releaseInput`
    - [x] `handleStart` возвращает кнопку «Заполнить анкету»
    - [x] `handleCancel` вызывает abandon + releaseInput
- [x] Task: Обновить тесты под новый интерфейс `a93b187`
    - [x] Адаптировать существующие тесты: вызов через handleCallback/handleMessage вместо handleUpdate
    - [x] Проверить captureInput/releaseInput в ответах
    - [x] Проверить формат callback'ов: префикс 'onboarding:'

## Фаза 3: Верификация

- [~] Task: Запустить тесты onboarding: `bun run test:p onboarding`
- [~] Task: Проверить типы: `bun run tslint:p onboarding`
- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)
