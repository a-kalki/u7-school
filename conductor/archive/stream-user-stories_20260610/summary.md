# Итоговый отчёт: Миграция StreamController на BotUserStory

## Цель трека
Разбить монолитный `StreamController` (11 handler-методов) на 8 классов `BotUserStory` (US-1...US-8), превратив контроллер в тонкий реестр.

## Выполненные задачи

### Фаза 1: StreamAppMeta
- Создан тип `StreamAppMeta` — объединение `StreamApiModuleMeta | UserApiModuleMeta` с `name: 'stream-bot'`
- Написан компиляционный тест

### Фаза 2: CatalogStory и ViewStreamStory (US-1, US-2)
- **CatalogStory** (`catalog.story.ts`): `handleCallback('list')` — витрина потоков, `handleStart` — кнопка «📚 Потоки курсов»
- **ViewStreamStory** (`view-stream.story.ts`): `handleCallback('view:<id>')` — карточка потока, кнопка «Записаться» для enrollment

### Фаза 3: EnrollStory и LearningStory (US-3, US-4)
- **EnrollStory** (`enroll.story.ts`): `handleCallback('enroll:<id>')` — зачисление + delegate на learning
- **LearningStory** (`learning.story.ts`): `handleCallback('my-study')` — текущий шаг, `handleCallback('complete:...')` — завершение шага, `handleStart` — только STUDENT

### Фаза 4: ProgressStory (US-5)
- **ProgressStory** (`progress.story.ts`): `handleCallback('progress:<id>')` — прогресс-бар и проценты

### Фаза 5: CreateStreamStory (US-6, wizard)
- **CreateStreamStory** (`create-stream.story.ts`): пошаговый wizard с `captureInput` (модуль → название → описание → дата → группа), `handleCancel`/`handleTimeout`, `handleStart` — только MENTOR/ADMIN

### Фаза 6: ActivateStreamStory и MonitorStory (US-7, US-8)
- **ActivateStreamStory** (`activate-stream.story.ts`): `handleCallback('activate:<id>')` — запуск потока
- **MonitorStory** (`monitor.story.ts`): `handleCallback('students:<id>')` — список студентов с прогрессом

### Фаза 7: Переработка StreamController
- `StreamController` переписан как тонкий реестр: наследует `BotController<StreamAppMeta>`, содержит 8 стори в `stories`
- Делегирование: `handleCallback` — по префиксу, `handleMessage` — активной стори, `handleStart` — агрегация от стори

### Фаза 8: Интеграция
- 124 теста проходят, типы чистые

## Созданные/изменённые файлы
- `packages/stream/src/domain/module.ts` — добавлен StreamAppMeta
- `packages/stream/src/domain/index.ts` — экспорт module.ts
- `packages/stream/src/domain/stream-app-meta.test.ts`
- `packages/stream/src/ui/bot/stories/catalog.story.ts` + тест
- `packages/stream/src/ui/bot/stories/view-stream.story.ts` + тест
- `packages/stream/src/ui/bot/stories/enroll.story.ts` + тест
- `packages/stream/src/ui/bot/stories/learning.story.ts` + тест
- `packages/stream/src/ui/bot/stories/progress.story.ts` + тест
- `packages/stream/src/ui/bot/stories/create-stream.story.ts` + тест
- `packages/stream/src/ui/bot/stories/activate-stream.story.ts` + тест
- `packages/stream/src/ui/bot/stories/monitor.story.ts` + тест
- `packages/stream/src/ui/bot/controller/stream-controller.ts` — переписан как реестр
- `packages/stream/src/ui/bot/controller/stream-controller.test.ts` — обновлён под новое API

## Архитектурные решения
- **TActor = unknown** в стори, с приведением к `{ uuid, roles }` при необходимости — сохраняет гибкость без лишних ограничений
- **Кросс-стори колбэки** генерируются вручную (например, `view-stream:view:<uuid>`), а не через `this.cb()` — позволяет стори ссылаться друг на друга
- **handleStart возвращает `this.cb(action)`** — префикс стори оборачивается префиксом контроллера для правильной маршрутизации
- **Wizard использует captureInput с контекстом** — состояние шага хранится в `SessionData.activeHandler.context`

## Отклонения от плана
- Существующие тесты `stream-controller.test.ts` полностью переписаны (не адаптированы), так как старый `handleUpdate` удалён
- Контроллер больше не принимает `StreamApiModule` в конструкторе — API передаётся через `init()`

## Известные ограничения
- Wizard выбора модуля пока не интегрирован с CourseFacade (заглушка)
- Роли актора проверяются через упрощённый интерфейс `{ uuid, roles }`, а не через типобезопасный User
