# Спецификация — Трек E: wish-invite — приглашение желающим при открытии набора

## Обзор

Замыкает цикл желания: при создании потока (открытии набора) все активные желающие получают приглашение с кнопками. Без этого трека желание — «письмо в никуда»: пользователь выразил желание и не узнаёт о наборе.

Терминология: **курс** — последовательность учебных модулей; **поток** — набор и проведение учёбы по одному модулю.

Полный цикл: кнопка «Хочу пройти курс» (трек D) → анкета → желание `expressed/confirmed` → **приглашение при открытии набора (этот трек)** → запись в поток по ключу (существующий флоу) → зачисление → `fulfilled` (трек C2). Желание на курс реализуется только потоком **первого** модуля курса.

Цепочка повторного обучения (module-желания): окончание потока → уведомление с кнопками «➡️ Следующий модуль» / «🔁 Пройти модуль снова» (трек wish-module) → module-желание → **приглашение при открытии набора на этот модуль (этот трек)**.

Порядок выполнения: **после треков C2 и D** (переиспользует cancel-флоу W05 и событийную модель C2).

## Текущее состояние (базовая линия)

- `StreamAr.create` создаёт поток сразу в статусе `ENROLLMENT` (набор открыт); `activate()` → ACTIVE. Событий при создании потока нет. События агрегата Student (`student.enrolled`, `student.completed`) уже существуют (трек wish-module); `stream.created` станет первым событием агрегата Stream.
- [view-stream.story.ts](../../apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts) — существующий флоу самозаписи: карточка потока → «Записаться» → ввод ключа зачисления (`enrollmentKey`).
- `packages/wish/` — UC `cancel-wish` есть (принимает только course-цели); репо умеет `getByUserAndTarget`/`getByUser`, выборки «все желания по виду цели» нет.
- Фасад курсов: `getModulePlace` / `whichCoursesIncludeModule` / `isSameModule` есть; batch-идентичности модулей нет; `getStep` и `getCourse` вне фасада не используются.
- ProactiveSender + UiEventSubscription-подписки — паттерн отработан (FillStory).
- В [courses/ui-spec.md](../../apps/u7-bot/src/controllers/courses/ui-spec.md) фича записана как «Предложение о реализации» — этот трек её реализует.

## Зафиксированные решения

1. **Триггер — создание потока** (`StreamAr.create`, статус сразу `ENROLLMENT`): UC создания потока публикует событие `stream.created` после сохранения.
2. **Две ветки матчинга в ER `invite-wishers`**: course-желания зовутся только на поток **первого** модуля курса (`place.isFirst`); module-желания — на поток любого модуля (ретейкеры, «следующий модуль»). Историческая идентичность (форк: id модуля/курса в желании может не совпадать с id потока) решается **только фасадом курсов** — `whichCoursesIncludeModule` / `whichModulesAreSame`; точное сравнение id в wish запрещено.
3. **Только активные желания** (`expressed | confirmed`). Ретейкер с `fulfilled`-желанием выражает желание повторно (политика разрешает) — попадает в следующую рассылку. Звать `fulfilled` нельзя — выпускники получали бы спам на каждый новый поток.
4. **UI-сообщение** рендерится подпиской в боте через ProactiveSender: адаптивный текст (курс/модуль по `wishKind`), строка ментора (кликабельная `t.me`-ссылка при заполненном `nick`, иначе просто имя — t.me строится только из Telegram-username), подсказка про ключ зачисления. Кнопки: «📚 Открыть поток» (экран потока, запись по ключу) и «🗑️ Отменить желание» (course → W05, module → W05-M).
5. **Отмена желаний обоих видов**: команда `cancel-wish` становится дискриминированным вариантом по `kind` (`course | module`) — цель отмены явна в команде; имя UC сохраняется.
6. **Неблокирующая семантика**: `InProcEventBus.publish` не ожидает async-хендлеров (ошибки изолируются и логируются) — создание потока не блокируется рассылкой; worker/очередь не нужны. Гарантий доставки нет (краш процесса между публикацией и рассылкой теряет приглашения) — для MVP приемлемо.
7. **Гигиена фасада курсов**: `+ whichModulesAreSame` (batch), `− getStep` (мёртвый), `getCourse` из интерфейса (остаётся приватным хелпером фасада).
8. **Запись не автоматическая** — пользователь сам жмёт «Записаться» и вводит ключ: сохраняется защита от случайных зачислений, переиспользуется готовый флоу.
9. Идемпотентность: событие `stream.created` публикуется один раз при создании; повторной рассылки для того же потока нет.

