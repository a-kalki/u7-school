# Спецификация — Трек D: wish UI (кнопка и экраны в каталоге курсов)

## Обзор

UI «желания пройти курс» встраивается в **каталог курсов** (`course-catalog.story`). У модуля `wish` **нет собственного контроллера** — вызовы идут через `appApi.execute(...)` из стори курсов.

Экраны и кнопки описаны в `apps/u7-bot/src/controllers/courses/ui-spec.md` (раздел «Желание пройти курс», экраны W01–W05).

> **Обновление (трек wish-module, 2026-09):** фасад курса перешёл на вопросительные
> доменные методы (`isCourseEnrollable`, `getCourseStartModuleId`, `getModulePlace`,
> `isSameModule`, `whichCoursesIncludeModule`) — валидация UC `create-course-wish`
> идёт через них. Появился UC `create-module-wish` (target `{kind:'module'}`,
> без анкеты) и кросс-контроллерная кнопка `buttons.wishModule(moduleId)` /
> `Routes.course.wishModule` — переиспользовать для новых кнопок желания.

Зависит от: **C1** (UC `create-course-wish`/`cancel-wish` — контракт закреплён в треке wish-lifecycle), **B** (события/ownerInfo анкеты), а также рендер анкеты через `FillStory` + `ProactiveSender` (подписка на `questionnaire:start`/`questionnaire:invite`, треки `ui-event-subscriptions_20260816` и `ui-proactive-sender_20260816`).

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
4. `create-course-wish` возвращает `{ outcome: 'instant' | 'questionnaire' }` — стори решает, что рендерить.
5. Кнопка «Хочу пройти курс» рендерится **всегда** (в том числе при активном желании или обучении): конфликт обрабатывается экраном W04, а не скрытием кнопки — скрытие потребовало бы отдельного query-статуса на каждую карточку каталога.
6. Ошибка `WISH_ALREADY_EXISTS` несёт `status` желания (смежная правка `packages/wish`: расширить payload ошибки) — W04 ветвится по статусу (FR3).
7. `completionText` пула анкеты доезжает до UI: проброс в `CompletedResponse` (смежная правка `packages/questionnaire`) + рендер в FillStory вместо хардкода (FR6).

## FR1 — Кнопка «🎓 Хочу пройти курс» на карточке курса

В `course-catalog.story` на уровне 0 (список курсов) к каждой карточке курса добавить вторую кнопку:

| Текст | Код |
|-------|-----|
| `🎓 Хочу пройти курс` | `course:course-catalog:apply:{courseId}` |

Кнопка — в тот же ряд или отдельным рядом рядом с кнопкой «{курс}».

Рендерится **всегда**, независимо от статуса желания/обучения (решение 5).

## FR2 — Обработка `apply`

В `course-catalog.story.handleCallback` добавить ветку `apply:{courseId}`:

1. `const { outcome } = await this.appApi.execute('create-course-wish', { courseId }, actor.uuid);`
2. `outcome === 'instant'` → отрендерить **W03** («Желание зафиксировано»).
3. `outcome === 'questionnaire'` → вернуть `{}` (анкету проактивно рендерит `FillStory` через подписку на `questionnaire:start` и `ProactiveSender.send`; стори ничего не отправляет).
4. Ошибки:
   - `WISH_ALREADY_EXISTS` (конфликт; payload ошибки содержит `status` желания) → экран **W04** с ветвлением по статусу (FR3).
   - `COURSE_NOT_FOUND` и прочие → через `handleError()`.

## FR3 — Экраны W03 / W04 / W05

### W03 — Желание зафиксировано (мгновенный путь)

```
🎯 Твоё желание пройти курс зафиксировано!

Мы напишем тебе, когда откроется набор на этот курс.
```

Кнопки: `↩️ Главное меню` (`app:main-menu`).

### W04 — Желание уже есть / анкета начата

При конфликте `WISH_ALREADY_EXISTS` — ветвление по `status` желания:

**`pending` — анкета начата, но не завершена (пользователь не заперт — есть выход):**

```
📝 Ты начал заполнять анкету по этому курсу, но не закончил её.
Продолжи — и желание будет закреплено.
```

| Текст | Код |
|-------|-----|
| `▶️ Продолжить анкету` | `Routes.questionnaire.resume(courseId)` → `questionnaire:fill:resume:{courseId}` |
| `↩️ Главное меню` | `app:main-menu` |

**`expressed | confirmed` — желание уже выражено:**

```
📝 Ты уже выразил желание пройти этот курс.
```

или (при обучении):

```
📚 Ты уже обучаешься на этом курсе.
```

| Текст | Код |
|-------|-----|
| `🗑️ Отменить желание` | `course:course-catalog:cancel:{courseId}` (вход в W05) |
| `↩️ Главное меню` | `app:main-menu` |

