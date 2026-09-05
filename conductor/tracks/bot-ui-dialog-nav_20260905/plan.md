# План реализации — Трек: Стори навигации app/user/courses/streams (bot-ui-dialog-nav_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

> **Выполнено в треке 1 (bot-ui-dialog-core, Фаза 3):** домен `app` уже мигрирован —
> `AppController` (welcome-экран, help → info-реплика, main-menu/help-кнопки, экран меню
> через MenuAggregator) и `CommunityStory` переведены на `DialogResponse`/`Screen`/`md`
> вместе с их юнит-тестами (опережение трека 2: иначе welcome/help — скоуп Фазы 3 трека 1 —
> были мертвы). Остаток скоупа «app» здесь: только ревизия на предмет ставших ненужными
> хелперов и e2e-сценарии домена app.

## Фаза 1: app и user

- [x] Task: Написать падающие тесты стори app (community) на `DialogResponse`: edit-in-place своих экранов, мосты-кнопки — выполнено в треке 1 [3a58b33a]
- [x] Task: Перевести сторю app; удалить ставшие ненужными хелперы — стори переведена в треке 1 [3a58b33a]; ревизия хелперов — в Фазе 3 этого трека
- [ ] Task: Перевести user-notify путь на новый контракт (notify как реплика тон-канала)
- [ ] Conductor - User Manual Verification 'app и user' (Protocol in workflow.md)

## Фаза 2: courses и streams

- [ ] Task: Написать падающие тесты courses catalog и streams catalog/view-stream на `DialogResponse`
- [ ] Task: Перевести стори; delegate: enroll→menu, enroll-cancel→view, monitor→students; enroll-capture на `awaitInput`/`release`
- [ ] Task: InactivityStory: кнопочные проактивы → notify-текст, кнопочные подписки умирают (И3); обновить тесты
- [ ] Conductor - User Manual Verification 'courses и streams' (Protocol in workflow.md)

## Фаза 3: Финал трека 2

- [ ] Task: Проверки скоупа зелёные (тесты/линт/tsc затронутых файлов); grep: в скоупе не осталось `BotResponse`/`editOrSend`/`respondInContext`
- [ ] Task: Обновить блоки `ui-spec.md` затронутых экранов; создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
