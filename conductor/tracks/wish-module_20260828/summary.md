# Итоговый отчёт — трек wish-module_20260828

**Трек:** wish: желание на модуль + уведомления через события стори (удаление TgFacade)
**Цель:** три связанных изменения — доменный язык фасада курса, wish на модуль (без анкеты), уведомления студенту только через стори по доменным событиям с полным удалением Telegram-порта из домена.

**Итог:** все 7 фаз реализованы по TDD + правки по ревью пользователя (см. раздел ниже). `bun run check` чисто (biome + tsc + 1592 теста, было 1547 на старте). `rg TgFacade` по коду — пусто.

**Режим выполнения:** по указанию пользователя трек выполнен без остановок на ручную верификацию фаз. Задачи «Conductor - Ручная верификация» отмечены выполненными в части автотестов; планы ручной проверки собраны в разделе «На что смотреть глазами» ниже — ревью пользователя переносится на этот файл.

---

## Фаза 1 — `notify()` в core

**Что сделано:** новый тип команды уведомления. `NotificationPayload { text, keyboard?, parseMode? }` + `ProactiveSender.notify()`. Реализации по цепочке: `BotTransport.notify()` (ставит `keepPrevKeyboard: true`, не трогает `session.activeHandler`, создаёт сессию при отсутствии), `BotUiApp.notify()` (делегирование), `BotController.notify()` (префиксация кнопок через существующий `#prefixCommand`). Уведомление по построению без `captureInput`/`releaseInput`/`editMessage` — клиент не помнит про флаги.