### W05 — Отмена желания

- Вход — кнопка «🗑️ Отменить желание» на W04 (ветка `expressed | confirmed`); «Мои заявки» как альтернативное место — бэклог.
- `course:course-catalog:cancel:{courseId}` → подтверждение через `this.confirm('cancel', courseId, 'Отменить желание пройти курс?')`.
- Подтверждение → `appApi.execute('cancel-wish', { courseId })` → сообщение об отмене.
- Отмена доступна из `expressed | confirmed`; для `pending` `cancel-wish` возвращает `WISH_NOT_FOUND` (анкетная ветка закрывается через `questionnaire:abandon`).

## FR4 — Обновление ui-spec

- В `apps/u7-bot/src/controllers/courses/ui-spec.md` пометить реализованные экраны/кнопки как ✅ (W01–W05 по факту реализации), убрать устаревшие 📋-пометки для сделанного.

## FR5 — Ветка `fill:resume:{courseId}` в FillStory (продолжение анкеты)

- В `apps/u7-bot/src/controllers/questionnaire/fill.story.ts` добавить ветку `resume:{courseId}`:
  1. Найти активную анкету пользователя: `get-questionnaires-by-user` → фильтр `status = 'in_progress'`, `kind = 'standard'`, `ownerInfo.courseId = {courseId}`.
  2. Найдена → рендер текущего вопроса (как ветка `current`) + `captureInput` (восстановление сессии).
  3. Не найдена → «Анкета не найдена или уже завершена» + главное меню.
- Кросс-контроллерная кнопка — через `Routes.questionnaire.resume(courseId)` в `controllers/shared/routes.ts` (каноническое место «чужих» адресов).
- Механика переиспользуется предупреждением о брошенной анкете (трек job-scheduler).

## FR6 — `completionText` из пула (смежная правка questionnaire)

- `CompletedResponse` (`packages/questionnaire/src/domain/questionnaire/types.ts`) получает опциональное `completionText` (проброс из `questionPool` в ответ при завершении).
- FillStory, ветка `completed` в `#renderActionResponse`: рендерит `completionText ?? 'Спасибо! Твоя анкета принята.'` (тон «на ты»); хардкод «Спасибо! Ваша анкета принята.» удаляется.

## FR7 — Прогресс анкеты («Вопрос N из M»)

- FillStory `#formatQuestionMd`: к тексту каждого вопроса добавлять шапку `Вопрос {N} из {M}` (N — индекс текущего вопроса в пуле, M — общий размер пула; для условных веток M не меняется).
- Мотивация: анкета из 11 вопросов без прогресса теряет пользователей на середине.

## FR8 — Подсказка `/cancel` в первом вопросе

- При старте из карточки курса экран-приглашение (S01, `inviteText`) не показывается — пользователь не знает про `/cancel` (только из `/help`).
- FillStory: в первом вопросе анкеты (когда `previousQuestion` отсутствует) добавлять строку: «В любой момент можно нажать /cancel — вернёшься в главное меню.»

## Критерии приёмки

- [ ] Кнопка «🎓 Хочу пройти курс» рендерится на карточке курса.
- [ ] Клик → `create-course-wish`: мгновенный путь показывает W03; путь с анкетой запускает анкету.
- [ ] Повторный клик → W04 (конфликт обработан).
- [ ] Отмена → W05 (подтверждение + `cancel-wish`).
- [ ] W04 при `pending` показывает кнопку «▶️ Продолжить анкету» — анкета продолжается с места остановки.
- [ ] W04 при `expressed/confirmed` даёт кнопку «🗑️ Отменить желание» → W05 (отмена доступна из UI).
- [ ] Completed-экран рендерит `completionText` из пула (не хардкод на «вы»).
- [ ] В анкете виден прогресс «Вопрос N из M»; в первом вопросе — подсказка про `/cancel`.
- [ ] `course/ui-spec.md` отражает реальное состояние.
- [ ] `bun run check:a u7-bot` проходит.

## За рамками

- «Мои заявки» (список желаний) — бэклог.
- Предупреждение и автопрерывание брошенной анкеты — отдельный трек job-scheduler (переиспользует `fill:resume` из FR5).

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику.
- [ddd-api](../../.pi/skills/ddd-api/SKILL.md) — шаблоны API-слоя.
- [course/ui-spec.md](../../apps/u7-bot/src/controllers/courses/ui-spec.md) — экраны W01–W05.
- [course-catalog.story.ts](../../apps/u7-bot/src/controllers/courses/stories/course-catalog.story.ts) — точка интеграции.
- [Трек C1 (архив)](../../archive/wish-module_20260814/spec.md) + [трек wish-lifecycle (архив)](../../archive/wish-lifecycle_20260826/spec.md) — UC create-course-wish/cancel-wish, target-модель, полный жизненный цикл.
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач.
