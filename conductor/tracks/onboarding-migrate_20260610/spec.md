# Спецификация: Миграция OnboardingController (без UserStory)

## Обзор
`OnboardingController` обслуживает один бизнес-процесс (анкета), поэтому разбиение на UserStory не требуется. Нужно адаптировать его под новый `BotController<TAppMeta>`: реализовать `handleCallback`, `handleMessage`, `handleStart`, и перевести управление состоянием анкеты с `menu: 'onboarding'` на `captureInput`.

## Функциональные требования

### FR-1: Адаптация под BotController
- Наследует `BotController<OnboardingBotAppMeta>`
- `name = 'onboarding'`
- `stories = []` (пустой массив)

### FR-2: handleStart
- Возвращает кнопку «📝 Заполнить анкету» для всех ролей
- `priority = 50` (ниже stream-кнопок)

### FR-3: handleCallback
- Принимает callback от кнопки «Заполнить анкету» — запускает анкету
- Принимает callback'и ответов на вопросы анкеты
- Формат callback: `onboarding:<action>` (например, `onboarding:answer:code`)
- Рендеринг вопросов и клавиатур — как в текущей реализации

### FR-4: handleMessage
- Когда анкета активна (через captureInput): обрабатывает текстовые ответы
- Когда не активна: «Неизвестное сообщение»

### FR-5: captureInput вместо menu
- При входе в анкету: `captureInput: { path: 'onboarding:questionnaire', ttlSeconds: 600 }`
- При завершении или /cancel: `releaseInput: true`
- Удалить проверки `ctx.session.menu === 'onboarding'`

### FR-6: handleCancel
- Прерывает анкету через `api.execute('abandon', ...)`
- Возвращает `releaseInput: true`

## Нефункциональные требования
- Существующие тесты `onboarding-controller.test.ts` должны проходить
- Типизация: `OnboardingBotAppMeta` уже существует в `packages/onboarding/src/ui/bot/app.ts`

## Критерии приёмки
1. `OnboardingController` реализует новый интерфейс `BotController`
2. Кнопка «Заполнить анкету» появляется в `/start`
3. Анкета работает через captureInput/releaseInput
4. `/cancel` прерывает анкету и сбрасывает сессию
5. Все существующие тесты проходят

## За рамками
- Изменения в доменной логике анкеты (Questionnaire, QuestionPool)
- Разбиение на UserStory (признано избыточным для одного бизнес-процесса)
