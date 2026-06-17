# План реализации: bot_ux_arch_20260616

## Фаза 1: Хранение предыдущего сообщения (А2) [checkpoint: 0992421]

- [x] Task: Добавить `lastBotMessage` в `SessionData` [0edb34e]
    - [x] Добавить поле `lastBotMessage?: SendMessageDescription & { messageId: number }` в тип `SessionData`
    - [x] Тест: `executeResponses` сохраняет полный `SendMessageDescription` + `messageId` в сессию при `sendMessage`
    - [x] Тест: при `sendMessages` сохраняется id последнего сообщения
    - [x] Тест: при `editMessage` lastBotMessage не меняется
    - [x] Реализовать сохранение в `executeResponses()`
- [ ] Task: Conductor — Ручная верификация «Фаза 1»

## Фаза 2: Удаление старых кнопок (А1)

- [ ] Task: Добавить `removePrevKeyboard` в `BotResponse`
    - [ ] Добавить поле `removePrevKeyboard?: boolean` в тип `BotResponse`
    - [ ] Тест: при флаге `removePrevKeyboard` вызывается `editMessageText` с `reply_markup: undefined` и исходным текстом из `lastBotMessage`
    - [ ] Тест: без `lastBotMessage` в сессии — флаг игнорируется (нет предыдущего сообщения)
    - [ ] Тест: с `lastBotMessage` — клавиатура убирается
    - [ ] Реализовать в `executeResponses()`
- [ ] Task: Conductor — Ручная верификация «Фаза 2»

## Фаза 3: Задержка `sendMessages` (А4)

- [ ] Task: Добавить `sendDelayMs` в `BotResponse`
    - [ ] Добавить поле `sendDelayMs?: number` в тип `BotResponse`
    - [ ] Тест: сообщения отправляются с указанной задержкой
    - [ ] Тест: дефолтная задержка = 1000 мс
    - [ ] Тест: `sendDelayMs: 0` — без задержки
    - [ ] Реализовать в `executeResponses()` через `await sleep(delay)`
- [ ] Task: Conductor — Ручная верификация «Фаза 3»

## Фаза 4: Чистка экранирования кнопок (А3)

- [ ] Task: Обновить `assertResponseMarkdownSafe` — исключить текст кнопок из проверки
    - [ ] Тест: валидатор не ругается на неэкранированный текст в кнопках
    - [ ] Тест: валидатор всё ещё проверяет текст сообщения
- [ ] Task: Почистить `escapeMarkdown` в тексте кнопок всех story
    - [ ] `packages/stream/src/ui/bot/stories/catalog.story.ts`
    - [ ] `packages/stream/src/ui/bot/stories/view-stream.story.ts`
    - [ ] `packages/stream/src/ui/bot/stories/learning.story.ts`
    - [ ] `packages/stream/src/ui/bot/stories/progress.story.ts`
    - [ ] `packages/stream/src/ui/bot/stories/monitor.story.ts`
    - [ ] `packages/stream/src/ui/bot/stories/create-stream.story.ts`
    - [ ] `packages/stream/src/ui/bot/stories/activate-stream.story.ts`
    - [ ] `packages/stream/src/ui/bot/stories/enroll.story.ts`
    - [ ] `packages/onboarding/src/ui/bot/controller/onboarding-controller.ts`
    - [ ] Прочие модули при обнаружении
- [ ] Task: Документировать конвенцию: кнопки — всегда plain text, MarkdownV2 только в теле сообщения
- [ ] Task: Conductor — Ручная верификация «Фаза 4»

## Фаза 5: Итоговая проверка и документация

- [ ] Task: Полная проверка качества (`bun run check`)
- [ ] Task: Обновить документацию conductor при необходимости
- [ ] Task: Создать `summary.md` трека
- [ ] Task: Conductor — Ручная верификация «Фаза 5»
