# Итоговый отчёт — трек wish-module_20260828

**Трек:** wish: желание на модуль + уведомления через события стори (удаление TgFacade)
**Цель:** три связанных изменения — доменный язык фасада курса, wish на модуль (без анкеты), уведомления студенту только через стори по доменным событиям с полным удалением Telegram-порта из домена.

**Итог:** все 7 фаз реализованы по TDD. `bun run check` чисто (biome + tsc + 1584 теста, было 1547 на старте). `rg TgFacade` по коду — пусто.

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

## Сводка файлов

**Созданы (6):**
- `packages/wish/src/domain/wish/commands/create-module-wish-cmd.ts`
- `packages/wish/src/api/wish/create-module-wish-uc.ts` + `.test.ts`
- `packages/course/src/domain/course/commands/get-module-place-cmd.ts`
- `packages/course/src/api/course/get-module-place-uc.ts` + `.test.ts`
- `conductor/tracks/wish-module_20260828/summary.md` (этот файл)

**Удалены (3):**
- `packages/stream/src/domain/tg-facade.ts`
- `apps/u7-bot/src/infra/telegram-tg-facade.ts` + `.test.ts`

**Изменены (66):** см. `git diff --name-status d3184ba3~1..HEAD` — core/ui/bot (6), apps/u7-bot (18), packages/course (10), packages/stream (16), packages/wish (11), scripts/TODO/AGENTS (3). Плюс документация conductor.

## Принятые решения и отклонения

1. **moduleId — параметр `advance()`/`markNotAdvanced()`** — агрегат Student не хранит moduleId (он на Stream), UC передаёт `streamEntity.moduleId`. Спек не фиксировал сигнатуру — это минимальное изменение.
2. **Курс без стартового модуля → COURSE_NOT_FOUND** (не отдельная ошибка): для студента опубликованный-но-пустой курс неотличим от несуществующего; консистентно с draft/archived.
3. **`getModulePlace` ищет только по опубликованным курсам** — историческая идентичность (архивы/форки) осталась в `whichCoursesIncludeModule`; spec решение 5 это допускает («сегодня реализация тривиальна, контракт — на будущее»).
4. **Двойная валидация в create-module-wish** (`getModulePlace` + `isCourseEnrollable`) — оставлена по букве зафиксированного решения 6, хотя первая покрывает вторую.
5. **Уведомление обновляет `lastBotMessage`** (побочный эффект execute) — следующее обычное сообщение бота снимет клавиатуру уведомления, а не предыдущего экрана. Спек фиксирует только `keepPrevKeyboard` (решение 2) — поведение принято.
6. **Баг экранирования MarkdownV2 в Фазе 2** найден и исправлен в Фазе 6 (см. выше).
7. **get-module-place как UC** (не прямой доступ стори к фасаду): UI-вызовы к чужой логике — только через appApi; фасад делегирует в UC (единая точка логики).

## На что смотреть глазами (план ручной верификации)

Общая проверка: `bun run check` — чисто; `bun run dev` (бот запускается без tgFacade).

1. **notify() не рушит поток (Фазы 1–2):** запустить бота, открыть каталог курсов (кнопки на экране), из другого терминала зачислить пользователя в поток (`bun run scripts/call-uc.ts enroll-student '{"streamId":"…","userId":"…"}'`) → придёт «🎓 Ты зачислен…» с кнопкой «🎓 Моя учёба»; кнопки каталога остаются живыми; кнопка уведомления открывает хаб.
2. **Уведомление во время анкеты:** начать заполнение анкеты → зачислить пользователя → сообщение не сбивает ввод (ответ на вопрос анкеты продолжает флоу); нажатие кнопки уведомления при активном вводе другого контроллера даёт alert «Сначала завершите текущее действие».
3. **Завершение модуля (Фазы 3, 6):** `complete-student` с `advanced` на непоследнем модуле → «🏁 Модуль завершён!» + кнопка «➡️ Следующий модуль»; нажатие → «✅ Записали!»; повторное нажатие (кнопка ещё жива) → «ℹ️ Ты уже записан…». С `not_advanced` → кнопка «🔁 Пройти модуль снова». С `advanced` на последнем модуле курса → «🎉 Курс завершён» без кнопки. С `abandoned` → тишина.
4. **Wish на модуль попадает в данные:** после нажатия кнопки проверить `data/wish/wishes.json` — target `{kind:'module', moduleId}`, статус `expressed`, анкета НЕ запускается.
5. **Fulfill по модулю:** создать module-wish вручную (кнопкой), зачислить на поток этого модуля → wish стал `fulfilled` (ветка isSameModule).
6. **MarkdownV2:** во всех новых уведомлениях нет «сырых» символов и бэкслешей в тексте (экранирование `!`, `.`, названий потоков).
7. **Фасад:** каталог курсов работает как раньше (`create-course-wish` на курсе без пула → instant; черновик/архив → «Курс не найден»).

## Известные ограничения

- Событие `wish.fulfilled`, уведомления при отчислении/массовые рассылки — за рамками (см. spec).
- `FillStory` не мигрирована на `notify()` — за рамками трека.
- Интеграционные/e2e тесты сквозной синхронизации модулей — отдельный трек перед релизом.
- `isSameModule` — тривиальное равенство (версионности модулей в данных ещё нет).
