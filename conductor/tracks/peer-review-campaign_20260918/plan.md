# План: Кампании судьбы студента (peer-review v4)

> Спецификация: [spec.md](./spec.md). Концепция: [peer-review-system](../../roadmap/metrics/peer-review-system.md) (v4).
> Порядок фаз обязателен: 1 → 2 → 3 → 4 → 5 → 6. Внутри фазы — сверху вниз.
> Поглощённый трек: [peer-review-domain_20260916](../../archive/peer-review-domain_20260916/plan.md)
> (зона stream — фазы 1–2 — принята и в силе).

## Фаза 1. Core: мультисобытийная подписка ER `[checkpoint: 41aff1a]`

- [x] Task: `EventReaction.eventNames` (ФР-1) — `ErMeta` по юниону событий, подписка модуля на каждое имя, `ErDocType.eventNames`; тест-реакция со сужением по `eventName` и exhaustive-веткой `[c67f76f]`
    - [ ] Red: тесты каркаса (подписка на оба имени, типизация юниона)
    - [ ] Green: реализация (`eventName` → `eventNames`)
- [x] Task: Миграция 4 ER модуля `wish` на `eventNames` — поведение и тесты не меняются `[eb23c28]`
    - [ ] Green: миграция + прогон тестов wish
- [x] Task: Styleguide `event-reaction.md` — правило мультисобытийности (юнион в ErMeta, явный список имён, сужение по дискриминанту) `[371e6bb]`
    - [ ] Green: правка доки
- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2. Домен peer-review: каркас v4 `[checkpoint: 01f5594]`

- [x] Task: `entity` (ФР-2) — `subjectId`; контекст `stream_ended`; `ParticipantOutcome` + `in_progress`; инварианты (субъект в participants, исход субъекта терминален, userId уникальны) `[2afa72c]`
    - [x] Red: тесты схем/валидации/инвариантов
    - [x] Green: реализация
- [x] Task: Фабрика (ФР-3) — `createStudentCampaign({scopeId, subjectId, participants, now})`, `restore(state)`; окно 7 дней от now `[d4b98bb]`
    - [x] Red: тесты (окно, restore, инварианты субъекта)
    - [x] Green: реализация
- [x] Task: Событие `student-campaign.created` (ФР-5) — payload `{campaignId, context, scopeId, subjectId}` `[d4b98bb]`
    - [x] Red: тест события
    - [x] Green: реализация
- [x] Task: `ReviewPolicy` (ФР-4) — субъект completed → ментор + соученики completed/in_progress; субъект dropped/never_started → только ментор; ментор → только субъект; запрет «о себе» `[93e98e8]`
    - [x] Red: тесты всех веток
    - [x] Green: реализация
- [x] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md) `[01f5594]`

## Фаза 3. API: ER создания студенческих кампаний `[checkpoint: 7e05702]`

- [x] Task: Контракт `ReviewCampaignRepo` — `findBySubject(scopeId, subjectId)` (идемпотентность ER), `findActiveBySubject(userId)`, `findActiveByMentor(userId)`, `save` `[$SHA]`
    - [x] Green: интерфейс
- [x] Task: `create-student-campaign-er` (ФР-6) — подписка `student.completed` + `student.abandoned` (юнион, сужение по `eventName` при необходимости): идемпотентность, фасад stream, проекция исходов (4 значения), фабрика, save, `eventBus.publish` `[1d3362c]`
    - [x] Red: тесты ER (оба события, идемпотентность, снапшот, публикация)
    - [x] Green: реализация
- [x] Task: Удаление `create-campaign-uc`, `stream-completed-er`, `create-campaign-cmd.ts` (команды/меты); `module.ts` — `useCases: []`, `reactions: [CreateStudentCampaignEr]`; `PeerReviewUcMetas` `[1846ea1]`
    - [x] Green: чистка + прогон
- [x] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md) `[7e05702]`

## Фаза 4. API: пользовательские UC и фасад `[checkpoint: c6d53013]`

- [x] Task: `get-my-campaigns-uc` (ФР-7) — `myRole: 'subject' | 'mentor'` в ответе; `only_lives` (прогресс M/K, остаток дней) и `filter` `[3750649]`
    - [x] Red: тесты (роли, живость, фильтры, прогресс)
    - [x] Green: реализация
- [x] Task: `get-campaign-recipients-uc` — роль автора из кампании, адресаты по политике, признак «мой отзыв есть» `[06a311e1]`
    - [x] Red: тесты (ветки политики по ролям, ✅-признак)
    - [x] Green: реализация
- [x] Task: `create-review-uc` — `ensureLive`, адресат политикой, create/overwrite `[b2e53172]`
    - [x] Red: тесты (создание, перезапись, истёкшее окно, чужой адресат, дубль пары)
    - [x] Green: реализация
- [x] Task: `list-scope-reviews-uc` — отзывы скоупа, группировка по адресатам, снапшоты `[34d7b31]`
    - [x] Red: тесты
    - [x] Green: реализация
- [x] Task: Фасад (ФР-8) — `hasLiveCampaigns`, `hasReviews`, `listScopeFacts`; только делегирование (query-UC) `[3856fe64]`
    - [x] Red: тесты фасада
    - [x] Green: реализация
- [x] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)

- [x] Task: Рефакторинг по ревью: домен вместо логики в UC; переиспользование схем entity `[a060804f]`
    - [x] Red: AR `authorshipOf`/`assertCanWrite`, DS `campaign-facts-ds`/`scope-reviews-ds`
    - [x] Green: реализация домена
    - [x] cmd-схемы — композиция из entity/shared (без переопределений)
    - [x] UC — только оркестрация; `ReviewRepo.findByCampaignAndAuthor`

## Фаза 5. Инфраструктура и сборка

- [x] Task: `review-campaign-json-repo` (ФР-9) — уникальность `(scopeId, subjectId)`, `findBySubject`, `findActiveBySubject`, `findActiveByMentor` `[678981a]`
    - [ ] Red: тесты репо
    - [ ] Green: реализация
- [x] Task: `review-json-repo` — уникальность пары, выборки по кампании/скоупу `[a3b84d4]`
    - [ ] Red: тесты репо
    - [ ] Green: реализация
- [ ] Task: `peer-review-bootstrap` (подписка ER) + регистрация модуля в `create-api-app.ts`
    - [ ] Green: сборка + smoke
- [ ] Task: Интеграционный тест вертикали: `student.completed` → ER → кампания → отзыв → чтение
    - [ ] Red/Green
- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)

## Фаза 6. Финал трека

- [ ] Task: Полный прогон `bun run check` (lint + tslint + тесты), триаж красных по workflow
- [ ] Task: Обновить §5 [концепции](../../roadmap/metrics/peer-review-system.md) при отклонениях от плана
- [ ] Task: Создать summary.md трека (решения, файлы, отклонения)
- [ ] Task: Conductor - User Manual Verification 'Фаза 6' (Protocol in workflow.md)
