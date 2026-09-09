# HANDOFF — Миграция тестов скоупа трека bot-ui-dialog-nav (временный файл)

> **ВРЕМЕННЫЙ ФАЙЛ.** Живёт до закрытия трека; при финале — удалить вместе с
> последним коммитом трека. Материнский план: `./plan.md`, итоги: `./summary.md`.
>
> Назначение: самодостаточная инструкция для новой сессии — закрыть остаток
> тестовой миграции скоупа трека (app/user/courses/streams) и подготовить
> трек к ручной верификации и закрытию.

## 1. Контекст (что уже сделано)

Трек: миграция стори app/user/courses/streams на контракт «Диалог и Экран»
(`DialogResponse { screen, notify, awaitInput, release, delegate }`, MdText,
`menuButtons`, дефолт pipe для команд).

Ключевые коммиты:
- `6c5edfa2` — Red-тесты courses/streams на DialogResponse
- `7c3ecf44` — стори courses/streams переведены (delegate: enroll→menu,
  enroll-cancel→view; enroll-capture на awaitInput/release; errorNotify)
- `d2299e5` — удалена мёртвая кнопка «🔔 Уведомить о наборе»
- `7034c7e` — InactivityStory → notify-проактивы без кнопок (И3)
- `dc3c6695` — единая точка системных кодов: mainMenu И help перехватываются
  в `dispatch` (override handleCallback удалён)
- `a2dd78d` — долги зафиксированы: learning («Покинуть учёбу» → меню hub),
  mentor («Снять с учёбы» → monitor), гейт качества в `conductor/workflow.md`
- `6e1147a` — **тест-стенд мигрирован**, main-menu e2e 13 pass / 0 fail /
  7 skip, user-notify e2e 3 pass; исправлен прод-баг welcome (`\!`)

Юнит-скоуп: 161 тест, 0 fail. Интеграционные/e2e скоупа — остаток (п.3).

## 2. Цель сессии

Довести до зелёного ВСЕ тесты скоупа трека (integration + e2e), прогнать
полный bun test с триажом, обновить summary.md, подготовить ручную
верификацию. Не расширять скоуп: learning/mentor/questionnaire — чужие
домены (промежуточное состояние, не регресс).

## 3. Отработанные паттерны ( ОБЯЗАТЕЛЬНО к использованию )

### 3.1 Тест-стенд (`apps/u7-bot/tests/helpers/test-bot-transport.ts`)
- `createTestBotTransport(app, controllers)` — реальный транспорт + мок-Api.
- **DialogResponse захватывается на границе uiApp** (обёртки handle* в
  `#captureResponses`). Все ассерты контента — по захваченному ответу:
  `response.screen?.text`, `response.notify?.text`. НЕ реконструировать
  из Api-вызовов.
- `handleStart(ctx)` / `handleHelp(ctx)` / `handleCancel(ctx)` — команды
  (внутри `transport.handleCommand`); `handleCallback(ctx)` — нажатие;
  `handleMessage(ctx)` — текстовый ввод (awaitInput).
- `collectMainMenu(actor)` — menuButtons актора (через protected
  `collectMenuButtons` подкласса ExposedMenuUiApp).

### 3.2 Нажатия кнопок — ТОЛЬКО отштампованные коды
Транспорт штампует коды при рендере (`code:~seq36`, UUID сжаты) и валидирует
штампы на входе (ФР-3/И2). Сырой код `'app:main-menu'` → alert, до uiApp не
доезжает. Паттерн: хелпер `pressedCode(transport, tgId, textContains)` —
берёт отштампованный код из `api.sentMessages/editedMessages` предыдущего
экрана (см. main-menu.e2e.test.ts). Перед нажатием экран должен быть открыт
(`/start` или кнопка).

### 3.3 notify vs screen (таблица ФР-5)
- Экраны → `response.screen { text, keyboard? }`.
- Реплики (уведомления, подсказки, ошибки валидации) → `response.notify
  { text, kind? }` — БЕЗ клавиатуры, экран не захватывают.
- /help → notify (не экран!). Ошибки UC → `errorNotify` (warn-реплика).
- Проактивы inactivity → `proactiveSender.notify` — чистый текст + подсказка
  «/start», кнопок нет.

### 3.4 Чужие домены — describe.skip, не удаление
`describe.skip('... (домен — трек bot-ui-dialog-X)', ...)` + комментарий
блока: какой трек-владелец, где задача на миграцию, что сценарии сохранены.
Существующие примеры: main-menu.e2e (блок «Моя учёба» → learning).

### 3.5 ЛОВУШКИ
- **md-литералы**: `md` экранирует только интерполяции; литеральные
  `. ! ( ) -` в шаблоне пишутся как `\\.` `\\!` и т.д. Валидатор
  (`assertMarkdownV2Safe`) роняет рендер fail-fast'ом — в транспорте.
- **JSON-экранирование edit-инструмента**: `\\.` в параметре превращается
  в `\.` на диске (уже дважды ловили). Правки шаблонов — через
  `python3` heredoc с `assert old in s` и явным `\\\\`.
