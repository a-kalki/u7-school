# Спецификация — Трек D: wish UI (кнопка и экраны в каталоге курсов)

## Обзор

UI «желания пройти курс» встраивается в **каталог курсов** (`course-catalog.story`). У модуля `wish` **нет собственного контроллера** — вызовы идут через `appApi.execute(...)` из стори курсов.

Экраны и кнопки описаны в `apps/u7-bot/src/controllers/courses/ui-spec.md` (раздел «Желание пройти курс», экраны W01–W05).

Зависит от: **C1** (UC `express-wish`/`cancel-wish`), **B** (события/ownerInfo анкеты), а также рендер анкеты через `FillStory` + `ProactiveSender` (подписка на `questionnaire:start`/`questionnaire:invite`, треки `ui-event-subscriptions_20260816` и `ui-proactive-sender_20260816`).

## Текущее состояние (базовая линия)

- `apps/u7-bot/src/controllers/courses/stories/course-catalog.story.ts` — стори каталога; уровень 0 рендерит карточки курсов кнопками `{emoji} {course.title}` → `course:course-catalog:phases:{courseId}`.
- `apps/u7-bot/src/controllers/courses/controller.ts` — `CoursesController`, префикс `course`, стори `course-catalog`.
- `apps/u7-bot/src/controllers/courses/ui-spec.md` — раздел «Желание пройти курс» (📋) с экранами W01–W05.
- `packages/core/src/ui/bot/bot-ui-story.ts` — `BotUiStory` (`cb()`, `cbFor()`, `confirm()`, `handleError()`); в u7-bot стори наследуют `U7BotUiStory` (`apps/u7-bot/src/core/u7-bot-ui-story.ts`).
- `apps/u7-bot/src/controllers/shared/buttons.ts` — кнопка `buttons.mainMenu()`.

## Зафиксированные решения

1. Кнопка и экраны живут в **courses controller** (стори `course-catalog`), НЕ в отдельном контроллере wish.
2. Callback кнопки: `course:course-catalog:apply:{courseId}` (внутри стори — `this.cb('apply', course.uuid)`).
3. Отмена: `course:course-catalog:cancel:{courseId}` (+ подтверждение через `confirm()`).
4. `express-wish` возвращает `{ outcome: 'instant' | 'questionnaire' }` — стори решает, что рендерить.

## FR1 — Кнопка «🎓 Хочу пройти курс» на карточке курса

В `course-catalog.story` на уровне 0 (список курсов) к каждой карточке курса добавить вторую кнопку:

| Текст | Код |
|-------|-----|
| `🎓 Хочу пройти курс` | `course:course-catalog:apply:{courseId}` |

Кнопка — в тот же ряд или отдельным рядом рядом с кнопкой «{курс}».

## FR2 — Обработка `apply`

В `course-catalog.story.handleCallback` добавить ветку `apply:{courseId}`:

1. `const { outcome } = await this.appApi.execute('express-wish', { courseId }, actor.uuid);`
2. `outcome === 'instant'` → отрендерить **W03** («Желание зафиксировано»).
3. `outcome === 'questionnaire'` → вернуть `{}` (анкету проактивно рендерит `FillStory` через подписку на `questionnaire:start` и `ProactiveSender.send`; стори ничего не отправляет).
4. Ошибки:
   - `WISH_ALREADY_EXISTS` (конфликт) → экран **W04** («Ты уже выразил желание пройти этот курс»).
   - `COURSE_NOT_FOUND` и прочие → через `handleError()`.

## FR3 — Экраны W03 / W04 / W05

### W03 — Желание зафиксировано (мгновенный путь)

```
🎯 Твоё желание пройти курс зафиксировано!
```

Кнопки: `↩️ Главное меню` (`app:main-menu`).

### W04 — Желание уже есть / уже обучаешься

При конфликте `WISH_ALREADY_EXISTS`:
```
📝 Ты уже выразил желание пройти этот курс.
```
При статусе STUDENT (обучение) — аналогично «Ты уже обучаешься на этом курсе» (если проверка «обучается» реализуется — иначе достаточно конфликта желания).

Кнопки: `↩️ Главное меню`.

### W05 — Отмена желания

- Кнопка «Отменить желание» (место — «Мои заявки» в бэклоге ИЛИ на карточке курса при существующем желании; для v1 достаточно обработчика `cancel`).
- `course:course-catalog:cancel:{courseId}` → подтверждение через `this.confirm('cancel', courseId, 'Отменить желание пройти курс?')`.
- Подтверждение → `appApi.execute('cancel-wish', { courseId })` → сообщение об отмене.

## FR4 — Обновление ui-spec

- В `apps/u7-bot/src/controllers/courses/ui-spec.md` пометить реализованные экраны/кнопки как ✅ (W01–W05 по факту реализации), убрать устаревшие 📋-пометки для сделанного.

## Критерии приёмки

- [ ] Кнопка «🎓 Хочу пройти курс» рендерится на карточке курса.
- [ ] Клик → `express-wish`: мгновенный путь показывает W03; путь с анкетой запускает анкету.
- [ ] Повторный клик → W04 (конфликт обработан).
- [ ] Отмена → W05 (подтверждение + `cancel-wish`).
- [ ] `course/ui-spec.md` отражает реальное состояние.
- [ ] `bun run check:a u7-bot` проходит.

## За рамками

- «Мои заявки» (список желаний) — бэклог.
- «Продолжить анкету» (возобновление) — бэклог.

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику.
- [ddd-api](../../.pi/skills/ddd-api/SKILL.md) — шаблоны API-слоя.
- [course/ui-spec.md](../../apps/u7-bot/src/controllers/courses/ui-spec.md) — экраны W01–W05.
- [course-catalog.story.ts](../../apps/u7-bot/src/controllers/courses/stories/course-catalog.story.ts) — точка интеграции.
- [Трек C1](../../archive/wish-module_20260814/spec.md) — UC express-wish/cancel-wish.
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач.
