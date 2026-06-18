# План реализации: arch_fixes_20260618

## Фаза 1: Унификация ContentSnapshot в отдельном файле [checkpoint: 7772036]
- [x] Task: Создать course/domain/content-snapshot.ts `3bf006d`
    - [x] Перенести `ContentSnapshotItem`, `ContentSnapshot` из types.ts
    - [x] Добавить valibot-схемы: `LessonSnapshotSchema`, `ContentSnapshotItemSchema`, `ContentSnapshotSchema`
- [x] Task: Обновить course/domain/types.ts и index.ts `96d2235`
    - [x] Удалить `ContentSnapshotItem`, `ContentSnapshot` из types.ts
    - [x] Добавить экспорт из content-snapshot.ts в index.ts
- [x] Task: Обновить stream для импорта ContentSnapshot из course `36eefc1`
    - [x] Удалить `ContentSnapshotSchema`, `ProjectSnapshotSchema`, `LessonSnapshotSchema` из `stream/domain/stream/entity.ts`
    - [x] Импортировать `ContentSnapshot`, `ContentSnapshotSchema` из `@u7-scl/course/domain`
    - [x] Обновить `stream/domain/index.ts`
- [x] Task: Обновить внутренние импорты в stream `36eefc1`
    - [x] `stream-ds.ts`, `a-root.ts`, `a-root.test.ts`, `entity.test.ts`, `stream-ds.test.ts`
    - [x] `progress.story.ts` — обновить импорт
- [x] Task: Проверить типы и тесты `9293a52`
    - [x] `bun run check:p course && bun run check:p stream`
- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Универсальный обработчик ошибок в U7BotUserStory
- [x] Task: Написать тесты на handleError в U7BotUserStory `b01739b`
    - [x] Тест: validation error → сообщение с полями
    - [x] Тест: not-found/conflict/access-denied → сообщение ошибки
    - [x] Тест: internal error → лог + общее сообщение
- [x] Task: Добавить handleError в U7BotUserStory `b01739b`
    - [x] Импортировать `fromError` из `@u7-scl/core/domain`
    - [x] Импортировать `serializeError` из `@u7-scl/core/shared`
    - [x] Реализовать `handleError(err: unknown): BotResponse`
- [x] Task: Обновить #handleConfirm в CreateStreamStory `fa4e1d2`
    - [x] Заменить ad-hoc catch на `this.handleError(err)`
- [~] Task: Проверить типы и тесты
    - [~] `bun run check:p app && bun run check:p stream`
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
