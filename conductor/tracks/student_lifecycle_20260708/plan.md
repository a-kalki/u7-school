# План реализации: Жизненный цикл студента

> Контекст: `../../architecture-evolution.md` §2.3–2.6, §6, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: Домен — статусы и StudentAr

- [ ] Task: Написать тесты StudentAr (все переходы + ошибки)
  - [ ] enrolled→active (activate); активация не-enrolled → ошибка
  - [ ] active→abandoned (drop — who=self/cause=voluntary)
  - [ ] active→abandoned (markAbandoned — who=mentor/cause=inactivity|by_mentor)
  - [ ] active→advanced (advance — completionDetails.nextPreference='undecided')
  - [ ] active→not_advanced (markNotAdvanced — completionDetails.nextPreference='undecided')
  - [ ] setNextPreference — только для advanced/not_advanced, иначе ошибка
  - [ ] недопустимые переходы → throwBadRequest (например, abandoned→advanced, not_advanced→active)

- [ ] Task: Реализовать финальные статусы + методы StudentAr
  - [ ] Обновить `StudentSchema` (status enum из 5 значений, abandonDetails?, completionDetails?)
  - [ ] Методы: `activate`, `drop`, `markAbandoned`, `advance`, `markNotAdvanced`, `setNextPreference`

- [ ] Task: Conductor - Ручная верификация 'Статусы StudentAr'

## Фаза 2: TgFacade (порт core + impl app)

- [ ] Task: Написать тесты TgFacade impl (mock Grammy)
- [ ] Task: Реализовать порт `TgFacade` в `core`, impl в `app`/infra
  - [ ] Добавить в `StreamApiModuleResolver`, `CourseApiModuleResolver`
  - [ ] Wiring в `tests/bot/helpers/test-app.ts` и apps
- [ ] Task: Conductor - Ручная верификация 'TgFacade'

## Фаза 3: UC (завершение, выход, активация, зачисление)

- [ ] Task: Написать тесты UC
  - [ ] complete-student: ментор выбирает abandoned|advanced|not_advanced → статус обновлён + −STUDENT
  - [ ] complete-student: не-ментор → denied
  - [ ] drop-student: self → abandoned(voluntary) + −STUDENT
  - [ ] mark-abandoned: mentor → abandoned(inactivity|by_mentor) + −STUDENT
  - [ ] enroll-student: → enrolled + +STUDENT
  - [ ] activate-stream: enrolled→active для всех студентов потока
  - [ ] set-next-preference: self, только advanced/not_advanced → обновить nextPreference
  - [ ] CompleteStreamUc:
    - [ ] ментор вызывает, получает список active-студентов
    - [ ] для каждого выбирает abandoned|advanced|not_advanced
    - [ ] после confirm: статусы обновлены, STUDENT снят
    - [ ] advanced → tgFacade.sendMessage (предложение след. модуля)
    - [ ] not_advanced → tgFacade.sendMessage (предложение перезаписи)
    - [ ] abandoned → сообщение не отправляется

- [ ] Task: Реализовать UC + команды
  - [ ] `complete-student-cmd` (ментор выбирает исход), `drop-student-cmd`, `mark-abandoned-cmd` (замена expel)
  - [ ] `set-next-preference-cmd`
  - [ ] Доработать `enroll-student-uc` (enrolled), `activate-stream-uc` (enrolled→active)
  - [ ] Полная переработка `CompleteStreamUc`:
    - [ ] Батчевый выбор исхода для каждого active-студента
    - [ ] Рассылка сообщений через TgFacade
  - [ ] Роль STUDENT через `userFacade.addRoleToUser`/`removeRoleFromUser`

- [ ] Task: Conductor - Ручная верификация 'UC жизненного цикла'

## Фаза 4: User.nick

- [ ] Task: Написать тесты: set-nick, уникальность
- [ ] Task: Реализовать `UserSchema.nick` + UC set-nick (self) + проверка уникальности в репо
- [ ] Task: Conductor - Ручная верификация 'User.nick'

## Фаза 5: Confirm-хелпер + рефакторинг сториз

- [ ] Task: Написать тесты confirm-хелпера
- [ ] Task: Реализовать confirm-хелпер в `core/ui`/`app/ui`
  - [ ] Применить в MonitorStory (complete-student с выбором исхода, mark-abandoned)
  - [ ] Применить в CompleteStreamUc (батчевый confirm)
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
