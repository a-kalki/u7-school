# План реализации: Мониторинг группы для ментора

> Контекст: `../../architecture-evolution.md` §2.3, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: Логика «Отстаёт»

- [ ] Task: Написать тесты: неактивность 5+ дней → «Отстаёт»; отставание от медианы 30%+ → «Отстаёт»
- [ ] Task: Реализовать вычисление в MonitorStory (медиана, completedAt последнего шага)
  - [ ] Константа порога неактивности (5 дней)
  - [ ] Маркер ⚠️ в S07 + причина в S08
- [ ] Task: Conductor - Ручная верификация 'Логика Отстаёт'

## Фаза 2: Сводка по группе + сортировка (S07)

- [ ] Task: Написать тесты: сводка (медиана, отстающие, advanced, not_advanced, active, enrolled) и сортировка (отстающие сверху)
- [ ] Task: Реализовать сводку и сортировку в MonitorStory.#handleStudents
  - [ ] advanced и not_advanced считаются отдельно (вместо общего «завершившие»)
- [ ] Task: Conductor - Ручная верификация 'Сводка и сортировка'

## Фаза 3: История шагов студента (S08)

- [ ] Task: Написать тесты: monitor:history:{studentId} → список шагов с позициями (ContentPath), статусами, датами
- [ ] Task: Реализовать обработчик history в MonitorStory (через resolve-content-path из трека 2)
  - [ ] Заменить заглушку «🚧 История шагов ещё не реализована»
- [ ] Task: Conductor - Ручная верификация 'История шагов'

## Фаза 4: Действия ментора в S08

- [ ] Task: Написать тесты:
  - [ ] «Завершить обучение» → complete-student с выбором исхода (advanced / not_advanced / abandoned), confirm, −STUDENT
  - [ ] «Отчислить» → mark-abandoned (cause: by_mentor) → abandonDetails: { who: 'mentor', cause: 'by_mentor' }, confirm, −STUDENT
- [ ] Task: Реализовать кнопки через confirm-хелпер (трек 1)
  - [ ] complete-student: батчевый или индивидуальный выбор исхода
  - [ ] mark-abandoned: cause = by_mentor
- [ ] Task: Conductor - Ручная верификация 'Действия ментора'

## Фаза 5: E2E + документация

- [ ] Task: E2E: ментор видит отстающего, открывает историю, завершает обучение (выбирает advanced)
- [ ] Task: Обновить `architecture-evolution.md` и `ui-spec.md` (S07 сводка/сортировка, S08 история/действия)
- [ ] Task: Conductor - Ручная верификация 'E2E мониторинга'
