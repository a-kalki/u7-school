# План реализации: Унификация обработки ошибок и логирования в bot-слое

## Фаза 1: Core — логгер и общие методы в BotUserStory

- [x] Task: Добавить поле `logger` в `BotUserStory` `[7c99e6a]`
  - [x] Получить логгер из `this.appApi.logger`
  - [x] Типизировать как `Logger` из `@u7-scl/core/shared`

- [x] Task: Проанализировать и перенести `handleError` из U7BotUserStory в BotUserStory
  - [x] Проверить, что метод `handleError` не зависит от специфики app-модуля
  - [x] Перенести общую логику в core
  - [x] Оставить специфичные для app переопределения в U7BotUserStory

- [ ] Task: Conductor - Ручная верификация 'Core — логгер и общие методы'

## Фаза 2: U7BotUserStory — замена console.error на логгер

- [x] Task: Написать тест: handleError логирует internal/unauthorized/default `[7c99e6a]`
  - [x] Тест: internal ошибка → вызов logger.error
  - [x] Тест: unauthorized ошибка → вызов logger.error
  - [x] Тест: default (неизвестный kind) → вызов logger.error

- [x] Task: Написать тест: handleError НЕ логирует validation/not-found/conflict/access-denied/bad-request `[7c99e6a]`
  - [x] Тест: validation → нет вызова logger.error, ошибка показана пользователю
  - [x] Тест: остальные «нормальные» ошибки → нет вызова logger.error

- [x] Task: Реализовать логирование в handleError через this.logger `[7c99e6a]`
  - [x] Заменить `console.error` на `this.logger.error('bot', 'Ошибка в story', serializeError(err))`
  - [x] Добавить логирование для `default` случая (неизвестный kind)
  - [x] Убедиться, что validation/not-found/conflict/access-denied/bad-request не логируются

- [ ] Task: Conductor - Ручная верификация 'Замена console.error на логгер'

## Фаза 3: Проверка перехвата ошибок на уровне контроллера

- [x] Task: Проверить bot-controller на перехват необработанных ошибок story `[7c99e6a]`
  - [x] Найти файл контроллера (bot-router / bot-controller)
  - [x] Проверить, есть ли try/catch вокруг вызова story
  - [x] Проверить, вызывается ли handleError для пойманных ошибок
  - Результат: контроллер НЕ перехватывает; ошибки уходят в глобальный middleware main.ts

- [x] Task: Добавить спец-метод обработки ошибок в `core:BotController` `[a4830ea]`
  - [x] Добавить try/catch вокруг вызовов story в handleCallback и handleMessage
  - [x] Добавить logger в BotController (через getGlobalLogger)
  - [x] Улучшить handleError с fromError()

- [ ] Task: Conductor - Ручная верификация 'Перехват ошибок контроллером'

## Фаза 4: Аудит и исправление story-файлов

- [x] Task: Аудит базовых классов core (только документирование) `[27ce12e]`
  - [x] Проверить `BotUserStory` — все ли места используют унифицированный подход
  - [x] Проверить `ApiModule.dispatch()` — логирует ли ошибки, есть ли ad-hoc try/catch
  - [x] Проверить `BaseUc` / `UseCase` — какие ошибки пробрасываются, есть ли подавления
  - [x] Зафиксировать результаты в `conductor/tracks/err_handling_logging_20260616/audit-core.md`

- [x] Task: Аудит story в packages/stream/src/ui/bot/stories/
  - [x] Проверить на ad-hoc обработку ошибок → заменить на handleError
  - [x] Убрать лишние try/catch (если контроллер перехватывает)
  - [ ] Оставить try/catch только где нужна специфичная реакция на ошибку

- [x] Task: Аудит story в packages/course/src/ui/bot/stories/
  - [x] Проверить на ad-hoc обработку ошибок → заменить на handleError
  - [ ] Убрать лишние try/catch

- [x] Task: Аудит story в packages/user/src/ui/bot/stories/
  - [x] Проверить на ad-hoc обработку ошибок → заменить на handleError
  - [ ] Убрать лишние try/catch

- [x] Task: Аудит story в packages/onboarding/src/ui/bot/stories/
  - [x] Проверить на ad-hoc обработку ошибок → заменить на handleError
  - [ ] Убрать лишние try/catch

- [x] Task: Аудит story в packages/app/src/ui/stories/
  - [x] Проверить на ad-hoc обработку ошибок → заменить на handleError
  - [ ] Убрать лишние try/catch

- [ ] Task: Conductor - Ручная верификация 'Аудит story-файлов'

## Фаза 5: Тесты на handleError (по здравому смыслу)

- [x] Task: Написать представительный тест: validation ошибка показывает поля пользователю
  - [x] Выбрано: u7-bot-user-story.test.ts
  - [x] Проверить, что текст ошибки валидации попадает в ответ пользователю

- [x] Task: Написать представительный тест: internal/default ошибка не раскрывает деталей
  - [x] Проверить, что пользователь видит общее сообщение, а не stack trace

- [x] Task: Запустить полный набор тестов и проверить покрытие
  - [x] Все 893 теста проходят на изменённом коде

- [ ] Task: Conductor - Ручная верификация 'Тесты handleError'

## Фаза 6: Документация в conductor

- [x] Task: Создать/обновить styleguide по обработке ошибок в story `[42fc4f8]`
  - [x] Когда нужен try/catch, когда нет
  - [x] Как использовать handleError
  - [x] Правила логирования (что логируем, что нет)

- [x] Task: Создать/обновить styleguide по обработке ошибок в controller `[42fc4f8]`
  - [x] Перехват на верхнем уровне
  - [x] Спец-метод для обработки (если добавлен)

- [x] Task: Обновление E2E-тестирования не требуется

- [ ] Task: Conductor - Ручная верификация 'Документация'
