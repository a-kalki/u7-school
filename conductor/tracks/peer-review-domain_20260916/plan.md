# План: Домен и API отзывов (peer-review)

> Спецификация: [spec.md](./spec.md). Концепция: [peer-review-system](../../roadmap/metrics/peer-review-system.md).
> Порядок фаз обязателен: 1 → 2 → 3 → 4 → 5. Внутри фазы — сверху вниз.

## Фаза 1. Зона stream: событие и инвариант завершения

- [ ] Task: Событие `stream.completed` в агрегате потока — падающий тест `StreamAr.complete()` кладёт событие (`streamId` в payload); тип события в `events.ts` по образцу `StreamCreatedEvent`
    - [ ] Red: тест события
    - [ ] Green: реализация `addEvent` в `complete()`
- [ ] Task: Публикация события — `CompleteStreamUc` вызывает `publishEvents` после `save`
    - [ ] Red: тест UC (событие доходит до шины)
    - [ ] Green: реализация
- [ ] Task: Инвариант терминальности (ФР-2) — `StreamAr.complete()` принимает статусы студентов и блокирует завершение при `active`/`enrolled` с перечислением нетерминальных в ошибке; UC передаёт статусы из репо студентов
    - [ ] Red: тесты агрегата (active блокирует; enrolled блокирует; все терминальные — успех) + тест UC
    - [ ] Green: реализация (агрегат + UC)
- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2. Домен peer-review: сущности, агрегаты, политика

- [ ] Task: Схемы и типы — `ReviewCampaign` (каркас + payload по `context`), `CampaignParticipant` (`userId`, `role`, `studentStatus`, `neverStarted`), `Review` (вал. текста 10–3500), константы окна (`REVIEW_WINDOW_DAYS = 7`), доменные ошибки (окно закрыто, дубликат пары и пр.)
    - [ ] Red: тесты схем/валидации
    - [ ] Green: реализация entity/констант/ошибок
- [ ] Task: `ReviewCampaignAr` — `isExpired(now)`, `daysLeft(now)`, доступ к участникам; `expiresAt` выставляется только при создании
    - [ ] Red: тесты (свежая/истёкшая/граница окна)
    - [ ] Green: реализация агрегата
- [ ] Task: `ReviewCampaignFactory` (ФР-3) по образцу `QuestionnaireFactory`: `createStreamCompleted(scopeId, participants, now)` — вычисляет `expiresAt` из константы окна; `restore(state)` по дискриминанту `context`
    - [ ] Red: тесты фабрики (окно, restore по контексту)
    - [ ] Green: реализация
- [ ] Task: `ReviewAr` — `create()` (снапшоты ролей/статуса автора из кампании), `overwrite(text)` (валидация длины)
    - [ ] Red: тесты агрегата
    - [ ] Green: реализация
- [ ] Task: `ReviewPolicy` (ФР-5) — адресаты по статусу автора; запрет «о себе»
    - [ ] Red: тесты всех веток (advanced/not_advanced/abandoned+neverStarted/ментор)
    - [ ] Green: реализация
- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3. API: модуль, UseCase'ы, ER, фасад

- [ ] Task: `PeerReviewApiModuleMeta` + резолвер (зависимости: stream-фасад, репозитории, eventBus)
    - [ ] Green: каркас модуля + регистрация резолвера
- [ ] Task: `create-campaign-uc` — сбор участников фасадом stream, `neverStarted` — через API статусов студента (трек `student-status`), фабрика, save, событие `campaign.created` (ФР-6)
    - [ ] Red: тесты (создание, expiresAt, снапшот, публикация события)
    - [ ] Green: реализация
- [ ] Task: `stream-completed-er` (ФР-7) — подписка на `stream.completed`, вызов UC, идемпотентность (повтор события — не дубль кампании)
    - [ ] Red: интеграционный тест ER
    - [ ] Green: реализация
- [ ] Task: `get-my-campaigns-uc` — живые кампании юзера, прогресс M/K, остаток дней
    - [ ] Red: тесты (живая/истёкшая, прогресс)
    - [ ] Green: реализация
- [ ] Task: `get-campaign-recipients-uc` — адресаты по политике + «мой отзыв есть»
    - [ ] Red: тесты (ветки политики, ✅-признак)
    - [ ] Green: реализация
- [ ] Task: `create-review-uc` — окно, адресат, create/overwrite (ФР-6)
    - [ ] Red: тесты (создание, перезапись, истёкшее окно, чужой адресат, дубль пары)
    - [ ] Green: реализация
- [ ] Task: `list-scope-reviews-uc` — отзывы скоупа, группировка по адресатам, снапшоты для рендера
    - [ ] Red: тесты
    - [ ] Green: реализация
- [ ] Task: Фасад (ФР-9) — `hasLiveCampaigns`, `hasReviews`, `listScopeFacts`
    - [ ] Red: тесты фасада
    - [ ] Green: реализация
- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4. Инфраструктура и сборка

- [ ] Task: `review-campaign-json-repo` (уникальность кампании по скоупу/контексту, запросы живых по юзеру) — по образцу существующих json-репо
    - [ ] Red: тесты репо
    - [ ] Green: реализация
- [ ] Task: `review-json-repo` (уникальность пары, выборки по кампании/скоупу)
    - [ ] Red: тесты репо
    - [ ] Green: реализация
- [ ] Task: `peer-review-bootstrap` (подписка ER) + регистрация модуля в `create-api-app.ts`
    - [ ] Green: сборка + smoke-тест приложения
- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)

## Фаза 5. Финал трека

- [ ] Task: Полный прогон `bun run check` (lint + tslint + тесты), триаж красных по workflow
- [ ] Task: Обновить концепцию [peer-review-system.md](../../roadmap/metrics/peer-review-system.md) §5 (статус трека) при отклонениях от плана — зафиксировать в summary.md
- [ ] Task: Создать summary.md трека (решения, файлы, отклонения)
- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)
