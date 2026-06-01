# План реализации: stream_domain_20260526

## Фаза 0: Создание модуля @u7-scl/stream [checkpoint: 20e7fb5]

- [x] Task: Создать структуру пакета (a6cbad3)
    - [ ] `packages/stream/package.json` — имя, версия, зависимости (@u7-scl/core, valibot), exports/imports
    - [ ] `packages/stream/tsconfig.json` — конфигурация TypeScript
    - [ ] `packages/stream/src/` — корневая структура директорий
    - [ ] `packages/stream/src/index.ts` — заглушка экспорта
    - [ ] `packages/stream/src/domain/` — директория доменного слоя

- [x] Task: Conductor - User Manual Verification 'Создание модуля' (Protocol in workflow.md) (20e7fb5)

---

## Фаза 1: Фундамент — типы, статусы, схемы [checkpoint: b3acdc7]

- [x] Task: Написать тесты для StreamStatus и базовых типов (35882f0)
    - [x] Тест: StreamStatus содержит все значения (enrollment, active, completed, archived)
    - [x] Тест: StreamStatusSchema валидирует корректные значения
    - [x] Тест: StreamStatusSchema отклоняет некорректные значения

- [x] Task: Реализовать StreamStatus и базовые типы (35882f0) (9446297)
    - [x] `status.ts` — enum StreamStatus + Valibot picklist
    - [x] `types.ts` — StreamId, StreamStudentId, StepRecordStatus, StreamListFilter ({ status?: StreamStatus, mentorId?: string })

- [x] Task: Написать тесты для Valibot-схем (17ba57a)
    - [x] Тест: ContentSnapshotSchema валидирует корректный снимок (проекты→уроки→stepIds)
    - [x] Тест: StreamSchema валидирует полный объект потока
    - [x] Тест: StreamSchema отклоняет объект без обязательных полей

- [x] Task: Реализовать Valibot-схемы Entity (17ba57a)
    - [x] `stream/entity.ts` — StreamSchema, ContentSnapshotSchema, StreamArMeta
    - [x] `domain/index.ts` — публичный экспорт

- [x] Task: Conductor - User Manual Verification 'Фундамент' (Protocol in workflow.md) (b3acdc7)

---

## Фаза 2: Агрегат StreamAr [checkpoint: 86513e4]

- [x] Task: Написать тесты для StreamAr.create (9054756)
    - [x] Тест: создаёт поток с корректными полями, статусом enrollment и опциональным telegramGroupId
    - [x] Тест: contentSnapshot сохраняется корректно
    - [x] Тест: поля-снимки (goal, result и др.) копируются
    - [x] Тест: activate() переводит поток из enrollment в active
    - [x] Тест: activate() из некорректных статусов выбрасывает ошибку
    - [x] Тест: complete() переводит поток в completed
    - [x] Тест: archive() переводит поток в archived

- [x] Task: Реализовать StreamAr.create и методы статусов (9054756)
    - [x] `stream/a-root.ts` — класс StreamAr extends Aggregate, static create
    - [x] `stream/a-root.ts` — методы activate(), complete(), archive()
    - [x] `stream/commands/create-stream-cmd.ts` — CreateStreamCmd, схема, мета
    - [x] `stream/commands/activate-stream-cmd.ts` — ActivateStreamCmd
    - [x] `stream/commands/complete-stream-cmd.ts` — CompleteStreamCmd
    - [x] `stream/commands/archive-stream-cmd.ts` — ArchiveStreamCmd

- [x] Task: Написать тесты для StreamAr.findNextStep (ffc8f56)
    - [x] Тест: находит следующий шаг в том же уроке
    - [x] Тест: переходит к первому шагу следующего урока
    - [x] Тест: переходит к первому шагу следующего проекта
    - [x] Тест: возвращает null на последнем шаге всего потока
    - [x] Тест: выбрасывает ошибку если stepId не найден в снимке

- [x] Task: Реализовать StreamAr.findNextStep (ffc8f56)
    - [x] `stream/a-root.ts` — метод findNextStep с обходом дерева в глубину

