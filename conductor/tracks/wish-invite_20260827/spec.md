# Спецификация — Трек E: wish-invite — приглашение желающим при открытии набора

## Обзор

Замыкает цикл желания: при создании потока (открытии набора на курс) все активные желающие получают приглашение с кнопками. Без этого трека желание — «письмо в никуда»: пользователь выразил желание и не узнаёт о наборе.

Полный цикл: кнопка «Хочу пройти курс» (трек D) → анкета → желание `expressed/confirmed` → **приглашение при открытии набора (этот трек)** → запись в поток по ключу (существующий флоу) → зачисление → `fulfilled` (трек C2).

Порядок выполнения: **после треков C2 и D** (переиспользует cancel-флоу W05 и событийную модель C2).

## Текущее состояние (базовая линия)

- `StreamAr.create` создаёт поток сразу в статусе `ENROLLMENT` (набор открыт); `activate()` → ACTIVE. Событий при создании потока нет (первое событие stream добавляет трек C2 — `student.enrolled`).
- `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts` — существующий флоу самозаписи: карточка потока → «Записаться» → ввод ключа зачисления (`enrollmentKey`).
- `packages/wish/` — UC `cancel-wish` есть; репо умеет `getByUserAndTarget`, поиска «все желающие по цели» нет.
- ProactiveSender + UiEventSubscription-подписки — паттерн отработан (FillStory).
- В `courses/ui-spec.md` фича записана как «Предложение о реализации» — этот трек её реализует.

## Зафиксированные решения

1. **Триггер — создание потока** (`StreamAr.create`, статус сразу `ENROLLMENT`): UC создания потока публикует событие `stream.created` после сохранения.
2. **ER `invite-wishers`** в модуле wish: резолвит курс по `moduleId` потока (через `courseFacade`), находит желающих и публикует событие `wish:invite` на каждого. `telegramId` — через `userFacade.getUser(userId)`.
3. **UI-сообщение** рендерится подпиской в боте через ProactiveSender. Кнопки: «📚 Открыть поток» (существующий экран потока, запись по ключу) и «🗑️ Отменить желание» (cancel-флоу W05 трека D).
4. **Запись не автоматическая** — пользователь сам жмёт «Записаться» и вводит ключ: сохраняется защита от случайных зачислений, переиспользуется готовый флоу.
5. Идемпотентность: событие `stream.created` публикуется один раз при создании; повторной рассылки для того же потока нет.

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
  1. `place = await courseFacade.getModulePlace(moduleId)`; места нет (модуль вне опубликованных курсов) — пропуск. Идентичность и связи модуль↔курс решает только модуль курсов (см. фасадную модель трека wish-module).
  2. Два вида желающих: course-wishes курса `place.courseId` (при `place.isFirst` — это набор на стартовый модуль, зовём желающих курса) и module-wishes, совпадающие с `moduleId` по `isSameModule` (набор на следующий/тот же модуль). Поиск: `wishRepo.getByTarget(target)` (новый метод, FR4), фильтр активных: `expressed | confirmed`.
  3. Для каждого — публикация события:
  ```ts
  interface WishInviteEvent extends DomainEvent {
    eventName: 'wish:invite';
    ownerInfo: { courseId: string; streamId: string };
    payload: { userId: string; telegramId: number };
  }
  ```
- Регистрация в `WishApiModule.reactions`.

## FR3 — UI: приглашение в боте

- Подписка на `wish:invite` (место — streams-контроллер, т.к. основная кнопка ведёт на экран потока; итоговое место стори — по arch-boundary-design на имплементации) → `ProactiveSender.send` — сообщение с кнопками (ломает текущий флоу: клавиатура предыдущего экрана снимается; уведомления `notify()` строго без кнопок — см. §3.5 bot-architecture.md):
  ```
  📣 Открылся набор на курс, который ты хотел пройти!
  ```
  | Текст | Код |
  |-------|-----|
  | `📚 Открыть поток` | маршрут на экран потока (Routes) |
  | `🗑️ Отменить желание` | `Routes` → cancel-флоу W05 (трек D) |
- Тон «на ты»; точная формулировка — на имплементации.

## FR4 — Метод репо `getByTarget`

- `WishRepo` (интерфейс + JSON-реализация): `getByTarget(target: WishTarget): WishState[]` — все желания по цели без фильтра статуса; фильтрацию по статусу делает ER.

## Критерии приёмки

- [ ] Создание потока публикует `stream.created` (один раз).
- [ ] Желающие (`expressed | confirmed`) курса потока получают приглашение; `fulfilled | cancelled | abandoned | pending` — нет.
- [ ] Кнопка «Открыть поток» ведёт на экран потока; запись — через существующий ключ.
- [ ] Кнопка «Отменить желание» работает (W05-флоу трека D).
- [ ] Курс без желающих — рассылка пуста, ошибок нет.
- [ ] `bun run check:p stream`, `check:p wish`, `check:a u7-bot` проходят.

## За рамками

- Список желающих для ментора (мониторинг) — бэклог.
- Автозапись в поток без ключа — осознанно нет.
- Повторные напоминания о наборе — бэклог (кандидат на Job после трека job-scheduler).
- «Мои заявки» — бэклог.

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику.
- [Трек C2 wish-fulfillment](../../archive/wish-fulfillment_20260814/spec.md) — событие зачисления, fulfill-wish.
- [Трек D wish-ui](../wish-ui_20260814/spec.md) — экраны W03–W05, cancel-флоу.
- [Трек job-scheduler](../job-scheduler_20260827/spec.md) — планировщик (потенциальные повторные напоминания).
- [view-stream.story.ts](../../apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts) — существующий флоу записи по ключу.
- [courses/ui-spec.md](../../apps/u7-bot/src/controllers/courses/ui-spec.md) — «Предложение о реализации» (этот трек).
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач.
