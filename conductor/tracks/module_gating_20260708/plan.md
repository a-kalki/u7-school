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

## Фаза 2: Gate в enroll-student [checkpoint: 0c50300]

- [x] Task: Написать тесты enroll-student с gate [ae0e4ad]
  - [x] запись на N+1 без `advanced` на N → ошибка с названием prev модуля
  - [x] запись на N+1 с `advanced` на N → успех, новая Student-запись (enrolled) + +STUDENT
  - [x] предыдущая Student-запись НЕ меняется (остаётся advanced)

- [x] Task: Интегрировать gate в enroll-student-uc [ae0e4ad]
  - [x] Получить course по module.courseId, проверить canEnrollNextModule
  - [x] При успехе: создать новую Student-запись (enrolled), выдать STUDENT

- [x] Task: Conductor - Ручная верификация 'Gate зачисления' [0c50300]

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

## Фаза 4: E2E + документация [checkpoint: 7a6e675]

- [x] Task: E2E: студент с advanced на Синтаксисе → записывается на Алгоритмику
  - ✅ `tests/bot/e2e/stream/gating.e2e.test.ts` — 4 теста через TestApp с реальными JSON-репозиториями
- [x] Task: E2E: студент с not_advanced на Синтаксисе → получает отказ при попытке записи на Алгоритмику
  - ✅ там же
- [x] Task: Обновить `architecture-evolution.md` (отметить gating) и `ui-spec.md`
  - ✅ `architecture-evolution.md` §2.3.1 — описание реализации gating
  - ✅ `ui-spec.md` S08 — TgFacade отмечен как отложенный
- [ ] Task: Conductor - Ручная верификация 'E2E gating'

## Техдолг

### Фаза 3 — Предложение перехода (ПРОПУЩЕНА)

**Причина:** отправка сообщения и диалога в текущий чат, где пользователь может проходить обучение, создаёт конфликт по перехвату состояния. Пользователь в этот момент может взаимодействовать с ботом в другом контексте (урок, каталог), и inline-клавиатура с «Да/Нет/Позже» будет мешать основному потоку. Нужен механизм неблокирующих уведомлений или отдельный канал взаимодействия.
