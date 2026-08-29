# Трек: Миграция старых анкет в новую среду (questionnaire-migration_20260829)

## Обзор

После релиза 6215b840 (merge fe9b4a8b..6215b840, 366 коммитов) старый движок анкет (`packages/onboarding`) удалён. 167 старых анкет в `data/questionnaires/questionnaires.json` больше никем не читаются. Новая среда: движок `packages/questionnaire` (файл `data/questionnaires/q-questionnaires.json`) + механика `packages/wish` (`data/wish/wishes.json`), которая рассылает уведомления об открытии набора (wish `expressed`/`confirmed` → `wish:invite` при `stream.created` на первый модуль курса).

Цель: перенести завершённые анкеты в новую среду и создать желания (wish), чтобы **все завершившие анкету получали уведомления при открытии набора на курс Fullstack JS** (`29adc3be-873e-47ec-aa30-61f5e6e25d4e`).

Вводный файл: `MIGRATION-OLD-QUESTIONNAIRES.md`. Предварительный анализ проведён (сессия 2026-08-29): покрытие telegramId→users.json — 100% (148/148), коды вопросов/ответов совпадают с новым пулом 1:1, условная логика не нарушена, все даты в валидном формате `YYYY-MM-DDTHH:mm`.

Источник статуса реализации желания: `data/streams/students.json` (87 записей по 6 потокам). Наличие юзера в любом студенчестве (любой статус: active/abandoned/advanced/not_advanced/enrolled) означает, что желание уже реализовано.

## Функциональные требования

**FR1. Фильтрация исходных записей** (167 записей, 148 уникальных telegramId):
- анкеты Nur (telegramId `773084180`, 2 completed) — тестовые, исключаются;
- анкеты бот-аккаунтов — по факту отсутствуют (`U7 School Bot`, `U7 School Test Bot` — 0 анкет);
- анкеты с 0 ответов и с 1 ответом (только текстовый goal_text) — не переносятся: 98 шт (45 abandoned + 40 in_progress + 13 in_progress);
- переносятся: все `completed` (67 после исключения Nur) и незавершённые со строго `>2` ответами (по факту 0 шт).

**FR2. Трансформация анкет** в схему `QuestionnaireSchema` (`packages/questionnaire/src/domain/questionnaire/entity.ts`):
- `kind: 'standard'`, `respondentId` = uuid юзера из `users.json` (маппинг по telegramId);
- `answers`: `answerCodes: string[]` → `answerCode` (join через запятую — формат мульти-ответов нового движка, см. `a-root.ts` `#submitCurrentQuestion`); для `goal_text`: `answerCode: 'text'`, `answerText` = старый `textValue`;
- `questionPool` = снимок полного пула из `packages/wish/src/domain/wish/pools/course.json` по ключу `29adc3be` (11 вопросов);
- `ownerInfo = { courseId: '29adc3be-873e-47ec-aa30-61f5e6e25d4e' }` (как пишет `create-course-wish-uc`);
- `currentQuestionCode: null`, `draftAnswers: {}`, `status: 'completed'`, `completedAt = updatedAt`;
- uuid анкеты, `createdAt`, `updatedAt` — сохраняются из старой записи; формат дат не меняется;
- все completed анкеты юзеров с несколькими завершёнными (4 юзера, 9 анкет) переносятся как история.

**FR3. Wish** (`packages/wish/src/domain/wish/entity.ts`):
- один wish на юзера: `{ kind: 'course', courseId: '29adc3be-873e-47ec-aa30-61f5e6e25d4e' }`;
- **статус**: `fulfilled`, если userId встречается в `data/streams/students.json` (так же поступил бы `fulfill-wish-er` при живом зачислении), иначе — `confirmed`. Ожидается: 16 fulfilled + 46 confirmed;
- даты `createdAt`/`updatedAt` — из последней completed анкеты юзера (по `updatedAt`) в обоих случаях;
- дедуп: не создавать wish при существующем активном wish на курс (wish Nur из живого теста 29.08 не трогается — оставлен осознанно, свежий, для проверки рассылки).

**FR4. Валидация до записи**: каждая анкета проходит `v.parse(QuestionnaireSchema)`, каждый wish — `v.parse(WishSchema)`. Любая ошибка → полный abort без записи (защита от молчаливой потери данных: JsonFileRepo пропускает невалидные записи с `console.warn`, при перезаписи они теряются).

**FR5. Бэкап до записи**: скрипт первым шагом копирует `q-questionnaires.json` и `wishes.json` с таймстампом; перед боевым прогоном — отдельный ручной бэкап.

**FR6. Идемпотентность**: повторный запуск не создаёт дубликаты (проверка по uuid анкеты / паре user+course).

**FR7. Отчёт**: счётчики перенесённых/пропущенных с причинами по каждой категории.

## Нефункциональные требования

- миграция выполняется при остановленном боте (`pm2 stop u7-school-bot`): JsonFileRepo держит данные в памяти, гонка записи недопустима;
- старый файл `questionnaires.json` не изменяется и не удаляется (архив);
- скрипт одноразовый, в `scripts/`, стиль — как у существующих скриптов;
- прогон сначала на копии данных (dry-run), затем боевой;
- формат дат при миграции — `YYYY-MM-DDTHH:mm` (см. `conductor/code_styleguides/troubleshoots/deploy-migration-updatedAt-format.md`).

## Критерии приёмки

1. Перенесено ровно 67 анкет; создано 62 новых wish (16 `fulfilled` + 46 `confirmed`); существующий wish Nur не изменён.
2. Повторный запуск скрипта — 0 изменений (идемпотентность).
3. После старта бота — ни одного `console.warn` от JsonFileRepo в логах pm2 при чтении обоих файлов.
4. Анкеты доступны через `get-questionnaires-by-user` (выборочная проверка).
5. Желающие охвачены приглашением: `findAllByKind('course', ['expressed','confirmed'])` → 47 записей (46 новых + Nur).
6. Три ворот качества: `bun run check` (biome + tsc + тесты) — чисто.

## За рамками

- 85 юзеров с незавершёнными анкетами wish не получают (продуктовое решение).
- Старый файл не удаляется/не перемещается.
- Likert-анкеты и короткий пул (`dddddddd-…`) — не участвуют.
- Перенос draftAnswers недозаполненных анкет — не выполняется.
