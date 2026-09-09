# План реализации — Трек: Стори навигации app/user/courses/streams (bot-ui-dialog-nav_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

> **Выполнено в треке 1 (bot-ui-dialog-core, Фаза 3) и треке 1.1 (фазы 2.1–2.2):** домен `app` уже на новом контракте — после ревизии ФР-4 welcome/help/меню собирает `U7BotUiApp` из декларативных `menuButtons(actor)` (welcome-экран, общий help, короткое меню, системные кнопки `app:main-menu`/`app:help`); `AppController` — `menuButtons` (помощь) + override `/log_level`; `CommunityStory` — кнопка сообщества; всё на `DialogResponse`/`Screen`/`md` с юнит-тестами. Остаток скоупа «app» здесь: только ревизия на предмет ставших ненужными хелперов и e2e-сценарии домена app.

## Фаза 1: app и user

- [x] Task: Написать падающие тесты стори app (community) на `DialogResponse`: edit-in-place своих экранов, мосты-кнопки — выполнено в треке 1 [3a58b33a]
- [x] Task: Перевести сторю app; удалить ставшие ненужными хелперы — стори переведена в треке 1 [3a58b33a]; ревизия хелперов — в Фазе 3 этого трека
- [x] Task: Перевести user-notify путь на новый контракт (реплика `notify { text, kind? }` — единая таблица ФР-5, вид `notify` 🔔) — e84516e3
- [x] Conductor - User Manual Verification 'app и user' (Protocol in workflow.md)

## Фаза 2: courses и streams

- [x] Task: Написать падающие тесты courses catalog и streams catalog/view-stream на `DialogResponse` [6c5edfa]
- [x] Task: Перевести стори; delegate: enroll→menu, enroll-cancel→view, monitor→students; enroll-capture на `awaitInput`/`release`; команды — дефолт pipe (`pass`), ошибки валидации — `errorNotify` [7c3ecf4]
- [x] Task: **Удалить кнопку «🔔 Уведомить о наборе»** из `view-stream.story.ts` (мёртвая — обработчика `notify:` нет, пользователи тычут в неё и получают «Неизвестная команда»; решение владельца — фичи не будет) [d2299e5]
- [x] Task: InactivityStory: кнопочные проактивы → notify-текст, кнопочные подписки умирают (И3); обновить тесты [7034c7e]
- [ ] Conductor - User Manual Verification 'courses и streams' (Protocol in workflow.md)

## Фаза 3: Финал трека 2

- [x] Task: Проверки скоупа зелёные (тесты/линт/tsc затронутых файлов); grep: в скоупе не осталось `BotResponse`/`editOrSend`/`respondInContext`
- [x] Task: Добивка тестовой миграции (HANDOFF): inactivity e2e, curious-showcase e2e, integration courses/streams — на `DialogResponse` (0 fail по скоупу); фикс прод-бага md-литерала FR-7 в group-handler; тест-стенд расширен хелперами нажатий [79dacb12, a8b7e3bf, 6aa17591, 94fa7a1e]
- [x] Task: Обновить блоки `ui-spec.md` затронутых экранов; создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
