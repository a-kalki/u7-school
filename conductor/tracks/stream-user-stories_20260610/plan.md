# План реализации: Миграция StreamController на BotUserStory

## Фаза 1: Подготовка — StreamAppMeta

- [x] Task: Определить StreamAppMeta в domain/module.ts `8435acd`
    - [x] Union тип: StreamApiModuleMeta | UserApiModuleMeta
    - [x] name: 'stream-bot'
- [x] Task: Написать тест на StreamAppMeta (компиляция типов) `8435acd`

## Фаза 2: CatalogStory и ViewStreamStory (US-1, US-2)

- [x] Task: Создать catalog.story.ts `bc444f0`
- [x] Task: Создать view-stream.story.ts `bc444f0`
- [x] Task: Написать тесты на catalog и view-stream `bc444f0`

## Фаза 3: EnrollStory и LearningStory (US-3, US-4)

- [x] Task: Создать enroll.story.ts `92fa9b2`
- [x] Task: Создать learning.story.ts `92fa9b2`
- [x] Task: Написать тесты на enroll и learning `92fa9b2`

## Фаза 4: ProgressStory (US-5)

- [x] Task: Создать progress.story.ts `0b9800f`
- [x] Task: Написать тесты на progress `0b9800f`

## Фаза 5: CreateStreamStory (US-6, wizard)

- [x] Task: Создать create-stream.story.ts `576b612`
- [x] Task: Написать тесты на create-stream `576b612`

## Фаза 6: ActivateStreamStory и MonitorStory (US-7, US-8)

- [x] Task: Создать activate-stream.story.ts `cdc5c09`
- [x] Task: Создать monitor.story.ts `cdc5c09`
- [x] Task: Написать тесты на activate-stream и monitor `cdc5c09`

## Фаза 7: Переработка StreamController

- [x] Task: Переписать stream-controller.ts как реестр `1c4328a`
- [x] Task: Обновить stream-controller.test.ts под новую структуру `1c4328a`

## Фаза 8: Интеграция и проверка

- [x] Task: Все тесты stream проходят (124 pass)
- [x] Task: Типы чистые (`bun run tslint:p stream`)
