# Реестр треков

Порядок миграции bot-ui: 1 → 1.1 → 2 → (3 ∥ 4) → 5 → 6. Декомпозиция — в [bot-ui-session-architecture.md](./roadmap/bot-ui-session-architecture.md), §9.

**Релизные группы (порядок выката).** Несколько треков могут ехать одним тегом; внутри группы `main` между треками может быть в сломанном состоянии — в тег попадает только согласованное (`bun run check` зелёный).

- **`0.2.0` «Школа»** — `test-worlds` → `school-config` → `school-hub` (завершена, все треки в [архиве](./archive/)).
- **`0.3.0` «Drill-down»** — `module-program-nav` → `course-catalog-nav` → `unified-drilldown-nav` (завершена, все треки в [архиве](./archive/)). Только после `0.2.0`; миграций нет.

Порядок треков внутри группы: `module-program-nav` → `course-catalog-nav`. Причина: drill-down — сначала ядро, затем каталог.

---

- [x] **Track: Программа модуля — drill-down навигация** — единое ядро карточной drill-down навигации (модуль → проект → урок → шаг) с листанием в пределах уровня, нумерацией и подуровнями; студент (`📂 Уроки`: статусы, тела пройденных+текущего) и ментор (`📖 Программа модуля`: без статусов, всё открыто). `▶️ Продолжить учёбу` не меняется.
*Link: [./archive/module-program-nav_20260928/](./archive/module-program-nav_20260928/)*

---

- [x] **Track: Каталог курсов — drill-down навигация** — перевод «Программ курсов» (`course-catalog`) на общее ядро drill-down: курс → этап → модуль → проект → урок (шаги только заголовками, внутрь нельзя), листание и пояснения; wish-сценарии сохраняются. Зависит от `module-program-nav_20260928`.
*Link: [./archive/course-catalog-nav_20260928/](./archive/course-catalog-nav_20260928/)*

---

- [x] **Track: Унификация drill-down навигации и хлебных крошек (Курсы, Ментор, Студент)** — приведение отображения карточек, хлебных крошек (активный уровень жирным, имя шага вместо «Шаг 1») и компактных кнопок (`1. Название` без эмодзи) во всех хабах к единому стандарту ядра `presentNavLevel`; починка регресса тестов.
*Link: [./archive/unified-drilldown-nav_20261015/](./archive/unified-drilldown-nav_20261015/)*

---

- [x] **Track: События мессенджера (группы и чаты) — абстракция в Core, обработчики в School и Stream, ProactiveSender.execute** — единая модель мессенджерских событий (`MessengerEvent`) и действий (`MessengerAction` в `ProactiveSender.execute`); централизованная регистрация гостя в `U7BotUiApp`; перенос логики школьной группы в `SchoolController` (роль `SUBSCRIBER` с починкой `UserPolicy`), а учебных групп (FR-7 и посторонние) — в `StreamController`; удаление процедурного `group-handler.ts`.
*Link: [./archive/messenger-events_20261016/](./archive/messenger-events_20261016/)*