## FR1 — Событие `stream.created` в stream

- `packages/stream/src/domain/stream/events.ts`:
  ```ts
  export interface StreamCreatedEvent extends DomainEvent {
    eventName: 'stream.created';
    aggregateName: 'Stream';
    payload: {
      streamId: string;
      moduleId: string; // uuid модуля потока (для резолва курса)
    };
  }
  ```
- UC создания потока — после `streamRepo.save(...)` опубликовать событие (паттерн трека C2).

## FR2 — ER `invite-wishers` в wish

- `packages/wish/src/api/er/invite-wishers-er.ts`, подписан на `stream.created`:
  1. `place = await courseFacade.getModulePlace(moduleId)` — место модуля потока в опубликованном курсе.
  2. **Course-ветка** — только при `place?.isFirst` (набор на стартовый модуль): кандидаты `wishRepo.findAllByKind('course', ['expressed', 'confirmed'])`; матчинг принадлежности — `courseFacade.whichCoursesIncludeModule(moduleId, courseIds желаний)` (в т.ч. исторически: форки, архивные курсы). В событие идёт `courseId` **из желания** (при форке — исторический id): по нему работает cancel-маршрут.
  3. **Module-ветка** — на любой модуль потока: кандидаты `wishRepo.findAllByKind('module', ['expressed', 'confirmed'])`; матчинг — `courseFacade.whichModulesAreSame(moduleId, moduleIds желаний)` (batch, историческая идентичность модулей).
  4. Для каждого совпавшего — публикация события (`telegramId` — `userFacade.getUserByUuid(userId)`; профиля нет — пропуск):
  ```ts
  export interface WishInviteEvent extends DomainEvent {
    eventName: 'wish:invite';
    aggregateName: 'Wish';
    payload: {
      wishId: string;
      streamId: string;
      userId: string;
      telegramId: number;
      wishKind: 'course' | 'module';
      courseId?: string; // только course-желания (id из желания, для cancel-маршрута)
      moduleId?: string; // только module-желания (id из желания, для cancel-маршрута)
    };
  }
  ```
  Упрощения зафиксированы: `isFirst` определяется по текущему опубликованному курсу (переиспользование модуля в нескольких курсах сегодня не встречается); архивный/неопубликованный курс — course-ветка молчит (`getModulePlace` ищет по опубликованным), module-ветка работает всегда.
- Регистрация в `WishApiModule.reactions`.

## FR3 — UI: приглашение в боте

- Подписка на `wish:invite` (место — streams-контроллер, т.к. основная кнопка ведёт на экран потока; итоговое место стори — по arch-boundary-design на имплементации) → ProactiveSender.send — сообщение с кнопками (ломает текущий флоу: клавиатура предыдущего экрана снимается; уведомления `notify()` строго без кнопок — см. §3.5 bot-architecture.md).
- Текст адаптивный по `wishKind`: course → «📣 Открылся набор на курс, который ты хотел пройти!», module → «📣 Открылся набор на модуль, который ты хотел пройти!». Тело: название и дата старта потока (`get-stream`), строка ментора (`get-user` по `stream.mentorId`): `👤 Ментор: {name} (@{nick})` — `@{nick}` кликабельная ссылка `https://t.me/{nick}`, без `nick` — просто имя; подсказка: «Для записи нужен ключ зачисления — его выдаёт ментор».
- Кнопки:

  | Текст | Код |
  |-------|-----|
  | `📚 Открыть поток` | маршрут на экран потока (Routes) |
  | `🗑️ Отменить желание` | course: `course:course-catalog:cancel:{courseId}` (→ W05); module: `course:course-catalog:cancel-mod:{moduleId}` (→ W05-M) |

- Тон «на ты»; точная формулировка — на имплементации.
- Экран в UI-спеке: S11 (`streams/ui-spec.md`).

## FR4 — Метод репо `findAllByKind`

