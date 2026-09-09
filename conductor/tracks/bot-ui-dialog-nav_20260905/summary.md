# Итоговый отчёт — Трек: Миграция Bot UI на контракт «Диалог и Экран» (трек 2)

**Дата:** 2026-09-05

## Цель

Перевести скоуп трека (user-notify путь; стори контроллеров app/user/courses/streams)
с устаревшего `BotResponse { sendMessage, parseMode, escapeMarkdown }` на контракт
«Диалог и Экран» — `DialogResponse { screen, notify, awaitInput, release, delegate }`
(md-тексты, `menuButtons` вместо `handleStart`, дефолт pipe для команд).
Правило «трек уменьшает»: всё, что трек трогал, целиком на новом контракте.

## Выполненные задачи

### Фаза 1: app и user

- Ядро контракта (`packages/core/src/ui/bot/`): `BotUiApp`/`BotController`/
  `BotUiStory`, `DialogResponse`, `ProactiveSender { notify, invite, kickFromGroup }`,
  транспорт `BotTransport` (apps/u7-bot/src/infra/bot-transport.ts): enterDialog/
  seq-эпохи, единая таблица видов реплик ФР-5 (🔔 notify / ℹ️ info / ⚠️ warn),
  `assertMarkdownV2Safe` fail-fast.
- `user-notify`: ER/UC → событие `user.notified` → сторя `notify` — доставка
  проактивных уведомлений через `proactiveSender.notify` без кнопок [e84516e3].
- Правки ядра и транспорта по итогам ревью (крошки, delegate команд, константы,
  кнопки ошибок) [a625c435].

### Фаза 2: courses и streams

- **Red**: переписаны тесты stream-catalog, course-catalog, view-stream и
  контроллеров на `DialogResponse` (78 red) [6c5edfa2].
- **Green**: три стори переведены на новый контракт: экранные тексты — MdText
  (md/mdConcat/mdJoin), delegate-контракты сохранены (enroll → app:main-menu,
  enroll-cancel → view, monitor→students), enroll-захват на `awaitInput`/
  `release` (контекст кодового слова в `session.dialog.input`), команды —
  дефолт pipe, ошибки валидации — `errorNotify`, `menuButtons` вместо
  `handleStart` [7c3ecf44].
- Ядро: `#dispatch` → `protected dispatch` — прикладной `U7BotUiApp` перехватывает
  `app:main-menu` единой точкой для кнопок и delegate (симметрия §10.19);
  меню — виртуальный якорь `app/menu`, короткое меню собирает uiApp.
- Удалена мёртвая кнопка «🔔 Уведомить о наборе» (обработчика не было;
  фича отменена владельцем) [d2299e52].
- InactivityStory: проактивы (warning студенту 5+, candidate ментору 7+) →
  `notify`-текст без кнопок с подсказкой /start (И3); кнопочные ветки
  drop-student/mark-abandoned удалены (самовыход — меню, снятие — monitor);
  сохранены 3 подписки и мягкий кик из TG-группы (FR-6) [7034c7e3].
- `ui-spec.md` обновлены: streams (S02 — без 🔔, коды кнопок по факту; S10 —
  awaitInput-сценарий; SIN-W/SIN-M — notify-тексты), courses (контракт-плашка,
  errorNotify в W04).

### Фаза 3: добивка тестовой миграции (HANDOFF-сессия)

- InactivityStory e2e переписан на проактивы без кнопок: warning/candidate —
  notify-текст с подсказкой /start (И3), мягкий кик (FR-6), callback-тупик
  («Неизвестная команда» на легаси-кнопку), chat_member left (FR-7);
  снятие ментором — UC mark-abandoned напрямую (кнопочная сцена — долг
  трека mentor) [a8b7e3bf].
