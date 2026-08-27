# План реализации — Трек: wish на модуль + уведомления через события

> Перед каждой задачей сверяться с разделом «Зафиксированные решения» в [spec.md](./spec.md) — там контекст и границы, принятые с пользователем.

## Фаза 1: `notify()` — проактивные уведомления в core

- [x] Task: Падающие тесты: `BotTransport.notify` — не трогает `session.activeHandler`, сохраняет клавиатуру предыдущего экрана (`keepPrevKeyboard`), префиксация кнопок контроллером; делегирование `BotUiApp`/`BotController` (d3184ba)
- [x] Task: Реализация: `NotificationPayload` в `packages/core/src/ui/bot/types.ts`, метод `ProactiveSender.notify()`, реализации `BotTransport`/`BotUiApp`/`BotController` (d3184ba)
- [ ] Task: Conductor - Ручная верификация фазы 'notify API' (протокол в workflow.md)

## Фаза 2: Уведомление о зачислении

- [x] Task: Падающие тесты подписки `HubStory` на `student.enrolled`: резолв `telegramId` через `appApi.execute('user', 'get-user')`, текст «🎓 Ты зачислен…», кнопка «🎓 Моя учёба» через `this.cb('my-study')`, отправка через `notify` (00ff3ec)
- [x] Task: Реализация подписки в `learning/stories/hub.ts`; удалить шаг отправки из `EnrollStudentUc` + почистить его тесты от `tgFacade` (00ff3ec)
- [ ] Task: Conductor - Ручная верификация фазы 'Уведомление о зачислении' (протокол в workflow.md)

## Фаза 3: Событие `student.completed`

- [x] Task: Падающие тесты: `StudentAr.advance()`/`markNotAdvanced()` добавляют `StudentCompletedEvent` (payload: `studentId, userId, streamId, moduleId, outcome`); `CompleteStudentUc` публикует через `publishEvents`; шаг отправки через фасад удалён (bfe86c3)
- [x] Task: Реализация: `packages/stream/src/domain/student/events.ts` + `addEvent` в агрегате + `publishEvents` в UC (bfe86c3)
- [ ] Task: Conductor - Ручная верификация фазы 'Событие завершения' (протокол в workflow.md)

## Фаза 4: Доменный фасад курса

- [ ] Task: Падающие тесты методов `CourseFacade`: `isCourseEnrollable`, `getCourseStartModuleId`, `getModulePlace` (isFirst/isLast/prev/next), `isSameModule` (контракт исторической идентичности), `whichCoursesIncludeModule`
- [ ] Task: Реализация в `packages/course/src/domain/facade.ts` + InProc-реализация `packages/course/src/infra/course-in-proc-facade.ts`; переименование `filterCoursesContainingModule` → `whichCoursesIncludeModule` (обновить `FulfillWishEr` и тесты); перевод `create-course-wish` на новые методы
- [ ] Task: Conductor - Ручная верификация фазы 'Фасад курса' (протокол в workflow.md)

## Фаза 5: Wish на модуль

- [ ] Task: Падающие тесты: `WishTarget` принимает `{kind:'module', moduleId}`; UC `create-module-wish` (`getModulePlace` + `isCourseEnrollable` валидации, дедуп активного wish, `expressed`, без анкеты); fulfill-ветка module-wish через `isSameModule`
- [ ] Task: Реализация: схема target в `packages/wish/src/domain/wish/entity.ts`, `CreateModuleWishCmd` + UC + регистрация в `WishApiModule`, ветка в `FulfillWishEr`
- [ ] Task: Conductor - Ручная верификация фазы 'Wish на модуль' (протокол в workflow.md)

## Фаза 6: Уведомление о завершении с контекстными кнопками

- [ ] Task: Падающие тесты: `Routes.course.wishModule(moduleId)` + фабрика кнопок в `controllers/shared/`; обработчик нажатия в courses-контроллере → `create-module-wish` (успех/«желание уже есть»); тексты подписки `student.completed` по `getModulePlace` + `outcome` (next / repeat / «Курс завершён» без кнопки)
- [ ] Task: Реализация: `routes.ts`/`buttons.ts`, обработчик, финальные тексты в `HubStory`
- [ ] Task: Conductor - Ручная верификация фазы 'Кнопки завершения' (протокол в workflow.md)

## Фаза 7: Удаление TgFacade и чистка

- [ ] Task: Удалить: `packages/stream/src/domain/tg-facade.ts`, `apps/u7-bot/src/infra/telegram-tg-facade.ts` + тест, поле `tgFacade` в `StreamApiModuleResolver`, параметр в `create-api-app.ts` и `main.ts`, заглушку в `scripts/call-uc.ts` и `apps/u7-bot/tests/helpers/test-app.ts`, моки в тестах UC stream (`enroll`, `complete`, `drop`, `mark-abandoned`, `set-next-preference`, `activate-stream`, `complete-stream`)
- [ ] Task: Проверки: `rg TgFacade` → пусто; `bun run check` чисто; полный прогон тестов
- [ ] Task: Обновить `conductor/code_styleguides/bot-architecture.md` (сборка без tgFacade, раздел проактивных сообщений — `notify()`) и спеки треков wish-ui/wish-invite под новую модель фасада
- [ ] Task: Conductor - Ручная верификация фазы 'Удаление TgFacade' (протокол в workflow.md)
