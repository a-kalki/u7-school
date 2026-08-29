# План: Миграция старых анкет (questionnaire-migration_20260829)

Спецификация: [spec.md](./spec.md)

## Фаза 1: Скрипт миграции — TDD

- [ ] Task: Тесты трансформации анкеты (Red)
  - [ ] Тест: completed-анкета трансформируется корректно (мульти-ответы → join через запятую, goal_text → answerCode:'text' + answerText, пул-снимок из course.json, ownerInfo={courseId}, completedAt=updatedAt, сохранение uuid/createdAt/updatedAt)
  - [ ] Тест: базовая ветка (base_days + base_time, без intensive_time) и интенсивная (intensive_time, без base_days/base_time) проходят v.parse(QuestionnaireSchema)
- [ ] Task: Тесты фильтрации, wish и дедупа (Red)
  - [ ] Тест: анкеты Nur (telegramId 773084180) и 0/1-ответные исключаются; completed и >2-ответные проходят
  - [ ] Тест: юзер со студенчеством в students.json → wish `fulfilled`; без студенчества → `confirmed`; один wish на юзера по последней completed (updatedAt)
  - [ ] Тест: существующий активный wish на курс не дублируется (кейс Nur)
  - [ ] Тест: идемпотентность повторного запуска (0 изменений)
  - [ ] Тест: невалидная запись → полный abort без записи
- [ ] Task: Реализация скрипта `scripts/migrate-old-questionnaires.ts` (Green)
  - [ ] Чтение: questionnaires.json (старый), users.json, пул из course.json (ключ 29adc3be), wishes.json, students.json
  - [ ] Фильтры + трансформация + wish по FR1–FR3
  - [ ] Валидация valibot до записи (FR4), бэкап с таймстампом первым шагом (FR5), append к массивам, отчёт со счётчиками (FR7)
- [ ] Task: Вороты качества (`bun run check`)
- [ ] Task: Conductor - Ручная верификация 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Dry-run на копии данных

- [ ] Task: Прогон скрипта на копии директории data в песочнице
- [ ] Task: Сверка результатов: 67 анкет / 62 wish (16 fulfilled + 46 confirmed) / wish Nur нетронут / 0 ошибок валидации / повторный запуск — 0 изменений
- [ ] Task: Conductor - Ручная верификация 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Боевое применение

- [ ] Task: Ручной бэкап данных (backup.sh / tar) до выполнения скрипта
- [ ] Task: Остановка pm2 u7-school-bot → прогон скрипта → старт бота
- [ ] Task: Проверка логов pm2: нет console.warn от JsonFileRepo; выборочная проверка анкет (get-questionnaires-by-user) и wish
- [ ] Task: Conductor - Ручная верификация 'Фаза 3' (Protocol in workflow.md)

## Фаза 4: Завершение трека

- [ ] Task: summary.md трека; обновление MIGRATION-OLD-QUESTIONNAIRES.md (итог миграции); отметка трека в conductor/tracks.md
- [ ] Task: Conductor - Ручная верификация 'Фаза 4' (Protocol in workflow.md)
