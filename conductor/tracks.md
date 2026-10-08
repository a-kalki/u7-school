# Реестр треков

Порядок миграции bot-ui: 1 → 1.1 → 2 → (3 ∥ 4) → 5 → 6. Декомпозиция — в [bot-ui-session-architecture.md](./roadmap/bot-ui-session-architecture.md), §9.

**Релизные группы (порядок выката).** Несколько треков могут ехать одним тегом; внутри группы `main` между треками может быть в сломанном состоянии — в тег попадает только согласованное (`bun run check` зелёный).

- **`0.2.0` «Школа»** — `test-worlds` → `school-config` → `school-hub`. Отдельный тег под `test-worlds` не нужен (прод-поведение не меняется). Окно одно: env + миграция `streams.schoolId` + рестарт; внутри группы env/`list-scope-reviews`/резолверы переделываются без обратной совместимости.
- **`0.3.0` «Drill-down»** — `module-program-nav` → `course-catalog-nav`. Только после `0.2.0`; миграций нет.

Порядок треков внутри группы: `test-worlds` → `school-config` → `school-hub` → `module-program-nav` → `course-catalog-nav`. Причина: миры — базис тестов для всех последующих треков; школа — фундамент хаба; хаб выравнивает нейминг («Курсы», входы) до переписывания каталога; drill-down — сначала ядро, затем каталог.

---

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

---

- [ ] **Track: Школа как конфигурация уровня приложения (school-config)** — сущность `School` с `id` в модуле app (имя, описание, адрес, контакты, community- и student-группы); generic `ModuleResolver` в core + закрытие резолверов уровня app (`U7AppResolver`, `U7ModuleResolver`, дефолты в `U7UseCase`/`U7ApiModule`); резолв школы из env и проброс в API/UI; замена прямых `config.schoolGroup*`; единые имена env `COMMUNITY_GROUP_*`/`STUDENT_GROUP_*` без fallback; падение при отсутствии `NODE_ENV`; pre-fill wizard студенческой группой; Migration-инструкция в CHANGELOG. Видение продолжения — [schools-system.md](./roadmap/schools-system.md)
*Link: [./tracks/school-config_20260928/](./tracks/school-config_20260928/)*

---

- [ ] **Track: Хаб «Школа» (school-hub)** — разделение осей «🏫 Школа» (место) и «📖 Курсы» (материалы авторов); контроллер `school` с карточкой школы и «Наши менторы»; экран «Инфо»; перенос в хаб кнопок «Сообщество» и «Потоки курсов»; `Stream.schoolId` и экран «Отзывы» (только чтение, отзывы по потокам школы); переименование «Программы курсов» → «Курсы». Общая концепция школ — [schools-system.md](./roadmap/schools-system.md)
Зависит от `school-config_20260928` (тип `School`, `appResolver.school`).
*Link: [./tracks/school-hub_20260928/](./tracks/school-hub_20260928/)*

---

- [ ] **Track: Программа модуля — drill-down навигация** — единое ядро карточной drill-down навигации (модуль → проект → урок → шаг) с листанием в пределах уровня, нумерацией и подуровнями; студент (`📂 Уроки`: статусы, тела пройденных+текущего) и ментор (`📖 Программа модуля`: без статусов, всё открыто). `▶️ Продолжить учёбу` не меняется.
*Link: [./tracks/module-program-nav_20260928/](./tracks/module-program-nav_20260928/)*

---

- [ ] **Track: Каталог курсов — drill-down навигация** — перевод «Программ курсов» (`course-catalog`) на общее ядро drill-down: курс → этап → модуль → проект → урок (шаги только заголовками, внутрь нельзя), листание и пояснения; wish-сценарии сохраняются. Зависит от `module-program-nav_20260928`.
*Link: [./tracks/course-catalog-nav_20260928/](./tracks/course-catalog-nav_20260928/)*

---

- [x] **Track: Контент модуля «Алгоритмика: ядро» (m2) — вывод П12, переименование модулей** — приведение `data/fullstack-js/m2-algorithm-core` к плану (П1–П11, П13, П14; 13 проектов) и доведение m2 до `data/courses/*.json`; вывод проекта «Бизнес-утилиты» (П12) в будущий модуль «Алгоритмика: прикладное» (прод-версия в БД — `archived`, переработанные md — перенос в `m3-algorithm-applied`); переименование каталогов `m2-algorithm-core`/`m4-html-css`/`m5-dom`; модуль-пустышка «Алгоритмика: прикладное»; новые потоки без archived-проекта, старые снапшоты не ломаются. Работаем в dev; прод и снапшот потока 7 — за рамками трека. Завершён 2026-10-05 (гейт: 2535 pass / 0 fail), итоги — в [summary](./archive/m2-content-sync_20261001/summary.md).
*Link: [./archive/m2-content-sync_20261001/](./archive/m2-content-sync_20261001/)*

---

- [x] **Track: Учебный материал «Алгоритмика: прикладное» — бизнес-утилиты + HTTP-сервис** — наполнение модуля (draft, вне курса): П1 «Бизнес-утилиты» (7 уроков, 50 шагов) и П2 «HTTP-сервис» (8 уроков, 77 шагов, сдача через 2 PR). Уложен в data/courses/*.json со статусом published. Завершён 2026-10-08 (гейт: 2535 pass / 0 fail), итоги — в [summary](./tracks/m3-applied-http_20261005/summary.md).
*Link: [./tracks/m3-applied-http_20261005/](./tracks/m3-applied-http_20261005/)*
