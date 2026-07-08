# План реализации: Gating модулей

> Контекст: `../../architecture-evolution.md` §2.1, §2.3, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: CoursePolicy — gating

- [ ] Task: Написать тесты canEnrollNextModule
  - [ ] первый модуль курса → разрешён
  - [ ] есть `advanced` + `nextPreference: 'wants_next'` предыдущего модуля → разрешён
  - [ ] есть `advanced` + `nextPreference: 'undecided'` → отказ (не выразил желание)
  - [ ] есть `not_advanced` предыдущего → отказ
  - [ ] есть `abandoned` предыдущего → отказ
  - [ ] нет Student-записи на предыдущий модуль → отказ

- [ ] Task: Реализовать CoursePolicy.canEnrollNextModule
  - [ ] Поиск предыдущего модуля в course.phases
  - [ ] Проверка Student-записи: `status === 'advanced'` И `completionDetails.nextPreference === 'wants_next'`

- [ ] Task: Conductor - Ручная верификация 'CoursePolicy gating'

## Фаза 2: Gate в enroll-student

- [ ] Task: Написать тесты enroll-student с gate
  - [ ] запись на N+1 без `advanced + wants_next` на N → ошибка с названием prev модуля
  - [ ] запись на N+1 с `advanced + wants_next` на N → успех, новая Student-запись (enrolled) + +STUDENT
  - [ ] предыдущая Student-запись НЕ меняется (остаётся advanced)

- [ ] Task: Интегрировать gate в enroll-student-uc
  - [ ] Получить course по module.courseId, проверить canEnrollNextModule
  - [ ] При успехе: создать новую Student-запись (enrolled), выдать STUDENT

- [ ] Task: Conductor - Ручная верификация 'Gate зачисления'

## Фаза 3: Предложение перехода (TgFacade-сообщение + обработка ответа)

- [ ] Task: Написать тесты: после завершения потока (CompleteStreamUc из трека 1) студент получает TgFacade-сообщение
  - [ ] advanced → сообщение «Хочешь на следующий модуль?» с кнопками Да/Нет/Позже
  - [ ] not_advanced → сообщение «Хочешь перезаписаться?» с кнопками
  - [ ] abandoned → сообщение не отправляется
- [ ] Task: Написать тесты обработки ответов студента
  - [ ] «Да» → set-next-preference(wants_next) / (wants_repeat)
  - [ ] «Нет» / «Позже» → set-next-preference(undecided)
- [ ] Task: Реализовать обработчик ответов в story (обработка callback от inline-клавиатуры)
- [ ] Task: Conductor - Ручная верификация 'Предложение перехода'

## Фаза 4: E2E + документация

- [ ] Task: E2E: студент с advanced+wants_next на Синтаксисе → записывается на Алгоритмику
- [ ] Task: E2E: студент с not_advanced на Синтаксисе → получает отказ при попытке записи на Алгоритмику
- [ ] Task: Обновить `architecture-evolution.md` (отметить gating) и `ui-spec.md`
- [ ] Task: Conductor - Ручная верификация 'E2E gating'
