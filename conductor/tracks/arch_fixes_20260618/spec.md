# Спецификация: Архитектурные и доменные правки

## Обзор
Три связанные проблемы в пакетах `course`, `stream` и `app`:

1. **Дублирование `ContentSnapshot`** — определён в `course/domain/types.ts` (TS-интерфейс) и `stream/domain/stream/entity.ts` (valibot-схема). `course` должен быть единственным источником истины, включая valibot-схемы, вынесенные в отдельный файл.
2. **Обработка ошибок в `CreateStreamStory.#handleConfirm`** — ad-hoc: не различает типы ошибок, всегда пишет «Ошибка валидации», ищет несуществующее поле `details`, не логирует внутренние ошибки. Нужен универсальный `handleError` в `U7BotUserStory`.
3. **`studentId` в cb-data кнопки «Выполнено»** — избыточен, студент определяется через `actor.uuid`.

## Функциональные требования

### FR1: ContentSnapshot в отдельном файле course
- Создать `course/domain/content-snapshot.ts` с:
  - `ContentSnapshotItem` (TS-интерфейс)
  - `ContentSnapshot` (TS-тип)
  - `ContentSnapshotItemSchema`, `LessonSnapshotSchema` (valibot-схемы)
  - `ContentSnapshotSchema` (valibot-схема)
- `course/domain/types.ts` удаляет определения `ContentSnapshotItem` и `ContentSnapshot`
- `course/domain/index.ts` экспортирует всё из `content-snapshot.ts`
- `stream/domain/stream/entity.ts` удаляет собственные `ContentSnapshotSchema`, `ProjectSnapshotSchema`, `LessonSnapshotSchema`, импортирует из `@u7-scl/course/domain`
- Все импорты `ContentSnapshot` в `stream` обновлены

### FR2: Универсальный обработчик ошибок в U7BotUserStory
- Добавить `protected handleError(err: unknown): BotResponse` в `U7BotUserStory`
- Метод использует `fromError()` из `@u7-scl/core/domain` для разбора `AppException`
- По `error.kind`:
  - `validation` → сообщение с перечислением полей из `payload.issues`
  - `not-found`, `conflict`, `access-denied`, `bad-request` → сообщение ошибки
  - `internal`, `unauthorized` → логирование через `serializeError()` + общее сообщение
- `CreateStreamStory.#handleConfirm` вызывает `this.handleError(err)` вместо текущей ad-hoc логики

### FR3: Убрать studentId из cb-data «Выполнено»
- Формат: `complete:<studentId>:<streamId>:<stepId>` → `complete:<streamId>:<stepId>`
- `#handleComplete` получает студента через `get-student-by-user` по `actor.uuid`
- Сверяет `student.streamId === streamId` из callback
- `CompleteStepCmd` и `CompleteStepUc` не меняются

## Нефункциональные требования
- `bun run check` проходит без ошибок
- Все существующие тесты проходят
- Новые тесты на:
  - `ContentSnapshotSchema` в course
  - `handleError` в U7BotUserStory
  - Обработку ошибок в CreateStreamStory
  - Новый формат cb-data в LearningStory
- Покрытие >80%

## Критерии приёмки
- `ContentSnapshot` определён только в `course/domain/content-snapshot.ts`
- `stream` не имеет собственного определения `ContentSnapshot`
- Ошибка валидации при создании потока показывает конкретные поля
- Внутренняя ошибка логируется и показывает общее сообщение
- Кнопка «Выполнено» работает без `studentId` в cb-data
- `#handleComplete` находит студента по `actor.uuid`

## За рамками
- Базовый класс `WizardStory`
- Кнопка «↩️ Назад»
- Изменения в других модулях (onboarding, user)
