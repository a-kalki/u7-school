# План реализации: Gating модулей

> Контекст: `../../architecture-evolution.md` §2.1, §2.3, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: CoursePolicy — gating [checkpoint: 9fc959e]

- [x] Task: Написать тесты canEnrollNextModule [743b6b8]
  - [x] первый модуль курса → разрешён
  - [x] есть `advanced` предыдущего модуля → разрешён
  - [x] есть `not_advanced` предыдущего → отказ
  - [x] есть `abandoned` предыдущего → отказ
  - [x] нет Student-записи на предыдущий модуль → отказ

- [x] Task: Реализовать CoursePolicy.canEnrollNextModule [9f4f531]
  - [x] Поиск предыдущего модуля в course.phases (сбор всех moduleIds в линейный порядок)
  - [x] Проверка Student-записи: `status === 'advanced'`

- [x] Task: Conductor - Ручная верификация 'CoursePolicy gating' [9fc959e]

## Фаза 2: Gate в enroll-student

- [x] Task: Написать тесты enroll-student с gate [ae0e4ad]
  - [x] запись на N+1 без `advanced` на N → ошибка с названием prev модуля
  - [x] запись на N+1 с `advanced` на N → успех, новая Student-запись (enrolled) + +STUDENT
  - [x] предыдущая Student-запись НЕ меняется (остаётся advanced)

- [x] Task: Интегрировать gate в enroll-student-uc [ae0e4ad]
  - [x] Получить course по module.courseId, проверить canEnrollNextModule
  - [x] При успехе: создать новую Student-запись (enrolled), выдать STUDENT

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

- [ ] Task: E2E: студент с advanced на Синтаксисе → записывается на Алгоритмику
- [ ] Task: E2E: студент с not_advanced на Синтаксисе → получает отказ при попытке записи на Алгоритмику
- [ ] Task: Обновить `architecture-evolution.md` (отметить gating) и `ui-spec.md`
- [ ] Task: Conductor - Ручная верификация 'E2E gating'