**Файлы изменены:**
- `packages/core/src/ui/bot/types.ts` — NotificationPayload + notify() в интерфейсе
- `packages/core/src/ui/bot/ui-app.ts`, `bot-controller.ts` — реализации
- `apps/u7-bot/src/infra/bot-transport.ts` — реализация транспорта
- Тесты: `ui-app.test.ts`, `bot-controller.test.ts`, `bot-ui-story.test.ts`, `bot-transport.test.ts`, `fill.story.test.ts` (старым мокам sender'а добавлен `notify: mock(...)` — механическое следствие расширения интерфейса)

**Коммит:** d3184ba

## Фаза 2 — Уведомление о зачислении

**Что сделано:** `HubStory` подписывается на `student.enrolled`: резолв `telegramId` через `appApi.execute('user', 'get-user')`, текст «🎓 Ты зачислен в поток «X»!» (название потока необязательно — сбой `get-stream` не мешает отправке), кнопка «🎓 Моя учёба» через `this.cb('my-study')`, отправка через `notify()`. Из `EnrollStudentUc` удалён шаг 7 (отправка через tgFacade); тесты UC почищены (удалены 2 теста уведомлений и моки).

**Файлы изменены:** `apps/u7-bot/src/controllers/learning/stories/hub.ts(+test)`, `packages/stream/src/api/student/enroll-student-uc.ts(+test)`

**Коммит:** 00ff3ec

## Фаза 3 — Событие `student.completed`

**Что сделано:** `StudentAr.advance(moduleId)` / `markNotAdvanced(moduleId)` добавляют `StudentCompletedEvent` (payload: `studentId, userId, streamId, moduleId, outcome`). `moduleId` — параметр (агрегат Student его не хранит, он на Stream). `CompleteStudentUc` публикует через `publishEvents`; отправка через фасад удалена. `abandoned` не публикуется. `StudentArMeta.events` расширен до union.

**Файлы изменены:** `packages/stream/src/domain/student/{events,entity,a-root}.ts(+tests a-root)`, `packages/stream/src/api/student/complete-student-uc.ts(+test)`

**Коммит:** bfe86c3

## Фаза 4 — Доменный фасад курса

**Что сделано:** вопросительные методы фасада — `isCourseEnrollable(courseId)` (существует и опубликован), `getCourseStartModuleId(courseId)` (первый модуль линейного порядка фаз, undefined при пустой программе), `getModulePlace(moduleId)` → `ModulePlace { courseId, isFirst, isLast, prevModuleId?, nextModuleId? }` (только опубликованные курсы), `isSameModule(a, b)` (историческая идентичность; сегодня тривиальное равенство, контракт на будущее версионности). `filterCoursesContainingModule` → `whichCoursesIncludeModule` (обновлены FulfillWishEr + тесты). `CreateCourseWishUc` переведён на `isCourseEnrollable` + `getCourseStartModuleId` (курс без стартового модуля → COURSE_NOT_FOUND, для студента неотличимо).

**Файлы изменены:** `packages/course/src/domain/facade.ts`, `domain/index.ts` (экспорт ModulePlace), `packages/course/src/infra/course-in-proc-facade.ts(+test)`, `packages/wish/src/api/er/fulfill-wish-er.ts(+test)`, `packages/wish/src/api/wish/create-course-wish-uc.ts(+test)`

**Коммит:** beda702

## Фаза 5 — Wish на модуль

**Что сделано:** `WishTarget` расширен вариантом `{ kind: 'module', moduleId }` (миграция данных не нужна — вариант course не менялся). Новый UC `create-module-wish`: валидации через фасад (`getModulePlace` — модуль в опубликованной программе, `isCourseEnrollable` — курс доступен), дедуп активного желания, мгновенная фиксация `expressed` **без анкеты**. Обе валидации вызываются явно (зафиксированное решение 6; фактически избыточно — getModulePlace уже фильтрует по published). Ошибки: `MODULE_NOT_FOUND` (покрывает и «курс недоступен» — студенту неотличимо), `WISH_ALREADY_EXISTS`. `FulfillWishEr`: module-ветка — реализация при `isSameModule(модуль потока, цель)`. `isSameTarget` в JSON-репо — ветка module.

**Файлы созданы:** `packages/wish/src/domain/wish/commands/create-module-wish-cmd.ts`, `packages/wish/src/api/wish/create-module-wish-uc.ts(+test)`
**Файлы изменены:** `packages/wish/src/domain/wish/entity.ts(+test)`, `errors.ts`, `domain/module.ts`, `api/module.ts`, `api/er/fulfill-wish-er.ts(+test)`, `infra/db/wish-json-repo.ts`

**Коммит:** f1360f4

## Фаза 6 — Уведомление о завершении с контекстными кнопками

**Что сделано:** новый query-UC `get-module-place` в course (логика места модуля; фасад делегирует в него). Кросс-контроллерная кнопка: `Routes.course.wishModule(moduleId)` → `course:course-catalog:wish:{moduleId}` + фабрика `buttons.wishModule(moduleId, text?)`. Обработчик `wish` в `CourseCatalogStory`: `create-module-wish`, успех → «✅ Записали!», конфликт → «ℹ️ Ты уже записан…» (не ошибка), прочее → handleError. Подписка `HubStory` на `student.completed`: текст по паре `(outcome, getModulePlace)` — `advanced`+next → «➡️ Следующий модуль» (wish на следующий), `not_advanced` → «🔁 Пройти модуль снова» (wish на тот же), `advanced`+`isLast` → «🎉 Курс завершён» без кнопки, place undefined → текст без кнопки.

**Попутно исправлен баг Фазы 2:** в тексте зачисления `!` и `.` не были экранированы для MarkdownV2 — транспорт упал бы на `assertResponseMarkdownSafe` в runtime (юнит-тесты это не ловили). Исправлено.

**Файлы созданы:** `packages/course/src/domain/course/commands/get-module-place-cmd.ts`, `packages/course/src/api/course/get-module-place-uc.ts(+test)`
**Файлы изменены:** `packages/course/src/domain/{course/commands/index,module}.ts`, `api/module.ts(+test)`, `infra/course-in-proc-facade.ts(+test)` (getModulePlace → делегирование), `apps/u7-bot/src/controllers/shared/{routes,buttons}.ts`, `courses/stories/course-catalog.story.ts(+test)`, `learning/stories/hub.ts(+test)`

**Коммит:** fcf23d8

## Фаза 7 — Удаление TgFacade и чистка

**Что удалено:**
- `packages/stream/src/domain/tg-facade.ts` — порт
- `apps/u7-bot/src/infra/telegram-tg-facade.ts` + `telegram-tg-facade.test.ts` — реализация и тест
- поле `tgFacade` в `StreamApiModuleResolver`, export из `stream/domain/index.ts`
- параметр в `createApiApp(config, logger)` и `main.ts` (создание `TelegramTgFacade`)
- `MockTgFacade` и поле в `apps/u7-bot/tests/helpers/test-app.ts`
- заглушка `noopTgFacade` в `scripts/call-uc.ts`
- моки `tgFacade: {...}` в 7 тест-файлах UC stream

**Документация:** `conductor/code_styleguides/bot-architecture.md` — сборка без tgFacade, раздел проактивных сообщений дополнен `notify()` (без Telegram-портов в домене); спеки wish-ui/wish-invite переведены на новую модель фасада (`getModulePlace`/`isFirst`/`isSameModule`/`notify()`); `learning/ui-spec.md` — новый раздел S05n (уведомления хаба); `courses/ui-spec.md` — кнопка `wish`; AGENTS.md — пример порта; README структура; TODO.md — устаревшие упоминания.

**Коммит:** edc920c

---

## Правки по ревью (после summary)

Замечания пользователя по итоговому отчёту; все закрыты кодом в этом же треке:

1. **Фасад — тонкая обёртка над UC.** Реальная работа перенесена из `CourseInProcFacade` в query-UC (по образцу `get-module-place`): новые `get-course-by-module`, `get-course-program`, `which-courses-include-module` (+cmd-файлы, регистрация в `CourseApiModule`). Связь «курс содержит модуль» — `CourseDs.includesModule` (DS, а не агрегат: агрегат знает только текущее состояние, а связь может быть исторической — при появлении форков/копий расширение идёт в DS). `getModulePlace`-UC тоже переведён на DS. Логические тесты фасада перенесены в тесты UC; у фасада остались только smoke-тесты делегирования. Простые операции остались в фасаде: `isCourseEnrollable` (проверка статуса), `getCourseStartModuleId` (других потребителей «первого модуля» нет), `isSameModule` (тривиальное равенство).
2. **`isWishStatusActive` → `WishPolicy.isActive`** — новая stateless-политика `domain/wish/policy.ts` (по образцу `CoursePolicy.isPublished`), оба create-*-wish-UC переведены на неё.
3. **Двойная валидация в `create-module-wish` убрана** — шаг `isCourseEnrollable` удалён (`getModulePlace` уже фильтрует по опубликованным), тест обновлён.
4. **`notify()` — строго без кнопок, не трогает `lastBotMessage`, с заголовком.** Из `NotificationPayload` удалён `keyboard` (кнопки невозможны на уровне типов); транспорт помечает сообщение заголовком `🔔 Уведомление:` (в MarkdownV2 — жирным), сохраняет/восстанавливает `session.lastBotMessage` (логика снятия клавиатуры продолжает работать по предыдущему экрану), `BotController.notify()` упрощён до делегирования.
5. **Кнопочные проактивные сообщения → обычный `send()`.** Зачисление («Моя учёба») и кнопочные ветки завершения («Следующий/Тот же модуль») шлются `send()`: ломают текущий флоу — клавиатура предыдущего экрана снимается, новое сообщение становится `lastBotMessage`. Бескнопочные ветки («Курс завершён», место неизвестно) остаются `notify()` с заголовком 🔔.
6. **Вопрос «почему `abandoned` не публикуется»** — решение спека №3 («`abandoned` не уведомляется»: у брошенного студента нет целевого действия-кнопки, зона отчислений — отдельная UX-задача). По указанию пользователя в техдолг НЕ добавляется.

**Документация по правкам:** `bot-architecture.md` §3.5 (notify без кнопок/заголовок/`lastBotMessage`; кнопки — только `send`), `learning/ui-spec.md` S05n (новая семантика доставки), спека `wish-invite` (приглашение с кнопками — `send`, не `notify`), `TODO.md` (закрыт пункт 0 про диалоги через tg-фасад; добавлен раздел «Wish и проактивные уведомления»: `wish.fulfilled`, миграция `FillStory` на `notify()`, e2e-тесты синхронизации, версионность модулей).

---

## Сводка файлов

**Созданы (13):**
- `packages/wish/src/domain/wish/commands/create-module-wish-cmd.ts`
- `packages/wish/src/api/wish/create-module-wish-uc.ts` + `.test.ts`
- `packages/course/src/domain/course/commands/get-module-place-cmd.ts`
- `packages/course/src/api/course/get-module-place-uc.ts` + `.test.ts`
- `packages/course/src/domain/course/commands/get-course-by-module-cmd.ts`
- `packages/course/src/domain/course/commands/get-course-program-cmd.ts`
- `packages/course/src/domain/course/commands/which-courses-include-module-cmd.ts`
- `packages/course/src/api/course/get-course-by-module-uc.ts` + `.test.ts`
- `packages/course/src/api/course/get-course-program-uc.ts` + `.test.ts`
- `packages/course/src/api/course/which-courses-include-module-uc.ts` + `.test.ts`
- `packages/wish/src/domain/wish/policy.ts` + `policy.test.ts`
- `conductor/tracks/wish-module_20260828/summary.md` (этот файл)

**Удалены (3):**
- `packages/stream/src/domain/tg-facade.ts`
- `apps/u7-bot/src/infra/telegram-tg-facade.ts` + `.test.ts`

**Изменены (66):** см. `git diff --name-status d3184ba3~1..HEAD` — core/ui/bot (6), apps/u7-bot (18), packages/course (10), packages/stream (16), packages/wish (11), scripts/TODO/AGENTS (3). Плюс документация conductor.

## Принятые решения и отклонения

1. **moduleId — параметр `advance()`/`markNotAdvanced()`** — агрегат Student не хранит moduleId (он на Stream), UC передаёт `streamEntity.moduleId`. Спек не фиксировал сигнатуру — это минимальное изменение.
2. **Курс без стартового модуля → COURSE_NOT_FOUND** (не отдельная ошибка): для студента опубликованный-но-пустой курс неотличим от несуществующего; консистентно с draft/archived.
3. **`getModulePlace` ищет только по опубликованным курсам** — историческая идентичность (архивы/форки) осталась в `whichCoursesIncludeModule`; spec решение 5 это допускает («сегодня реализация тривиальна, контракт — на будущее»).
4. **Двойная валидация в create-module-wish** — удалена по ревью: `getModulePlace` покрывает `isCourseEnrollable` (оба фильтруют по опубликованным).
5. **Уведомления не трогают `lastBotMessage`** (правка по ревью): транспорт сохраняет предыдущий слот, заголовок `🔔 Уведомление:` маркирует тип сообщения. Кнопки в notify невозможны типом; кнопочные проактивные сообщения — обычный `send()`, ломающий текущий флоу.
6. **Баг экранирования MarkdownV2 в Фазе 2** найден и исправлен в Фазе 6 (см. выше).
7. **get-module-place как UC** (не прямой доступ стори к фасаду): UI-вызовы к чужой логике — только через appApi; фасад делегирует в UC (единая точка логики).
8. **`includesModule` — в `CourseDs`** (не в агрегате Course): агрегат знает только текущее состояние, связь модуль↔курс может быть исторической (форки/копии) — расширение пойдёт в DS, контракт фасада не изменится.
9. **`abandoned` не публикуется и в техдолг не идёт** — решение спека №3 подтверждено пользователем при ревью.

## На что смотреть глазами (план ручной верификации)

Общая проверка: `bun run check` — чисто; `bun run dev` (бот запускается без tgFacade).

1. **send() проактивно (Фазы 1–2 + ревью):** запустить бота, открыть каталог курсов (кнопки на экране), из другого терминала зачислить пользователя в поток (`bun run scripts/call-uc.ts enroll-student '{"streamId":"…","userId":"…"}'`) → придёт «🎓 Ты зачислен…» с кнопкой «🎓 Моя учёба»; **кнопки каталога снимаются** (сообщение с кнопкой ломает флоу); кнопка открывает хаб.
2. **notify() бескнопочный:** `complete-student` с `advanced` на последнем модуле → уведомление «🔔 *Уведомление:* 🎉 Курс завершён…» без кнопки; кнопки текущего экрана пользователя остаются живыми; следующее сообщение бота снимает клавиатуру прежнего экрана (не уведомления).
3. **Сообщение во время анкеты:** начать заполнение анкеты → зачислить пользователя → текст сообщения не сбивает ввод (ответ на вопрос анкеты продолжает флоу); нажатие кнопки сообщения при активном вводе другого контроллера даёт alert «Сначала завершите текущее действие».
4. **Завершение модуля (Фазы 3, 6 + ревью):** `complete-student` с `advanced` на непоследнем модуле → «🏁 Модуль завершён!» + кнопка «➡️ Следующий модуль» (send, кнопки прежнего экрана сняты); нажатие → «✅ Записали!»; повторное нажатие (кнопка ещё жива) → «ℹ️ Ты уже записан…». С `not_advanced` → кнопка «🔁 Пройти модуль снова». С `abandoned` → тишина.
5. **Wish на модуль попадает в данные:** после нажатия кнопки проверить `data/wish/wishes.json` — target `{kind:'module', moduleId}`, статус `expressed`, анкета НЕ запускается.
6. **Fulfill по модулю:** создать module-wish вручную (кнопкой), зачислить на поток этого модуля → wish стал `fulfilled` (ветка isSameModule).
7. **MarkdownV2:** во всех новых сообщениях нет «сырых» символов и бэкслешей в тексте (экранирование `!`, `.`, названий потоков; заголовок 🔔 валиден).
8. **Фасад:** каталог курсов работает как раньше (`create-course-wish` на курсе без пула → instant; черновик/архив → «Курс не найден»; программа курса открывается).

## Известные ограничения

Вынесены в техдолг — `TODO.md`, раздел «Wish и проактивные уведомления»:

- Событие `wish.fulfilled` + уведомления на его основе (сейчас не публикуется).
- Миграция `FillStory` на `notify()` (без кнопок, заголовок 🔔).
- Интеграционные/e2e тесты сквозной синхронизации модулей — отдельный трек перед релизом.
- Версионность/форки модулей: `isSameModule` — тривиальное равенство; место расширения (`CourseDs.includesModule`) и контракт фасада готовы.

По ревью пользователя: уведомления при `abandoned`/отчислении в техдолг НЕ вносятся.
