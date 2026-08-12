# План реализации — BotTransport: единый слой Grammy ↔ UiApp

## Фаза 1: UiApp — убрать сжатие, добавить actorResolver

- [ ] Task: Убрать сжатие из UiApp (core)
    - [ ] Удалить shortIds, #shrink, #expandCallbackData, #hasStaleIds, #compressAction, compressResponse, prefixResponse
    - [ ] Обновить публичные методы: handleCallback, handleMessage, handleCancel, handleTimeout — убрать вызовы compressResponse/prefixResponse
    - [ ] handleWelcome, handleHelp — убрать compressResponse
    - [ ] `bun run check` — чисто (часть тестов упадёт — ок, починим в Фазе 3)
- [ ] Task: Добавить actorResolver в UiApp
    - [ ] `init(apiApp, actorResolver: (tgId: number) => Promise<TActor>)`
    - [ ] handleCallback(data, tgId, session) — резолвит актора внутри
    - [ ] handleMessage(update, tgId, session) — аналогично
    - [ ] handleCancel(tgId, session) — аналогично
    - [ ] handleWelcome(tgId) / handleHelp(tgId) — аналогично
    - [ ] U7BotUiApp: init передаёт резолвер (userFacade.getByTgId)
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 1'

## Фаза 2: BotTransport — новый класс

- [ ] Task: Создать BotTransport (TDD)
    - [ ] Тест: execute — sendMessage с клавиатурой
    - [ ] Тест: execute — editMessage
    - [ ] Тест: execute — sendMessages (несколько)
    - [ ] Тест: execute — captureInput/releaseInput в сессии
    - [ ] Тест: execute — удаление клавиатуры (keepPrevKeyboard)
    - [ ] Тест: execute — lastBotMessage сохраняется
    - [ ] Тест: сжатие/разжатие UUID (compressResponse + prefixResponse)
    - [ ] Тест: handleCallback — полный путь ctx → uiApp → execute
    - [ ] Тест: handleMessage — полный путь ctx → uiApp → execute
    - [ ] Тест: send() — упреждающая отправка + сессия
    - [ ] Реализовать BotTransport
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: Удаление старого кода, обновление main.ts и фасадов

- [ ] Task: Удалить connect-ui-app.ts и ui-utils.ts
    - [ ] Удалить файлы
    - [ ] Обновить main.ts: создать BotTransport, зарегистрировать на Grammy
    - [ ] Обновить main.ts: убрать sessionMap из createBot
    - [ ] Обновить bot.ts: убрать параметр sessionMap
    - [ ] `bun run check` — чисто
- [ ] Task: Обновить фасады и стори
    - [ ] questionnaire-bot-facade.ts: uiApp.send() → transport.send()
    - [ ] fill.story.ts: коды кнопок без префикса контроллера (prefixResponse в BotTransport)
    - [ ] create-ui-app.ts: убрать передачу sessionMap, упростить
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 3'

## Фаза 4: Адаптация тестов

- [ ] Task: Обновить тесты UiApp (core)
    - [ ] Адаптировать handleCallback/handleMessage/handleCancel тесты — передавать tgId
    - [ ] Убрать тесты сжатия (переехали в BotTransport)
    - [ ] `bun run check` — чисто
- [ ] Task: Обновить тесты приложения
    - [ ] Обновить моки в story-тестах (actor → tgId где затронуто)
    - [ ] Обновить интеграционные/E2E тесты
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 4'
