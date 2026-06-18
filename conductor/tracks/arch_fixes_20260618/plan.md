# План реализации: arch_fixes_20260618

## Фаза 1: Унификация ContentSnapshot в отдельном файле
- [x] Task: Создать course/domain/content-snapshot.ts `3bf006d`
    - [x] Перенести `ContentSnapshotItem`, `ContentSnapshot` из types.ts
    - [x] Добавить valibot-схемы: `LessonSnapshotSchema`, `ContentSnapshotItemSchema`, `ContentSnapshotSchema`
- [ ] Task: Обновить course/domain/types.ts и index.ts
    - [ ] Удалить `ContentSnapshotItem`, `ContentSnapshot` из types.ts
    - [ ] Добавить экспорт из content-snapshot.ts в index.ts
- [ ] Task: Обновить stream для импорта ContentSnapshot из course
    - [ ] Удалить `ContentSnapshotSchema`, `ProjectSnapshotSchema`, `LessonSnapshotSchema` из `stream/domain/stream/entity.ts`
    - [ ] Импортировать `ContentSnapshot`, `ContentSnapshotSchema` из `@u7-scl/course/domain`
    - [ ] Обновить `stream/domain/index.ts`
- [ ] Task: Обновить внутренние импорты в stream
    - [ ] `stream-ds.ts`, `a-root.ts`, `a-root.test.ts`, `entity.test.ts`, `stream-ds.test.ts`
    - [ ] `progress.story.ts` — обновить импорт
- [ ] Task: Проверить типы и тесты
    - [ ] `bun run check:p course && bun run check:p stream`
- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Универсальный обработчик ошибок в U7BotUserStory
- [ ] Task: Написать тесты на handleError в U7BotUserStory
    - [ ] Тест: validation error → сообщение с полями
    - [ ] Тест: not-found/conflict/access-denied → сообщение ошибки
    - [ ] Тест: internal error → лог + общее сообщение
- [ ] Task: Добавить handleError в U7BotUserStory
    - [ ] Импортировать `fromError` из `@u7-scl/core/domain`
    - [ ] Импортировать `serializeError` из `@u7-scl/core/shared`
    - [ ] Реализовать `handleError(err: unknown): BotResponse`
- [ ] Task: Обновить #handleConfirm в CreateStreamStory
    - [ ] Заменить ad-hoc catch на `this.handleError(err)`
- [ ] Task: Проверить типы и тесты
    - [ ] `bun run check:p app && bun run check:p stream`
- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Убрать studentId из cb-data «Выполнено»
- [ ] Task: Написать тесты на новый формат cb-data
    - [ ] Тест: `this.cb('complete', streamId, stepId)` — без studentId
    - [ ] Тест: #handleComplete разбирает `complete:<streamId>:<stepId>`
    - [ ] Тест: #handleComplete получает студента по actor.uuid
    - [ ] Тест: #handleComplete сверяет streamId
- [ ] Task: Обновить #buildStepKeyboard в LearningStory
    - [ ] Изменить `this.cb('complete', student.uuid, streamId, stepId)` → `this.cb('complete', streamId, stepId)`
- [ ] Task: Обновить #handleComplete в LearningStory
    - [ ] Разбирать два параметра: streamId, stepId
    - [ ] Вызывать `get-student-by-user` по `actor.uuid`
    - [ ] Сверять `student.streamId === streamId`
    - [ ] Вызывать `complete-step` с `studentId: student.uuid`
- [ ] Task: Обновить интеграционные тесты
    - [ ] `learning.integration.test.ts` — обновить cb-data
- [ ] Task: Проверить типы и тесты
    - [ ] `bun run check:p stream`
- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)
