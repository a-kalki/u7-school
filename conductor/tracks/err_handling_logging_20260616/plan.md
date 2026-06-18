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

- [ ] Task: Написать тест: handleError логирует internal/unauthorized/default
  - [ ] Тест: internal ошибка → вызов logger.error
  - [ ] Тест: unauthorized ошибка → вызов logger.error
  - [ ] Тест: default (неизвестный kind) → вызов logger.error

- [ ] Task: Написать тест: handleError НЕ логирует validation/not-found/conflict/access-denied/bad-request
  - [ ] Тест: validation → нет вызова logger.error, ошибка показана пользователю
  - [ ] Тест: остальные «нормальные» ошибки → нет вызова logger.error

- [ ] Task: Реализовать логирование в handleError через this.logger
  - [ ] Заменить `console.error` на `this.logger.error('bot', 'Ошибка в story', serializeError(err))`
  - [ ] Добавить логирование для `default` случая (неизвестный kind)
  - [ ] Убедиться, что validation/not-found/conflict/access-denied/bad-request не логируются

- [ ] Task: Conductor - Ручная верификация 'Замена console.error на логгер'

## Фаза 3: Проверка перехвата ошибок на уровне контроллера

- [ ] Task: Проверить bot-controller на перехват необработанных ошибок story
  - [ ] Найти файл контроллера (bot-router / bot-controller)
  - [ ] Проверить, есть ли try/catch вокруг вызова story
  - [ ] Проверить, вызывается ли handleError для пойманных ошибок

- [ ] Task: При необходимости — добавить спец-метод обработки ошибок в `core:BotController`
  - [ ] Если контроллер использует ad-hoc обработку — унифицировать
  - [ ] Вынести спец-метод в класс `BotController` (core)

- [ ] Task: Conductor - Ручная верификация 'Перехват ошибок контроллером'

## Фаза 4: Аудит и исправление story-файлов

- [ ] Task: Аудит базовых классов core (только документирование)
  - [ ] Проверить `BotUserStory` — все ли места используют унифицированный подход
  - [ ] Проверить `ApiModule.dispatch()` — логирует ли ошибки, есть ли ad-hoc try/catch
  - [ ] Проверить `BaseUc` / `UseCase` — какие ошибки пробрасываются, есть ли подавления
  - [ ] Зафиксировать результаты в `conductor/tracks/err_handling_logging_20260616/audit-core.md`

- [ ] Task: Аудит story в packages/stream/src/ui/bot/stories/
  - [ ] Проверить на ad-hoc обработку ошибок → заменить на handleError
  - [ ] Убрать лишние try/catch (если контроллер перехватывает)
  - [ ] Оставить try/catch только где нужна специфичная реакция на ошибку

- [ ] Task: Аудит story в packages/course/src/ui/bot/stories/
  - [ ] Проверить на ad-hoc обработку ошибок → заменить на handleError
  - [ ] Убрать лишние try/catch

- [ ] Task: Аудит story в packages/user/src/ui/bot/stories/
  - [ ] Проверить на ad-hoc обработку ошибок → заменить на handleError
  - [ ] Убрать лишние try/catch

- [ ] Task: Аудит story в packages/onboarding/src/ui/bot/stories/
  - [ ] Проверить на ad-hoc обработку ошибок → заменить на handleError
  - [ ] Убрать лишние try/catch

- [ ] Task: Аудит story в packages/app/src/ui/stories/
  - [ ] Проверить на ad-hoc обработку ошибок → заменить на handleError
  - [ ] Убрать лишние try/catch

- [ ] Task: Conductor - Ручная верификация 'Аудит story-файлов'

## Фаза 5: Тесты на handleError (по здравому смыслу)

- [ ] Task: Написать представительный тест: validation ошибка показывает поля пользователю
  - [ ] Выбрать 1–2代表性的 story
  - [ ] Проверить, что текст ошибки валидации попадает в ответ пользователю

- [ ] Task: Написать представительный тест: internal/default ошибка не раскрывает деталей
  - [ ] Проверить, что пользователь видит общее сообщение, а не stack trace

- [ ] Task: Запустить полный набор тестов и проверить покрытие
  - [ ] `bun test --coverage`, цель >80% на изменённом коде

- [ ] Task: Conductor - Ручная верификация 'Тесты handleError'

## Фаза 6: Документация в conductor

- [ ] Task: Создать/обновить styleguide по обработке ошибок в story
  - [ ] Когда нужен try/catch, когда нет
  - [ ] Как использовать handleError
  - [ ] Правила логирования (что логируем, что нет)

- [ ] Task: Создать/обновить styleguide по обработке ошибок в controller
  - [ ] Перехват на верхнем уровне
  - [ ] Спец-метод для обработки (если добавлен)

- [ ] Task: При необходимости — обновить styleguide по E2E-тестированию ошибок

- [ ] Task: Conductor - Ручная верификация 'Документация'
