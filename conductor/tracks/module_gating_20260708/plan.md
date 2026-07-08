# План реализации: Gating модулей

> Контекст: `../../architecture-evolution.md` §2.1, §2.3, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: CoursePolicy — gating

- [ ] Task: Написать тесты canEnrollNextModule
  - [ ] первый модуль курса → разрешён
  - [ ] есть completed предыдущего модуля → разрешён
  - [ ] нет завершения предыдущего → отказ
  - [ ] abandoned предыдущего → отказ

- [ ] Task: Реализовать CoursePolicy.canEnrollNextModule
  - [ ] Поиск предыдущего модуля в course.phases
  - [ ] Проверка Student-записи (completed/advanced) через streamRepo/studentRepo

- [ ] Task: Conductor - Ручная верификация 'CoursePolicy gating'

## Фаза 2: Gate в enroll-student

- [ ] Task: Написать тесты enroll-student с gate
  - [ ] запись на N+1 без completed N → ошибка с названием prev модуля
  - [ ] запись на N+1 с completed N → успех

- [ ] Task: Интегрировать gate в enroll-student-uc
  - [ ] Получить course по module.courseId, проверить canEnrollNextModule
  - [ ] При успехе: если есть предыдущая Student-запись → advance()

- [ ] Task: Conductor - Ручная верификация 'Gate зачисления'

## Фаза 3: UI перехода

- [ ] Task: Написать тесты: после complete студента — экран предложения следующего модуля
- [ ] Task: Реализовать экран перехода в LearningStory/ViewStreamStory
  - [ ] Кнопки: «Записаться на следующий» / «Ждать набор» (wants_next) / «Главное меню»
  - [ ] Запись на следующий через enroll-story с gate
- [ ] Task: Conductor - Ручная верификация 'UI перехода модуля'

## Фаза 4: E2E + документация

- [ ] Task: E2E: Синтаксис → Алгоритмика (полный флоу gating'а)
- [ ] Task: Обновить `architecture-evolution.md` (отметить gating) и `ui-spec.md` (экран перехода, gating-логика)
- [ ] Task: Conductor - Ручная верификация 'E2E gating'
