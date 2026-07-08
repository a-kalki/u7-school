# План реализации: Жизненный цикл студента

> Контекст: `../../architecture-evolution.md` §2.3–2.6, §6, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: Домен — статусы и StudentAr

- [ ] Task: Написать тесты StudentAr (все переходы + ошибки)
  - [ ] enrolled→active (activate); активация не-active → ошибка
  - [ ] active→completed (complete); completed→wants_next/advanced/not_advanced
  - [ ] drop (self) → abandoned+voluntary; markAbandoned (mentor) → abandoned+by_mentor/inactivity
  - [ ] недопустимые переходы → throwBadRequest

- [ ] Task: Реализовать enriched статусы + методы StudentAr
  - [ ] Обновить `StudentSchema` (status enum, abandonReason)
  - [ ] Методы `activate`, `drop`, `markAbandoned`, `complete`, `markWantsNext`, `advance`, `markNotAdvanced`

- [ ] Task: Conductor - Ручная верификация 'Статусы StudentAr'

## Фаза 2: TgFacade (порт core + impl app)

- [ ] Task: Написать тесты TgFacade impl (mock Grammy)
- [ ] Task: Реализовать порт `TgFacade` в `core`, impl в `app`/infra
  - [ ] Добавить в `StreamApiModuleResolver`, `CourseApiModuleResolver`
  - [ ] Wiring в `tests/bot/helpers/test-app.ts` и apps
- [ ] Task: Conductor - Ручная верификация 'TgFacade'

## Фаза 3: UC (завершение, выход, активация, зачисление)

- [ ] Task: Написать тесты UC: complete-student, drop-student, mark-abandoned, доработка enroll/activate/complete-stream
  - [ ] complete-student: active→completed + removeRole(STUDENT); не-ментор → denied
  - [ ] drop-student: self → abandoned(voluntary) + -STUDENT
  - [ ] mark-abandoned: mentor → abandoned + -STUDENT
  - [ ] enroll-student: → enrolled + STUDENT
  - [ ] activate-stream: enrolled→active + issue первого шага
  - [ ] complete-stream: все active/enrolled → completed + -STUDENT

- [ ] Task: Реализовать UC + команды
  - [ ] `complete-student-cmd`, `drop-student-cmd`, `mark-abandoned-cmd` (замена expel)
  - [ ] Доработать `enroll-student-uc` (enrolled), `activate-stream-uc` (enrolled→active), `complete-stream-uc`
  - [ ] Роль STUDENT через `userFacade.addRoleToUser`/`removeRoleFromUser`

- [ ] Task: Conductor - Ручная верификация 'UC жизненного цикла'

## Фаза 4: User.nick

- [ ] Task: Написать тесты: set-nick, уникальность
- [ ] Task: Реализовать `UserSchema.nick` + UC set-nick (self) + проверка уникальности в репо
- [ ] Task: Conductor - Ручная верификация 'User.nick'

## Фаза 5: Confirm-хелпер + рефакторинг сториз

- [ ] Task: Написать тесты confirm-хелпера
- [ ] Task: Реализовать confirm-хелпер в `core/ui`/`app/ui`
  - [ ] Применить в MonitorStory (complete-student, mark-abandoned вместо expel)
  - [ ] Применить в ViewStreamStory (complete-stream)
- [ ] Task: Обновить `statusLabels` в MonitorStory на новые статусы
- [ ] Task: Conductor - Ручная верификация 'Confirm-хелпер'

## Фаза 6: Миграция и тесты

- [ ] Task: Написать скрипт миграции `dropped`/`expelled`→`abandoned`+abandonReason (json)
- [ ] Task: Обновить сломанные тесты `tests/bot` (expelled→abandoned, expel.integration → mark-abandoned)
- [ ] Task: Добавить интеграционные тесты новых UC
- [ ] Task: Миграция прод-данных — на месте, после согласования
- [ ] Task: Обновить `architecture-evolution.md` (отметить ЖЦ) и `ui-spec.md` (Часть A: жизненный цикл)
- [ ] Task: Conductor - Ручная верификация 'Миграция и тесты ЖЦ'
