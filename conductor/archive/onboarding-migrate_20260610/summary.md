# Итоговый отчёт: Миграция OnboardingController (без UserStory)

## Цель
Адаптировать `OnboardingController` под новый `BotController<TAppMeta, TActor>` без разбиения на UserStory (процесс небольшой).

## Выполненные задачи

### Фаза 1: Тесты
- Написаны тесты на `handleStart`, `handleCallback`, `handleMessage`, `handleCancel`
- Проверены captureInput/releaseInput, формат callback'ов `onboarding:<action>`

### Фаза 2: Реализация
- `OnboardingController` наследует `BotController<OnboardingBotAppMeta, OnboardingActor>`
- Убран `handleUpdate`, логика распределена по специализированным обработчикам
- Внедрён `captureInput`/`releaseInput` вместо `menu: 'onboarding'`
- `handleStart` возвращает кнопку «📝 Заполнить анкету» с priority 50
- Callback-формат: `onboarding:start_questionnaire`, `onboarding:answer:<code>`, `onboarding:next:<code>`
- `messageId` для editMessage достаётся из `session.activeHandler.context`
- Все 19 старых тестов адаптированы, добавлено 9 новых

### Фаза 3: Верификация
- Тесты onboarding: 70 pass, 0 fail
- Типы: чисто
- Линтер: чисто
- Тесты core: 145 pass, 0 fail
- Тесты stream: 124 pass, 0 fail

## Изменённые файлы
- `packages/onboarding/src/ui/bot/controller/onboarding-controller.ts` — полная переработка
- `packages/onboarding/src/ui/bot/controller/onboarding-controller.test.ts` — адаптация + новые тесты

## Архитектурные решения
- **Без UserStory**: логика вшита в контроллер, т.к. процесс анкеты — один бизнес-сценарий
- **Actor-интерфейс**: `OnboardingActor { uuid, telegramId }` — минимальный контракт
- **messageId из сессии**: контроллер читает `session.activeHandler.context.messageId` для editMessage
- **callback-префиксы**: `answer:<code>` стрипится контроллером, `next:<code>` передаётся в UC как есть