- **Прод-баг доставки FR-7**: неэкранированная точка в md-литерале
  group-handler глушила уведомление ментору «покинул группу»
  (MarkdownV2ValidationError изолировался warn'ом) — исправлено [79dacb12].
- curious-showcase e2e (18 тестов) — на DialogResponse и отштампованные
  нажатия; найдена и задокументирована ловушка хронологии Api-записей
  (edit привязан к messageId sent) [6aa17591].
- Integration courses/streams (catalog, view-stream, course-catalog,
  wish-flow — 36 тестов) — на DialogResponse; прямые вызовы стори —
  крафтовые коды с актуальным штампом; enroll-key на awaitInput;
  сжатие UUID — по Api-записи [94fa7a1e].
- Тест-стенд расширен (без ломки API): screensNewFirst / pressedCode /
  currentStamp / stampedCode [94fa7a1e].

## Ключевые решения

- **Перехват системных кодов в dispatch** (§10.19): `packages/core` открывает
  seam `protected dispatch`; перехват `app:main-menu` живёт в `U7BotUiApp` —
  кнопка «↩️ Главное меню» и `delegate: { path: 'app:main-menu' }` ведут
  одинаково: enterDialog `app/menu` (switch) + короткое меню без приветствия.
- **Enroll-захват** через `awaitInput { context }` / `release`: переспрос —
  warn-реплика (экран не захватывается), исчерпание попыток — release + экран
  возврата; `handleMessage` стори читает контекст из `session.dialog.input`.
- **Проактивы без кнопок** (И3): notify не трогает сессию; получателю без
  открытого диалога в тексте подсказан `/start`. Кнопочные самообслуживания
  переехали в меню/monitor (треки 3/5).
- **Мёртвые кнопки удаляются, не чинятся** (решение владельца): «🔔 Уведомить
  о наборе» удалена.

## Состояние проверок

Полный прогон `CI=true bun test apps/u7-bot/src apps/u7-bot/tests`:
**508 pass / 94 fail**, все 94 — чужие домены (промежуточное состояние,
мигрируются треками-владельцами), скоуп трека — **0 fail**.

| Группа | Фейлов | Владелец |
|---|---|---|
| Скоуп трека: app/user/courses/streams + ядро (юниты + integration + e2e) | 0 | этот трек |
| learning: LearningController int (9), NavTree (6), Progress (2), Hub (1) | 18 | трек 3 (hub) |
| mentor: MonitorStory (26), CreateStreamStory (15), ViewStreamMentorStory (8), mentor-management e2e (7), wizard int (3) | 59 | трек 5 (mentor) |
| questionnaire: wish-questionnaire e2e (7), Questionnaire UX e2e (5), InviteStory (5) | 17 | трек questionnaire |

Причина красноты чужих доменов: тесты старого контракта (`sendMessage`,
`escapeMarkdown`, `captureInput`) против мигрированного ядра — восстанавливаются
при миграции домена его треком, не являются регрессом скоупа.

- Lint (biome): чисто.
- tsc: скоуп трека и затронутые файлы — чисто. Оставшаяся краснота —
  заявленное промежуточное состояние (learning/mentor/questionnaire
  контроллеры и их тесты; e2e-стенды, подключающие их контроллеры:
  main-menu, curious-showcase): мигрируются треками 3 (hub) и 5
  (mentor/monitor).
- Grep скоупа: `BotResponse` / `editOrSend` / `respondInContext` /
  `parseMode` / `escapeMarkdown` / `sendMessage` — не встречаются.

## Коммиты

- [a625c435] feat(bot-ui): правки ядра и транспорта по итогам ревью
- [e84516e3] feat(bot-ui): перевести user-notify на контракт «Диалог и Экран»
- [6c5edfa2] test(bot-ui): падающие тесты courses/streams каталогов
- [7c3ecf44] feat(bot-ui): перевести courses/streams каталоги и view-stream
- [d2299e52] fix(bot-ui): удалить мёртвую кнопку «🔔 Уведомить о наборе»
- [7034c7e3] feat(bot-ui): перевести InactivityStory на notify-проактивы (И3)
- [79dacb12] fix(bot-ui): экранировать точку в FR-7 уведомлении о выходе из группы
- [a8b7e3bf] test(bot-ui): переписать inactivity e2e на проактивы без кнопок (И3)
- [6aa17591] test(bot-ui): переписать curious-showcase e2e на контракт «Диалог и Экран»
- [94fa7a1e] test(bot-ui): мигрировать integration courses/streams на контракт «Диалог и Экран»

(каждому основному коммиту приложен git note с задачей и сводкой)

## Что дальше (вне скоупа этого трека)

- **Трек 3 (hub)**: learning-контроллер («Моя учёба», self-drop «Покинуть учёбу»).
- **Трек 5 (mentor/monitor)**: mentor-контроллер, «Снять с учёбы» в monitor,
  e2e-тесты и tests/helpers на новый контракт.

## Утерянная интерактивность (долги в треки-владельцы)

Принцип (решение владельца): функциональность пользователя не теряется;
вместе с миграцией удаляются только те точки входа, которые восстановлены
в треке-владельце. Каждая потеря зафиксирована задачей в плане трека-владельца.

| Пропавшая интерактивность | Где жила | Восстановление | Задача |
|---|---|---|---|
| «🚪 Покинуть учёбу» (self-drop FR-4: confirm + drop-student + реплика) | проактив inactivity (кнопка с takeover) | меню hub — кнопка + confirm | learning, Фаза 1 |
| «⚠️ Снять с учёбы» (mark-abandoned FR-5: confirm + cause=inactivity) | проактив inactivity | monitor — карточка студента + confirm | mentor, Фаза 1 |
| «🔔 Уведомить о наборе» | карточка потока S02 | — фича отменена владельцем (обработчика никогда не было) | — |

Тексты и UC-контракты удалённых сценариев сохранены в git-истории:
`git show 7034c7e~1:apps/u7-bot/src/controllers/streams/stories/inactivity.story.ts`.
