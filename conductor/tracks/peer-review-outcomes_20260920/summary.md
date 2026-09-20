# Итоги трека: Исходы и форма кампании peer-review (+предусловия UI)

**Трек:** `peer-review-outcomes_20260920`
**Дата:** 2026-09-20 – 2026-09-21
**Контракты UX:** [peer-review/ui-spec.md](../../../apps/u7-bot/src/controllers/peer-review/ui-spec.md) (обновлён 2026-09-20)
**Концепция:** [peer-review-system.md](../../roadmap/metrics/peer-review-system.md) (v4.1)

## Цель

Домен-выравнивание peer-review под решения сессии 2026-09-20 и предусловия
продолжения трека peer-review-ui_20260916: 4-значная проекция исходов, форма
кампании (`subjectOutcome`/`mentorId` в payload, `participants` без
ролей/статусов), `direction` в отзыве, read-API stream, событие с полными
данными, `myOutcome` в UC, асинхронные `menuButtons` в core, batch-UC
пользователей.

## Что сделано

- **Фаза 1** (ed13ac3): `StudentOutcome` — 4 значения (`completed_passed` /
  `completed_not_passed` / `dropped` / `never_started`, `in_progress` и
  склеенный `completed` удалены); контекст `stream_fate` с payload
  `{subjectOutcome, mentorId}` и `participants: uuid[]`; Review — `direction`
  (невозможная пара исключена типом) + `authorOutcome`-снапшот; `ReviewPolicy`
  упразднена — адресация в агрегате (e6a82a2, dd6b9e7, 5e071ac).
- **Фаза 2** (b948be8): `StreamFacade.getMembers` — статус студента
  (advanced/not_advanced/abandoned/…) + `neverStarted`.
- **Фаза 3** (edd739e): ER `create-student-campaign` — фильтрация участников
  по событию («завершил» → завершившиеся + учащиеся без субъекта; «покинул» →
  пусто), проекция `subjectOutcome`; событие `student-campaign.created` —
  payload с `mentorId` и `subjectOutcome`.
- **Фаза 4** (4cb69c2): UC `get-campaign-recipients` — `myOutcome`
  (текст-подсказки S05), `deliverables` удалены; фикстуры кампаний/отзывов
  созданы с нуля в новой форме + оживление окна при посеве (32a9b28).
- **Фаза 5** (83a92f5): async-`menuButtons` — `Promise<MenuButton[]>` в
  `U7BotUiStory`/`U7BotController`/`u7-menu`, параллельный сбор в ui-app,
  упавшая проверка скрывает кнопку + warn (меню живо); обновлены все
  реализации (streams, learning, app, mentor, courses) и тесты (29c82b6).
- **Фаза 6** (4b2c8e2): batch-UC `get-users-by-ids` (uuid[], лимит ~100,
  дедуп, ненайденные — пропуск + warn) — имена без N+1 для S02/S07.
- **Фаза 7** (249de052): тексты S05 «о менторе» — 4 варианта по `myOutcome`
  (79b89aa, финализирован черновик «не прошёл»); синхронизация spec/plan
  трека peer-review-ui (снята приостановка) и концепции §2/§3/§5 (f5a664c,
  08fc9fe); ui-spec ✅; чистота репозитория.

## Итоговые решения

- Разделение «прошёл / не прошёл» хранит сам peer-review (подсказки S05,
  лейблы автора S07) — вопреки ранней оговорке v3.1.
- «Ещё учится» не хранится вовсе: фильтрацию состава делает ER по живому
  событию, снапшот статусов в кампании не нужен.
- Отзыв хранит `direction` вместо пары ролей; `recipientOutcome` не вводится —
  статус адресата нигде не показывается.
- Видимость меню — асинхронный контракт core: фасадные проверки (живые
  кампании и т.п.) не блокируют сбор меню.

## Качество

- `CI=true bun run check`: exit 0 — biome + tsc чисто, 2403 pass / 0 fail
  (236 файлов); промежуточных состояний нет.
- Все верификации фаз подтверждены владельцем (2026-09-20/21).

## Дальше

- Трек [peer-review-ui_20260916](../../tracks/peer-review-ui_20260916/index.md)
  разблокирован: Фаза 2 (хаб S02 + async-меню), Фаза 3 (приглашения S01),
  Фаза 4 (просмотр S07 + batch-имена + пагинация).
