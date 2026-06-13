# Спецификация: Миграция StreamController на BotUserStory

## Обзор
Модуль `stream` содержит 8 пользовательских сценариев (US-1...US-8, см. `packages/stream/src/user-stories.md`). Текущий `StreamController` — монолитный класс с 11 handler-методами. Нужно разбить его на 8 классов `BotUserStory`, каждый в своём файле. Контроллер становится тонким реестром.

## Функциональные требования

### FR-1: Структура стори
Каждая стори — отдельный файл в `packages/stream/src/ui/bot/stories/`:
- `catalog.story.ts` — US-1: список потоков, кнопка «Наши потоки»
- `view-stream.story.ts` — US-2: карточка потока, кнопка «Записаться»
- `enroll.story.ts` — US-3: запись на поток (+ делегирование в learning)
- `learning.story.ts` — US-4: текущий шаг, кнопка «Выполнено», кнопка «Моя учёба»
- `progress.story.ts` — US-5: прогресс студента
- `create-stream.story.ts` — US-6: пошаговый wizard создания потока (captureInput)
- `activate-stream.story.ts` — US-7: запуск потока ментором
- `monitor.story.ts` — US-8: список студентов с прогрессом

### FR-2: Каждая стори
- Наследует `BotUserStory<StreamAppMeta>`
- Имеет уникальное `name` (catalog, view-stream, enroll, learning, progress, create-stream, activate-stream, monitor)
- Реализует `handleCallback` для своих callback'ов
- Реализует `handleStart` — возвращает `MainMenuAction` если хочет кнопку в меню
- При необходимости: `handleMessage` (для wizard), `handleCancel`, `handleTimeout`

### FR-3: StreamController как реестр
- `name = 'stream'`
- `stories = [catalog, viewStream, enroll, learning, progress, createStream, activateStream, monitor]`
- `handleStart` агрегирует кнопки от стори с учётом ролей
- `handleCallback` форвардит стори по префиксу
- `handleMessage` форвардит активной стори (из session.activeHandler)

### FR-4: Кнопки главного меню
- «📚 Наши потоки» — всегда (catalog story)
- «📖 Моя учёба» — только STUDENT (learning story)
- «🛠️ Панель ментора» — только MENTOR/ADMIN (create-stream, activate-stream, monitor stories)

### FR-5: US-6 wizard (captureInput)
- Шаг 1: выбор модуля
- Шаг 2: название потока (текст)
- Шаг 3: описание (текст)
- Шаг 4: дата старта (текст)
- Шаг 5: ссылка на Telegram-группу (текст)
- Между шагами используется `captureInput` с контекстом
- На последнем шаге — `releaseInput`

## Нефункциональные требования
- Существующие тесты `stream-controller.test.ts` должны проходить с новым кодом
- `StreamAppMeta` — новый тип, объединяющий `StreamApiModuleMeta` и `UserApiModuleMeta`
- Имена callback: `stream:<story>:<action>:<params>`

## Критерии приёмки
1. Все 8 стори созданы и компилируются
2. `StreamController` — тонкий реестр, без бизнес-логики рендеринга
3. Все существующие тесты проходят
4. `/start` показывает правильные кнопки в зависимости от роли
5. US-6 wizard работает с captureInput/releaseInput

## За рамками
- Изменения в доменном слое stream
- Новые пользовательские сценарии сверх US-1...US-8
