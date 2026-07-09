# План реализации: Жизненный цикл студента

> Контекст: `../../architecture-evolution.md` §2.3–2.6, §6, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: Домен — статусы и StudentAr [checkpoint: f24ce7c]

- [x] Task: Написать тесты StudentAr (все переходы + ошибки) — 11c2a38
- [x] Task: Реализовать финальные статусы + методы StudentAr — 8d663b4
- [x] Task: Conductor - Ручная верификация 'Статусы StudentAr'

## Фаза 2: TgFacade (порт core + impl app) [checkpoint: 25228bf]

- [x] Task: Написать тесты TgFacade impl (mock Grammy) — 8c55fe3
- [x] Task: Реализовать порт `TgFacade` в `core`, impl в `app`/infra — 6e1745d
- [x] Task: Conductor - Ручная верификация 'TgFacade'

## Фаза 3: UC (завершение, выход, активация, зачисление) [checkpoint: 496a538]

- [x] Task: Написать тесты UC — 29a4102
  - [x] complete-student: ментор выбирает abandoned|advanced|not_advanced → статус обновлён + −STUDENT
  - [x] drop-student: self → abandoned(voluntary) + −STUDENT
  - [x] mark-abandoned: mentor → abandoned(inactivity|by_mentor) + −STUDENT
  - [x] enroll-student: → enrolled + +STUDENT
  - [x] activate-stream: enrolled→active для всех
  - [x] set-next-preference: self, только advanced/not_advanced
  - [x] CompleteStreamUc: батчевые исходы + TgFacade

- [x] Task: Реализовать UC + команды — 98576f4
  - [x] complete-student-cmd, drop-student-cmd, mark-abandoned-cmd (замена expel)
  - [x] set-next-preference-cmd
  - [x] Доработан enroll-student-uc (enrolled), activate-stream-uc (enrolled→active)
  - [x] CompleteStreamUc с батчевыми исходами и TgFacade
  - [x] addRoleToUser/removeRoleFromUser

- [x] Task: Рефакторинг CompleteStreamUc + CompleteStudentUc — 496a538
  - [x] CompleteStreamUc — только stream.complete() + проверка отсутствия active
  - [x] CompleteStudentUc — добавлен tgFacade.sendMessage (telegramId через userFacade)
  - [x] ListStreamStudentsUc — опциональный параметр status
  - [x] StudentStatus enum + StudentStatusSchema в status.ts

- [ ] Task: Conductor - Ручная верификация 'UC жизненного цикла'

## Фаза 4: User.nick

- [ ] Task: Написать тесты: set-nick, уникальность
- [ ] Task: Реализовать `UserSchema.nick` + UC set-nick (self) + проверка уникальности в репо
- [ ] Task: Conductor - Ручная верификация 'User.nick'

## Фаза 5: Confirm-хелпер + рефакторинг сториз

- [ ] Task: Написать тесты confirm-хелпера
- [ ] Task: Реализовать confirm-хелпер в `core/ui`/`app/ui`
  - [ ] Применить в MonitorStory (complete-student с выбором исхода, mark-abandoned)
- [ ] Task: Обновить `statusLabels` в MonitorStory на новые статусы
- [ ] Task: Conductor - Ручная верификация 'Confirm-хелпер'

## Фаза 6: Миграция и тесты

- [ ] Task: Написать скрипт миграции:
  - [ ] `dropped` → `abandoned` + `abandonDetails: { who: 'self', cause: 'voluntary' }`
  - [ ] `expelled` → `abandoned` + `abandonDetails: { who: 'mentor', cause: 'by_mentor' }`
- [ ] Task: Обновить сломанные тесты `tests/bot`:
  - [ ] `expelled` → `abandoned`
  - [ ] `expel.integration` → `mark-abandoned.integration`
  - [ ] Убрать упоминания `completed` и `wants_next` статусов
- [ ] Task: Добавить интеграционные тесты новых UC
- [ ] Task: Миграция прод-данных — на месте, после согласования
- [ ] Task: Обновить `architecture-evolution.md` (отметить ЖЦ) и `ui-spec.md` (Часть A: жизненный цикл)
- [ ] Task: Conductor - Ручная верификация 'Миграция и тесты ЖЦ'
