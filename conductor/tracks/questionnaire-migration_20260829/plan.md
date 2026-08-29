# План: Миграция старых анкет (questionnaire-migration_20260829)

Спецификация: [spec.md](./spec.md)

> TDD не применяется: скрипт одноразовый, без юнит-тестов (консистентно с другими скриптами `scripts/`).
> Главная проверка — dry-run на копии реальных данных (Фаза 2) со встроенной valibot-валидацией до записи.

## Фаза 1: Скрипт миграции [checkpoint: 425153c]

- [x] Task: Реализация `scripts/migrate-old-questionnaires.ts` [b03b241f]
  - [ ] Чтение: questionnaires.json (старый), users.json, пул из course.json (ключ 29adc3be), wishes.json, students.json
  - [ ] Фильтры + трансформация анкет + wish по FR1–FR3 (мульти → join через запятую, goal_text → 'text'+answerText, fulfilled по students.json)
  - [ ] Валидация valibot до записи (FR4), бэкап с таймстампом первым шагом (FR5), append к массивам, идемпотентность (FR6), отчёт со счётчиками (FR7)
- [x] Task: Вороты качества (`bun run check` — lint + tsc; тесты проекта не затронуты) [b03b241f]
- [x] Task: Conductor - Ручная верификация 'Фаза 1' (Protocol in workflow.md) [425153c]

## Фаза 2: Dry-run на копии данных — главная проверка [checkpoint: 2300246]

- [x] Task: Прогон скрипта на копии директории data в песочнице
- [x] Task: Сверка результатов: 67 анкет / 62 wish (16 fulfilled + 46 confirmed) / wish Nur нетронут / 0 ошибок валидации / повторный запуск — 0 изменений
- [x] Task: Выборочная ручная сверка содержимого: пара completed-анкет (мульти-ответы, goal_text, пул-снимок, ownerInfo, даты), wish fulfilled для студента и confirmed для остальных
- [x] Task: Conductor - Ручная верификация 'Фаза 2' (Protocol in workflow.md) [2300246]

## Фаза 3: Боевое применение [checkpoint: b2dd34f]

- [x] Task: Ручной бэкап данных (backup.sh / tar) до выполнения скрипта
- [x] Task: Остановка pm2 u7-school-bot → прогон скрипта → старт бота
- [x] Task: Проверка логов pm2: нет console.warn от JsonFileRepo; выборочная проверка анкет (get-questionnaires-by-user) и wish
- [x] Task: Conductor - Ручная верификация 'Фаза 3' (Protocol in workflow.md) [b2dd34f]

## Фаза 4: Завершение трека

- [x] Task: Обновление `scripts/call-uc.ts`: подключить все модули (добавить questionnaire, wish) — запрос пользователя, вне исходного плана [d2530532]
- [x] Task: Удаление временных файлов миграции (песочница /tmp/u7-migration-sandbox, /tmp/pre-migration-md5.txt) — запрос пользователя, вне исходного плана [d2530532]
- [ ] Task: summary.md трека; обновление MIGRATION-OLD-QUESTIONNAIRES.md (итог миграции); отметка трека в conductor/tracks.md
- [ ] Task: Conductor - Ручная верификация 'Фаза 4' (Protocol in workflow.md)
