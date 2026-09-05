# План реализации — Трек: Стори навигации app/user/courses/streams (bot-ui-dialog-nav_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: app и user

- [ ] Task: Написать падающие тесты стори app (community) на `DialogResponse`: edit-in-place своих экранов, мосты-кнопки
- [ ] Task: Перевести сторю app; удалить ставшие ненужными хелперы
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
