# Summary — Трек E: wish-invite — приглашение желающим при открытии набора

## Цель трека

Замкнуть цикл желания: при создании потока (открытии набора) все активные желающие
(`expressed | confirmed`) получают проактивное приглашение в Telegram с кнопками
«Открыть поток» и «Отменить желание». До трека желание было «письмом в никуда».

## Выполненные задачи

### Фаза 1 — Событие `stream.created`

- `StreamCreatedEvent` (`packages/stream/src/domain/stream/events.ts`) — первое
  событие агрегата Stream; `StreamArMeta` дополнен типом `events`.
- `StreamAr.create` добавляет событие (паттерн `StudentAr.enroll` из трека C2);
  `CreateStreamUc` публикует его через `publishEvents(ar)` после сохранения.
- Публикация необязательна: при отсутствии `eventBus` создание потока не падает.

### Фаза 2 — ER `invite-wishers` + репо + фасад + cancel-wish

- `WishRepo.findAllByKind(kind, statuses?)` — интерфейс + JSON-реализация:
  выборка по виду цели, фильтр статусов на стороне хранилища.
- `InviteWishersEr` (подписка на `stream.created`):
  - course-ветка — только при `place.isFirst` (поток на стартовый модуль курса),
    матчинг через `courseFacade.whichCoursesIncludeModule` (исторические форки);
  - module-ветка — на поток любого модуля, матчинг через
    `courseFacade.whichModulesAreSame`;
  - в событии `wish:invite` уходит **id из желания** — cancel-маршрут работает
    по историческому id;
  - пользователь без профиля — тихий пропуск; публикация через `eventBus`
    (неблокирующая семантика InProc).
- `cancel-wish` — дискриминированный вариант команды по `kind` (`course | module`),
  зеркально `WishTargetSchema`; имя UC сохранено; payload `WISH_NOT_FOUND`
  нейтрален к виду цели.
- Гигиена фасада курсов: `+ whichModulesAreSame` (batch, сегодня — равенство id),
  `− getStep` (мёртвый), `getCourse` убран из интерфейса (приватный `#getCourse`).

### Фаза 3 — UI приглашения

- `WishInviteStory` (`streams`-контроллер) — подписка на `wish:invite`:
  адаптивный заголовок по `wishKind`, поток/дата/ментор, подсказка про ключ
  зачисления; ментор-строка: `nick` → кликабельная `t.me`-ссылка, без `nick` →
  просто имя. Доставка `ProactiveSender.send` (ломает флоу, кнопки — только в
  `send()`). Кнопки: «📚 Открыть поток» → S02, «🗑️ Отменить желание» → W05/W05-M.
- `Routes`: `stream.view`, `course.cancelWishCourse`, `course.cancelWishModule`.
- W05-M в `course-catalog.story.ts`: `cancel-mod:{moduleId}` → подтверждение →
  `cancel-mod-confirm` → `cancel-wish { kind: 'module', moduleId }`; гонка —
  мягкое сообщение.

### Фаза 4 — Документация

- `courses/ui-spec.md`: W05-M → ✅ (фактический код `cancel-mod-confirm`),
  приглашение → «✅ реализовано».
- `streams/ui-spec.md`: S11 → ✅, фактические коды кнопок, место стори,
  обработка сбоев.

## Затронутые файлы

**Созданы:**
- `packages/stream/src/domain/stream/events.ts`
- `packages/wish/src/domain/wish/events.ts`
- `packages/wish/src/api/er/invite-wishers-er.ts` (+ тест)
- `apps/u7-bot/src/controllers/streams/stories/wish-invite.story.ts` (+ тест)

**Изменены:**
- `packages/stream/src/domain/stream/entity.ts`, `a-root.ts`, `domain/index.ts`
- `packages/stream/src/api/stream/create-stream-uc.ts` (+ тест)
- `packages/wish/src/domain/wish/repo.ts`, `errors.ts`,
  `commands/cancel-wish-cmd.ts`, `domain/index.ts`
