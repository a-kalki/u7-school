# Roadmap — порядок работ

> v5 (2026-09-15). Объединяющий документ: текущая последовательность инициатив и статус.
> Детальная проработка каждой инициативы — в папке [roadmap/](./roadmap/).
> История версий дорожной карты (v1–v3.1) — в шапке [roadmap/development-roadmap.md](./roadmap/development-roadmap.md).

---

## Последовательность работ

| # | Работа | Статус | Документ |
|---|--------|--------|----------|
| 1 | **bot-ui: персистентность сессий** — трек 6 `bot-ui-session-persist`: сессии и shortIds переживают рестарт сервиса | 🔥 активный трек создан, план 0/13 | [bot-ui-session-architecture.md](./roadmap/bot-ui-session-architecture.md), §9 |
| 2 | **Модуль задач** (tasks, этап B): `task-module` → `task-ui` → миграция бездействия и анкет-приглашений на задачи, удаление легаси `invite` (ФР-6) | концепция, архитектура и слои проработаны; декомпозиция на треки — при планировании | [tasks-system-architecture.md](./roadmap/tasks-system-architecture.md) |
| 3 | **Модуль сессий** (sessions): реестр взаимодействий людей (парное программирование, код-ревью, ...) → событие `session.completed` → анкеты peer-review | концепция готова; треки — при планировании | [sessions-system.md](./roadmap/sessions-system.md) |
| 4 | **Модуль метрик + витрина профиля** (Релиз 4): `packages/metrics` (агрегация QuestionnaireComplete → StudentMetrics), витрина профиля (студент + ментор), порог достоверности | ◐ частично: `peer-review` и `MetricAr` готовы, модуля `metrics` нет | [metrics-pipeline-and-modules.md](./roadmap/metrics-pipeline-and-modules.md) |
| 5 | **Модуль вклада** (contribution): балл вклада из кросс-анкет командных задач + явные фиксации вклада; блок «член сообщества» в профиле | концепция (не начат), после п. 4 | [contribution-system.md](./roadmap/contribution-system.md) |
| 6 | **DMG** — декларативные манифесты домена, сквозная типизация, `Result` вместо исключений, политики доступа, каузальный анализ | концепция (не начата) | [domain-manifest-graph.md](./roadmap/domain-manifest-graph.md) |
| 7 | **Контент, Релиз 5**: `basedOn`, visibility, CRUD, `contentSnapshot` → чистое UUID-дерево | не начат | [content-management.md](./roadmap/content-management.md), треки 1–2 |
| 8 | **Контент, Релиз 6**: Import/Export, Fork, publish-replace, gating | не начат | [content-management.md](./roadmap/content-management.md), треки 3–4 |

### Заметки к последовательности

- **Модуль `sessions`** (п. 3) добавляется **до модуля метрик**: концепция проработана ([sessions-system.md](./roadmap/sessions-system.md)) — учёт сессий выделяется из трека 3.3 [документа 3](./roadmap/metrics-pipeline-and-modules.md) в отдельный модуль, `peer-review` остаётся оркестратором анкет.
- Треки метрик 3.1+ (приглашения анкет через задачи) зависят от `task-module` / `task-ui` (п. 2).
- **Модуль `contribution`** (п. 5) — после модуля метрик (п. 4): опирается на `task` (командные задачи), `questionnaire` (анкеты вклада) и `metrics` (агрегация).
- Легаси `ProactiveSender.invite` и якорь `app/invite` (ФР-6) удаляются в рамках п. 2.
- Агрегация в модуле `metrics` (п. 4) не зависит от п. 2 и может начинаться параллельно; полный пайплайн «завершение модуля → анкеты → метрики» — после п. 2. Анкеты из сессий (п. 3) подключаются к пайплайну без изменений механики.

---

## Выполнено (история)

- **Релизы 1–3**: рефакторинг bot-ui v1 (инициатива I, [bot-ui-refactoring.md](./roadmap/bot-ui-refactoring.md), исторический) + инфраструктура метрик: EventBus, пакет `questionnaire`, `peer-review`, `MetricAr`.
- **Миграция bot-ui v3 «Диалог и Экран»**, треки 1–5 (+1.1): архивы `bot-ui-dialog-*_20260905`, `bot-story-helpers_20260912`. Остался трек 6 (п. 1 выше).
- **Tasks, этап A**: `userFacade.notify`, перенос чистых уведомлений (`user-notify_20260902`).
- **core/api-актор** (`core-api-actor_20260914`): код готов, ручные верификации фаз — за владельцем.

Полный список треков: [tracks.md](./tracks.md); завершённые — в [archive/](./archive/).

---

## Дочерние документы (папка roadmap/)

| Документ | Суть |
|---|---|
| [development-roadmap.md](./roadmap/development-roadmap.md) | историческая карта релизов 1–6, миграции, критерии готовности к проду |
| [bot-ui-session-architecture.md](./roadmap/bot-ui-session-architecture.md) | целевая архитектура bot-ui v3 «Диалог и Экран»: инварианты, контракты, декомпозиция |
| [bot-ui-refactoring.md](./roadmap/bot-ui-refactoring.md) | инициатива I (исторический), релизы 1–2 |
| [bot-ui-dialog-lifecycle.md](./roadmap/bot-ui-dialog-lifecycle.md) | история проработки жизненного цикла диалога (решено треком 1.1) |
| [metrics-system.md](./roadmap/metrics-system.md) | метрики: видение, принятые решения, связь документов |
| [metrics-conception.md](./roadmap/metrics-conception.md) | категории, шкалы, вопросы, формулы агрегации |
| [metrics-questionnaire-and-events.md](./roadmap/metrics-questionnaire-and-events.md) | движок анкет, EventBus, запуск анкет |
| [metrics-pipeline-and-modules.md](./roadmap/metrics-pipeline-and-modules.md) | пайплайн «событие → анкета → метрика», peer-review, metrics |
| [tasks-system.md](./roadmap/tasks-system.md) | задачи и уведомления: бизнес-концепция «pull вместо push» |
| [tasks-system-architecture.md](./roadmap/tasks-system-architecture.md) | архитектура модуля задач, четыре слоя, декомпозиция на треки |
| [tasks-system-scenarios.md](./roadmap/tasks-system-scenarios.md) | вертикальные сценарии, manual-задачи |
| [tasks-system-layers.md](./roadmap/tasks-system-layers.md) | метатипы TaskKindMeta/TaskTypeMeta, kind-рендереры |
| [sessions-system.md](./roadmap/sessions-system.md) | сессии: реестр взаимодействий людей, источник анкет навыков |
| [contribution-system.md](./roadmap/contribution-system.md) | вклад: кросс-анкеты командных задач, явные фиксации, блок «член сообщества» |
| [content-management.md](./roadmap/content-management.md) | управление контентом: basedOn, frozen snapshots, Import/Export, Fork |
| [domain-manifest-graph.md](./roadmap/domain-manifest-graph.md) | DMG: декларации, Result, политики, каузальный анализ |
