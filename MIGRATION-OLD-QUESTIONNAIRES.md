# Миграция старых анкет в новую среду — вводный файл

> ✅ **МИГРАЦИЯ ВЫПОЛНЕНА 2026-08-29** (трек `questionnaire-migration_20260829`).
> Итог: перенесено 67 анкет (completed, без тестовых Nur), создано 62 wish
> (16 `fulfilled` + 46 `confirmed`) на курс Fullstack JS. Боевой файл анкет
> побайтово совпал с dry-run; бот перезапущен без предупреждений JsonFileRepo.
> Отчёт: `conductor/tracks/questionnaire-migration_20260829/summary.md`.
> Бэкапы: `data/backup/2026-08-29_18-57-05-before-migration/` и
> `~/backups/u7-data-pre-questionnaire-migration-2026-08-29_18-57-05.tar.gz`.
> Старый файл `questionnaires.json` не удалён (архив). Скрипт:
> `scripts/migrate-old-questionnaires.ts` (идемпотентный, повторный запуск безвреден).

> Задача для новой сессии: провести полный анализ и спланировать миграцию.
> Этот файл — входная точка. Написан 2026-08-29 после выкатки релиза 6215b840.

## Цель

Полный перевод старых анкет (файл `data/questionnaires/questionnaires.json`,
движок onboarding) в новую среду (движок `packages/questionnaire`, файл
`data/questionnaires/q-questionnaires.json` + механика `packages/wish`),
чтобы **все люди, заполнившие анкеты, получали сообщения** — в первую очередь
уведомления об открытии набора на курс (wish: `expressed`/`confirmed` →
уведомление при зачислении/открытии потока).

## Проблема

Старый движок (`packages/onboarding`) удалён из кода. Новый движок читает
**другой файл** (`q-questionnaires.json`) и имеет несовместимую схему.
Старый файл не читается никем — данные «мёртвые», но сохранены (не удалять!).

## Факты (проверено 2026-08-29)

- **Старые данные:** `data/questionnaires/questionnaires.json` — 167 записей:
  69 `completed`, 53 `in_progress`, 45 `abandoned`; 148 уникальных `telegramId`.
- **Старая схема** (см. `git show fe9b4a8b:packages/onboarding/src/domain/questionnaire/entity.ts`):
  - `telegramId: number` (не UUID!)
  - `answers[]: { questionCode, answerCodes: string[], textValue?, answeredAt }` — массив кодов ответов
  - `draftAnswers: string[] | отсутствует`
  - статусы: `in_progress | completed | abandoned` (нет `invited`)
  - даты в формате `YYYY-MM-DDTHH:mm` (без секунд/Z) — это валидный формат для `v.isoDateTime`, НЕ «чинить»
- **Новая схема** (`packages/questionnaire/src/domain/questionnaire/entity.ts` + `repo.ts`):
  - вариант по дискриминатору `kind: 'standard' | 'likert'` — **обязателен**
  - `respondentId: UUID` — маппинг `telegramId → uuid` через `data/users/users.json` (366 юзеров)
  - `answers[]: { questionCode, answerCode: string, answerText?, answeredAt }` — **один** код на запись (мульти-choice старых → несколько записей?)
  - `draftAnswers: Record<string, string>` (был массив строк)
  - `questionPool` — **обязательный снимок пула** (в старых данных отсутствует; источник — `packages/wish/src/domain/wish/pools/course.json`)
  - `ownerInfo` — обязательный record; статусы: `invited | in_progress | completed | abandoned`; опц. `warnedAt`, `abandonReason ('timeout'|'by_user')`
- **⚠️ Порядок вопросов изменился:** `goal_text` («Расскажи подробнее, чего хочешь достичь…»)
  в старом пуле был **первым (№0)**, в новом — **последним (№10)**. Остальные коды
  вопросов совпали 1:1 (`how_found, interest_reason, experience, language, format,
  goals, intensity, base_days, base_time, intensive_time`).
  Старый пул: `git show fe9b4a8b:packages/onboarding/src/domain/questionnaire/question-pool.json`.
  Новый пул: `packages/wish/src/domain/wish/pools/course.json` — два модульных пула:
  полный (11 вопросов, uuid `29adc3be-…`) и короткий (3 вопроса, uuid `dddddddd-…`).
- **Валидация при чтении:** `JsonFileRepo` пропускает невалидные записи с `console.warn`
  → при перезаписи файла они ТЕРЯЮТСЯ. Миграцию валидировать прогоном схемы до записи.
- Формат дат при миграции: `YYYY-MM-DDTHH:mm` — см.
  `conductor/code_styleguides/troubleshoots/deploy-migration-updatedAt-format.md`.

## Уже сделано (2026-08-29, эта выкатка)

- merge релиза `fe9b4a8b..6215b840` (366 коммитов), `bun install`, рестарт `pm2 u7-school-bot` — работает
- миграция `users.json`: роль `CANDIDATE` снята у 50 юзеров (0 удалено, 366 осталось)
- `scripts/backup.sh` расширен на все файлы данных (включая новые)
- старые анкеты НЕ тронуты — ждут этой задачи

## Открытые вопросы (отправная точка анализа)

1. Какие статусы переносить: только `completed` (69)? Что делать с `in_progress`/`abandoned`?
2. Нужен ли перенос в `q-questionnaires.json` вообще, или достаточно создать
   **wishes** (`data/wish/wishes.json`) для заполнявших — именно wish-механика шлёт уведомления?
   Какой статус wish ставить мигрированным (`expressed`/`confirmed`) и на какой курс (target)?
3. Согласование `currentQuestionCode`/`draftAnswers` у недозаполненных с новым порядком вопросов.
4. Анкеты без совпадения `telegramId → user` (проверить покрытие 148 id по users.json).
5. `questionPool` снимок: брать из `course.json` (какой модуль?) или писать упрощённый.

## Бэкапы (на случай отката)

- `data/backup/2026-08-29_17-33-*` (before-pull / after-merge)
- `/home/admin/backups/u7-data-premerge-2026-08-29_17-33-11.tar.gz`
- `data/users/users.json.bak-20260829T173337`
- контрольные суммы исходников в `data/backup/` и в этом tar.gz идентичны
