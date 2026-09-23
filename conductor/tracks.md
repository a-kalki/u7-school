# Реестр треков

Порядок миграции bot-ui: 1 → 1.1 → 2 → (3 ∥ 4) → 5 → 6. Декомпозиция — в [bot-ui-session-architecture.md](./roadmap/bot-ui-session-architecture.md), §9.


- [x] **Track: Кампании судьбы студента (peer-review v4)** — персональные кампании (`subjectId`, триггеры `student.completed`/`student.abandoned`, ментор — соавтор в кампании субъекта), мультисобытийная подписка ER в core, ER вместо UC создания, 4-значная проекция исходов, пользовательские UC, фасад, json-репо, сборка. Завершён, итоги — в [summary](./archive/peer-review-campaign_20260918/summary.md)
*Link: [./archive/peer-review-campaign_20260918/](./archive/peer-review-campaign_20260918/)*

---

- [x] **Track: Пагинация UI — универсальный пагинатор** — ядро `Paginator` в core `ui/pagination` (транспорт-независимое: блоки + лимит → страницы из целых элементов с курсорами), бот-наследник `BotPaginator` и системный кеш `DialogCache` (сброс при смене диалога) в core `ui/bot`; адресация номером страницы в callback (UUID-сжатие позиционно-независимо); перенос всех существующих обрезок `#truncate` на пагинатор (streams S03 дерево программы, courses S00 уровни каталога 0–4); e2e ≥3 страницы + fixtures для dev:fixtures. Идёт раньше трека peer-review-ui. Завершён, итоги — в [summary](./archive/pagination_20260919/summary.md)
*Link: [./archive/pagination_20260919/](./archive/pagination_20260919/)*

---

- [x] **Track: UI отзывов (peer-review)** — экраны S01–S07 по утверждённой спеке, приглашения по событиям судьбы студента (субъекту и ментору, `student-campaign.created`), хаб «Мои отзывы» с рендером по `myRole`, кнопка карточки потока. Зависел от peer-review-campaign, pagination и peer-review-outcomes (завершены, в архиве). Завершён 2026-09-23 (гейт: 2481 pass / 0 fail), итоги — в [summary](./archive/peer-review-ui_20260916/summary.md)
*Link: [./archive/peer-review-ui_20260916/](./archive/peer-review-ui_20260916/)*

---

- [ ] **Track: Тестовые миры** — декларативные миры вместо ручных JSON-фикстур: world-kit (конструкторы с инвариантами, детерминированные uuid, хронология), WorldState нейтральный к хранилищу (задел под будущие СУБД), материализация с кешем по хешу исходников, копии тестам; миры `core-education`/`minimal`; перевод всех текущих тестов; удаление templates. Концепция — [test-worlds.md](./guides/test-worlds.md)
*Link: [./tracks/test-worlds_20260923/](./tracks/test-worlds_20260923/)*

---

- [x] **Track: Исходы и форма кампании peer-review (+предусловия UI)** — 4-значная проекция исходов (завершил и прошел / завершил и не прошел / забросил / не начал), форма кампании (`participants` — id адресуемых, `subjectOutcome`/`mentorId` в payload), `direction` в отзыве, read-API stream (статусы в getMembers), событие с полными данными, `myOutcome` в UC, async `menuButtons` (core), batch-UC `get-users-by-ids` (user), синхронизация трека peer-review-ui. Завершён, итоги — в [summary](./archive/peer-review-outcomes_20260920/summary.md)
*Link: [./archive/peer-review-outcomes_20260920/](./archive/peer-review-outcomes_20260920/)*

---

- [ ] **Кандидат: Групповая регистрация — перенос `group-handler` (регистрация при добавлении в группу школы) в зону app-контроллера**
*Источник: решения владельца при ревизии ФР-4 (трек 1.1, сессия 2026-09-06): регистрация пользователей при добавлении в группу школы — ответственность системного контроллера приложения, как и гост-регистрация на `/start` и `/log_level`. Трек ещё не создан: скоуп и декомпозиция — при планировании.*