- `WishRepo` (интерфейс + JSON-реализация): `findAllByKind(kind: 'course' | 'module', statuses?: WishStatus[]): Promise<Wish[]>` — все желания по виду цели; `statuses` не задан — все статусы, задан — фильтр на стороне хранилища (сегодня JSON, завтра SQL — не тащим лишнее). Выборка по точной цели (`getByTarget`) не нужна: при форках идентичность решает фасад курсов, поэтому — выборка по виду, матчинг через фасад (FR2).

## FR5 — `cancel-wish`: вариант команды по `kind`

- `CancelWishCmdSchema` → дискриминированный вариант (зеркально `WishTargetSchema`): `{ kind: 'course', courseId } | { kind: 'module', moduleId }`. UC `cancel-wish` (имя сохраняется — цель теперь явна в команде) резолвит `WishTarget` по `kind`; проверки без изменений (отмена только из `expressed | confirmed`, иначе `WISH_NOT_FOUND`).
- Обновление вызовов: `course-catalog.story` (`{ courseId }` → `{ kind: 'course', courseId }`); новая module-ветка W05-M: `cancel-mod:{moduleId}` → подтверждение → `{ kind: 'module', moduleId }`.

## FR6 — Фасад курсов: batch-метод и гигиена

- `+ whichModulesAreSame(moduleId, moduleIds: string[]): Promise<string[]>` — batch-аналог `isSameModule`: какие из `moduleIds` исторически тот же модуль (сегодня `filter(id => id === moduleId)`, при появлении форков — генеалогия внутри модуля курсов).
- `− getStep` — внешне не используется.
- `getCourse` — убрать из интерфейса: нужен только внутри фасада (`isCourseEnrollable`, `getCourseStartModuleId`) → приватный хелпер.
- `isSameModule` остаётся — точечные проверки в `FulfillWishEr` (трек C2).

## Критерии приёмки

- [ ] Создание потока публикует `stream.created` (один раз).
- [ ] Поток на первый модуль курса: активные course-желающие получают приглашение (в т.ч. с историческими id через фасад); поток не на первом модуле — course-желающие не зовутся.
- [ ] Активные module-желающие получают приглашение на поток любого модуля (историческая идентичность через фасад).
- [ ] `fulfilled | cancelled | abandoned | pending` — не зовутся.
- [ ] Кнопка «Открыть поток» ведёт на экран потока; запись — через существующий ключ.
- [ ] «Отменить желание» работает для обоих видов желаний (course → W05, module → W05-M); `cancel-wish` принимает вариант команды по `kind`.
- [ ] Ментор-строка: `nick` заполнен — кликабельная t.me-ссылка; не заполнен — просто имя.
- [ ] Модуль/курс без активных желающих — рассылка пуста, ошибок нет.
- [ ] В `CourseFacade` нет `getStep`/`getCourse`, добавлен `whichModulesAreSame`.
- [ ] `bun run check:p stream`, `check:p wish`, `check:p course`, `check:a u7-bot` проходят.

## За рамками

- Список желающих для ментора (мониторинг) — бэклог.
- Автозапись в поток без ключа — осознанно нет.
- Повторные напоминания о наборе — бэклог (кандидат на Job после трека job-scheduler).
- «Мои заявки» — бэклог.
- Приглашения `fulfilled`-желающим (ретейкерам) — нет: повторное выражение желания руками.
- Course-рассылка для неопубликованного/архивного курса — нет (`getModulePlace` ищет по опубликованным).
- UX `isLast` («Вы завершили поток» без кнопки следующего модуля) — вне трека; контракт `getModulePlace` уже несёт `isLast`.

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику.
- [Трек C2 wish-fulfillment](../../archive/wish-fulfillment_20260814/spec.md) — событие зачисления, fulfill-wish.
- [Трек D wish-ui](../wish-ui_20260814/spec.md) — экраны W03–W05, cancel-флоу.
- [Трек job-scheduler](../job-scheduler_20260827/spec.md) — планировщик (потенциальные повторные напоминания).
- [view-stream.story.ts](../../apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts) — существующий флоу записи по ключу.
- [courses/ui-spec.md](../../apps/u7-bot/src/controllers/courses/ui-spec.md) — «Предложение о реализации» (этот трек), W05 / W05-M.
- [streams/ui-spec.md](../../apps/u7-bot/src/controllers/streams/ui-spec.md) — экран приглашения S11.
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач.