- `packages/wish/src/infra/db/wish-json-repo.ts` (+ тест)
- `packages/wish/src/api/wish/cancel-wish-uc.ts` (+ тест: payloads → variant)
- `packages/wish/src/api/module.ts`, `api/index.ts`
- `packages/course/src/domain/facade.ts`,
  `infra/course-in-proc-facade.ts` (+ тест: +whichModulesAreSame, −getStep)
- `apps/u7-bot/src/controllers/shared/routes.ts`
- `apps/u7-bot/src/controllers/streams/controller.ts` (+ тест: 3 stories)
- `apps/u7-bot/src/controllers/courses/stories/course-catalog.story.ts` (+ тест:
  W05-M, payload cancel-wish)
- `apps/u7-bot/src/controllers/courses/ui-spec.md`,
  `apps/u7-bot/src/controllers/streams/ui-spec.md`

**Удалены (в рамках задачи):**
- тесты `facade.getStep` из `course-in-proc-facade.test.ts` (метод удалён)

## Архитектурные решения

1. **Триггер — создание потока:** поток создаётся сразу в `ENROLLMENT`, поэтому
   «создание» и «открытие набора» — один факт; событие добавляет агрегат
   (богатый доменный объект), публикует UC — паттерн трека C2.
2. **Матчинг только через фасад курсов:** точные сравнения id в wish запрещены
   (форки/исторические id); `whichCoursesIncludeModule` + новый
   `whichModulesAreSame` (batch) покрывают историческую идентичность.
3. **`isFirst` как ворота course-ветки:** course-желание реализуется только
   стартовым модулем курса; module-ветка зовётся на любой модуль (ретейкеры,
   «следующий модуль»).
4. **Id из желания в событии:** cancel-маршрут W05/W05-M работает по
   историческому id из `wish.target`, а не по id потока.
5. **Неблокирующая рассылка:** `InProcEventBus.publish` изолирует ошибки
   хендлеров; создание потока не зависит от рассылки; гарантий доставки нет
   (зафиксировано в спеке как приемлемое для MVP).
6. **Место стори:** streams-контроллер — основная кнопка приглашения ведёт на
   экран потока; cancel-кнопки — кросс-контроллерные маршруты через `Routes`.

## Отклонения от плана

- Код подтверждения W05-M — `cancel-mod-confirm` (генерируется confirm-хелпером
  по конвенции `${action}-confirm`), а не `cancel-confirm-mod`, как было
  набросано в ui-spec до имплементации. Документация приведена к факту.
- Тесты `cancel-wish-uc` обновлены под новый контракт команды — санкционировано
  задачей «вариант команды cancel-wish + обновление текущих вызовов».
- По явной просьбе пользователя трек выполнялся без интерактивных остановок:
  фазовые сводки/дебрифы/ожидание ручной верификации заменены контрольными
  точками с git-notes-отчётами.

## Незавершённое / ограничения

- **Ручная верификация (4 задачи плана остались `[ ]`)** — требуют живого бота:
  планы верификации приложены в git notes контрольных точек фаз
  (`be0a3c6`, `07af347`, `169f3cc`, `e133e43`) и продублированы в чате.
  До их выполнения трек честно остаётся `[~]`.
- Гарантий доставки приглашений нет (краш процесса между публикацией
  `stream.created` и рассылкой теряет приглашения) — MVP-приемлемо.
- Повторные напоминания о наборе, «Мои заявки», список желающих для ментора —
  бэклог (вне трека).
- Попутно (не из этого трека): в рабочем дереве остались незакоммиченными
  удаления `conductor/tracks/wish-ui_20260814/*` — файлы пользователем
  перенесены в `conductor/archive/` (архив в `.gitignore`); удаление сознательно
  не включено в коммиты трека.

## Проверки

- `bun run check` (biome + `tsc --noEmit` + `bun test`): 1661 pass / 0 fail.
- Изолированно: `check:p stream` 225, `check:p course` 366, `check:p wish` 95,
  `check:a u7-bot` 462 — все зелёные.
- Новые тесты: stream +4, wish +20 (ER 11, репо 3, cancel 6), course +3,
  u7-bot +9; удалено 2 устаревших теста `getStep`.