- [x] Task: Conductor - User Manual Verification 'Агрегат StreamAr' (Protocol in workflow.md) (86513e4)

---

## Фаза 3: Агрегат StreamStudentAr

- [~] Task: Написать тесты для StreamStudentAr.enroll
    - [ ] Тест: создаёт студента с корректными полями
    - [ ] Тест: currentStepId должен быть передан при создании
    - [ ] Тест: status = active, steps = []

- [ ] Task: Реализовать StreamStudentAr.enroll
    - [ ] `stream-student/entity.ts` — StreamStudentSchema, StepRecordSchema, StreamStudentArMeta
    - [ ] `stream-student/a-root.ts` — класс StreamStudentAr, static enroll

- [~] Task: Написать тесты для StreamStudentAr.issueStep и completeStep
    - [ ] Тест: issueStep добавляет StepRecord со статусом issued
    - [ ] Тест: issueStep обновляет currentStepId
    - [ ] Тест: issueStep выбрасывает ошибку если stepId уже выдан
    - [ ] Тест: completeStep меняет статус StepRecord на completed
    - [ ] Тест: completeStep проставляет completedAt
    - [ ] Тест: completeStep выбрасывает ошибку если шаг не был выдан

- [ ] Task: Реализовать StreamStudentAr.issueStep и completeStep
    - [ ] `stream-student/a-root.ts` — методы issueStep, completeStep, complete

- [~] Task: Conductor - User Manual Verification 'Агрегат StreamStudentAr' (Protocol in workflow.md)

---

## Фаза 4: Domain Service StreamDs [checkpoint: d5ed535]

- [x] Task: Написать тесты для StreamDs.completeStep (8f0ee68)
    - [x] Тест: завершает шаг, находит следующий, выдаёт его — уровень step
    - [x] Тест: при завершении последнего шага урока — уровень lesson
    - [x] Тест: при завершении последнего шага проекта — уровень project
    - [ ] Тест: при завершении последнего шага потока — студент completed

- [x] Task: Реализовать StreamDs.completeStep (8f0ee68)
    - [x] `stream-ds.ts` — класс StreamDs, метод completeStep

- [x] Task: Conductor - User Manual Verification 'Domain Service StreamDs' (Protocol in workflow.md) (d5ed535)

---

## Фаза 5: Policy и Repo-интерфейсы [checkpoint: 73c880c]

- [x] Task: Написать тесты для StreamPolicy (27f8913) (27f8913)
    - [x] Тест: canCreate — true для MENTOR, false для STUDENT, GUEST
    - [x] Тест: canRead — true для всех при active/completed
    - [x] Тест: canRead — true для mentorId при любом статусе
    - [x] Тест: canEdit — true для mentorId и ADMIN
    - [x] Тест: canEnroll — true для GUEST и CANDIDATE, false для STUDENT, MENTOR и ADMIN

- [x] Task: Реализовать StreamPolicy (27f8913) (27f8913)
    - [x] `stream/policy.ts` — StreamPolicy с поддержкой canEnroll

- [x] Task: Определить интерфейсы репозиториев (27f8913)
    - [x] `stream/repo.ts` — StreamRepo (save, getByUuid, getAll)
    - [x] `stream-student/repo.ts` — StreamStudentRepo (save, getByUuid, getByStream, getByUser)

- [x] Task: Финальная сборка — module.ts, index.ts (27f8913)
    - [x] `domain/module.ts` — StreamApiModuleMeta, StreamApiModuleResolver
    - [x] `domain/index.ts` — полный экспорт всех агрегатов, схем, типов
    - [x] `src/index.ts` — реэкспорт domain
    - [x] Перенести `user-stories.md` из папки трека в `packages/stream/src/user-stories.md`

- [x] Task: Conductor - User Manual Verification 'Policy и Repo-интерфейсы' (Protocol in workflow.md) (73c880c)

---

## Фаза 6: Контроль качества

- [x] Task: Запустить полную проверку качества (649b0d2)
    - [x] `bun test` — все тесты проходят
    - [x] `bun run lint` — нет ошибок Biome
    - [x] `bun run tslint` — нет ошибок типов
    - [x] `bun test --coverage` — покрытие >80%