- `bun test --exclude` не работает как ожидалось — фильтровать grep'ом.
- LearningController ещё без menuButtons (трек 3): «Моя учёба» в /help
  для студента НЕ ожидать (тест уже переписан с комментарием).
- Файлы пользователя `data/fullstack-js/*.js` и метка `[~]` в tracks.md —
  не трогать.

## 4. Задачи сессии (по порядку)

### Задача A: `inactivity.e2e.test.ts` (368 строк, 4 fail) — streams
Переписать под новые сценарии: уведомления — notify-текст без кнопок
(warning студенту 5+ дней, candidate ментору 7+ дней, wasWarned-строка,
подсказка «/start»), мягкий кик из TG-группы (FR-6, `api.kickedMembers`),
callback-тупик (unknownCommand). Кнопочные сцены (drop-student /
mark-abandoned confirm) УДАЛЕНЫ из стори осознанно — их восстановление
уже записано задачами в треках learning/mentor; в тесте не восстанавливать,
достаточно комментария-ссылки. Доставка текстов студенту/ментору из UC —
через userFacade.notify → сторя notify (уже покрыто user-notify e2e).

### Задача B: `curious-showcase.e2e.test.ts` (704 строки, 17 fail) — courses/streams
Прогулка curious-пользователя: каталог курсов (drill-down S00) → карточки →
каталог потоков (переключатели) → карточка потока → программа/детали/студенты
→ запись. Паттерны 3.1–3.3. Ожидания согласовать с юнит-тестами стори
(тексты могут отличаться от старых: md-экранирование даёт `\.` в тексте —
ассертить по кускам без спецсимволов или по экранированной форме).

### Задача C: integration courses (6 файлов, ~1200 строк) + streams (2, ~530)
`tests/courses/`: content-path (325), wish-flow (319), course-catalog (231),
course-program (132), course-access (98). `tests/streams/`: view-stream (411),
catalog (116). Механика: сборка через `createTestApp` + `createTestBotTransport`
+ контроллеры (как в user-notify e2e) ИЛИ прямые вызовы стори — выбрать по
структуре каждого файла (если тесты ходили через transport — по паттерну
main-menu; если дёргали appApi/стори напрямую — перевести ассерты на
DialogResponse, нажатия через uiApp.handleCallback с сессией).
Ошибки валидации UC → `notify { kind: 'warn' }`, не экраны.

### Задача D: финализация
1. Полный прогон: `CI=true bun test` — триаж каждого красного по гейту
   (`conductor/workflow.md`): зелёный скоуп / промежуточное (владелец) /
   регресс (недопустимо). Ожидаемые промежуточные: learning/mentor/
   questionnaire integration+e2e, tests/helpers остатки (нет — хелпер один).
2. Обновить `./summary.md`: секция «Состояние проверок» — актуальные числа,
   таблица триажа; убрать формулировку «тесты/линт/tsc затронутых файлов» →
   фактические.
3. Убедиться, что задачи-долги в learning/mentor/questionnaire планах точны
   (поправить формулировки, если реальность разошлась).
4. Коммиты по логическим блокам (стиль: `test(bot-ui): ...`, русский body),
   git notes к каждому; удалить ЭТОТ файл в финальном коммите.
5. Остановиться и передать пользователю на ручную верификацию
   (2 шага User Manual Verification в plan.md Фаз 2/3).

## 5. Критерии готовности

- [ ] `CI=true bun test apps/u7-bot/tests/courses apps/u7-bot/tests/streams apps/u7-bot/tests/e2e/curious-showcase.e2e.test.ts apps/u7-bot/tests/e2e/inactivity.e2e.test.ts` — 0 fail
- [ ] `CI=true bun test apps/u7-bot/src apps/u7-bot/tests` — каждый fail отнесён к категории гейта; регрессов нет
- [ ] `bun run lint:a u7-bot` и tsc затронутых файлов — чисто
- [ ] summary.md: актуальный триаж; plan.md: задачи Фазы 3 отмечены
- [ ] Ручная верификация передана пользователю; HANDOFF.md удалён

## 6. Карта файлов

- Трек: `conductor/tracks/bot-ui-dialog-nav_20260905/` (plan, spec, summary)
- Стенд: `apps/u7-bot/tests/helpers/test-bot-transport.ts` (готов, не ломать)
- Референсы миграции: `tests/e2e/main-menu.e2e.test.ts` (13 pass),
  `tests/e2e/user-notify.e2e.test.ts`
- Стори скоупа: `apps/u7-bot/src/controllers/{courses,streams}/stories/`,
  user: `.../user/stories/notify.story.ts`, app: `.../core/ui-app.ts`
- Транспорт (штампы/рендер): `apps/u7-bot/src/infra/bot-transport.ts`
- Правила архитектуры: `conductor/bot-ui-session-architecture.md` (§10.19,
  И3, ФР-5), `AGENTS.md` (язык — русский; skill arch-boundary-design перед
  созданием методов; troubleshoot при неожиданных ошибках)
