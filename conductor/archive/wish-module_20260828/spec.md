# Спецификация — Трек: wish на модуль + уведомления через события

## Обзор

Три связанных изменения:

1. **Фасад курса — доменный язык записи:** вопросы «доступен ли курс», «какой модуль стартовый», «место модуля в программе», «та же ли это история модуля» задаются только модулю курсов через фасад с доменными именами.
2. **Wish на модуль:** к желанию на курс добавляется желание на модуль (следующий/тот же) — со своим жизненным циклом, без анкеты.
3. **Уведомления через события стори:** UC домена stream перестают формировать пользовательские тексты; порт `TgFacade` удаляется полностью, доставка — подписки стори на доменные события через новый API `notify()`.

Зависит от: wish-fulfillment (fulfill-wish ER, событие `student.enrolled`), architecture-evolution §3 (границы модулей).

## Текущее состояние (базовая линия)

- `TgFacade` (порт `packages/stream/src/domain/tg-facade.ts`, реализация `apps/u7-bot/src/infra/telegram-tg-facade.ts`) используется только в `enroll-student-uc` (шаг 7, try/catch) и `complete-student-uc` (без try/catch — сбой Telegram валит UC после успешного сохранения).
- Механизм подписок стори уже есть: `UiStory.getEventSubscriptions()` + `proactiveSender.send()`; живой прецедент — `apps/u7-bot/src/controllers/questionnaire/fill.story.ts` (события questionnaire:start/invite).
- `BotTransport.execute()` перед новым `sendMessage` удаляет inline-клавиатуру предыдущего сообщения, если не задан `keepPrevKeyboard: true`; `ProactiveSender.send()` перезаписывает `session.activeHandler` только если в команде есть `captureInput`.
- `WishTarget` — только `{ kind: 'course', courseId }`; `FulfillWishEr` матчит course-wishes через `courseFacade.filterCoursesContainingModule`.
- У `Module` нет полей версионности; курс — `moduleIds: uuid[]`. Возможность «копия модуля с другим id» — будущая, контракт фасада должен её пережить.

## Зафиксированные решения (контекст для реализации)

> Приняты в диалоге с пользователем. Не пересматривать без явного указания.

1. **Никаких Telegram-портов в домене.** Пользовательский текст и канал доставки — ответственность UI-слоя. Все уведомления студенту — только стори по доменным событиям. `TgFacade` удаляется целиком, «переводить других пользователей» не нужно — runtime-вызовы только в двух названных UC.
2. **API `notify()` — уведомление как отдельный тип команды.** `ProactiveSender.notify(telegramId, NotificationPayload)` вместо флагов в `BotCommand`: по построению без `captureInput`/`releaseInput`/`editMessage`, реализация транспорта ставит `keepPrevKeyboard: true`. Клиент не должен помнить про флаги.
3. **События:** `student.enrolled` — существует; `student.completed` — новый (payload: `studentId, userId, streamId, moduleId, outcome: 'advanced' | 'not_advanced'`), добавляется `StudentAr.advance()`/`markNotAdvanced()`, публикуется UC через `publishEvents`. `abandoned` не уведомляется.
4. **WishTarget НЕ унифицировать.** Два варианта: `{ kind: 'course', courseId }` и `{ kind: 'module', moduleId }`. Миграция данных не нужна. Отказались от ранней идеи «всё через module-wish на первый модуль»: сохранение двух kind точнее отражает намерения клиента.
5. **Идентичность и связи модуль↔курс решает только модуль курсов.** wish-модуль никогда не сравнивает два `moduleId` напрямую и не интерпретирует id: матчинг module-wish — через `facade.isSameModule` (историческая идентичность: копия модуля с другим id — тот же модуль; сегодня реализация тривиальна, контракт — на будущее), course-wish — через `facade.whichCoursesIncludeModule`. Приглашения будущих треков — через `getModulePlace().isFirst`.
6. **Два UC с явными именами** (разные UX-операции, одна модель): `create-course-wish` — «запись на курс»: `isCourseEnrollable` + `getCourseStartModuleId` (валидация наличия стартового модуля), пул анкеты, статусы как сейчас; `create-module-wish` — «запись на следующий/тот же модуль»: `getModulePlace` (модуль существует, курс опубликован), дедуп активного wish, статус `expressed`, БЕЗ анкеты (студент уже верифицирован).
7. **Доменные имена фасада — вопросительные, батчинг вторичен:** «понимание важнее батчинга». `filterCoursesContainingModule` переименовывается в `whichCoursesIncludeModule`.
8. **telegramId — резолв в стори** через `appApi.execute('user', 'get-user')`; payload доменных событий stream не расширять каналальными данными.
9. **Кнопки:** своя кнопка контроллера — `this.cb` (кнопка «🎓 Моя учёба» уведомления о зачислении, его шлёт HubStory); кросс-контроллерная — только через `controllers/shared/routes.ts` + `buttons`-фабрику (кнопки завершения ведут из learning в courses). `moduleId` в `callback_data` сжимается (shortId); после рестарта stale-alert — принято, как у каталога.
10. **Текст уведомления о завершении** определяется парой `(outcome, getModulePlace(moduleId))`: `advanced` + не последний → предложение следующего; `not_advanced` → повтор того же; `advanced` + `isLast` → «Курс завершён», без кнопки, wish не создаётся.

## Сценарий жизненного пути (инварианты)

| Момент | Компонент | Вызов фасада | Решение |
|---|---|---|---|
| «Хочу пройти курс C» | UC `create-course-wish` | `isCourseEnrollable`, `getCourseStartModuleId` | курс доступен, есть стартовый модуль → wish `{course}` (pending с анкетой / expressed) |
| Открытие набора на M *(трек wish-invite, здесь только API)* | ER приглашений | `getModulePlace(M)`, `isSameModule` | `isFirst` → звать course-wishes курса; `isSameModule` → звать module-wishes |
| Зачисление на M | ER `fulfill-wish` (событие `student.enrolled`) | `whichCoursesIncludeModule`, `isSameModule` | совпавшие активные wishes → `fulfilled` |
| Сторя learning | подписка `student.enrolled` | — (`get-user` для telegramId) | уведомление «Ты зачислен» + «🎓 Моя учёба» через `notify()` |
| Завершение M (`advanced`) | UC `complete-student` → событие `student.completed` | — | сторя: `getModulePlace(M)` → кнопка «➡️ Следующий модуль» |
| Нажата кнопка | UC `create-module-wish` | `getModulePlace`, `isCourseEnrollable` | wish `{module: next}` `expressed`, без анкеты |
| Завершение M (`not_advanced`) | то же | `getModulePlace(M)` | кнопка «🔁 Пройти модуль снова» → wish `{module: тот же}` |
| Завершение последнего (`advanced`, `isLast`) | то же | `getModulePlace(M)` | «🎉 Курс завершён», без кнопки |

Копия модуля `M2'` вместо `M2`: wish `{module: M2}` остаётся валидным — `isSameModule(M2', M2) = true` решает владелец данных.

## Функциональные требования

**FR1. API `notify()`.** `NotificationPayload { text, keyboard?, parseMode? }` + `ProactiveSender.notify()`; реализации: `BotTransport` (ставит `keepPrevKeyboard: true`), `BotUiApp`, `BotController` (префиксация кнопок).
**FR2. Уведомление о зачислении.** Сторя `learning/hub` подписана на `student.enrolled`; telegramId через `get-user`; сообщение с кнопкой «🎓 Моя учёба» (`this.cb`).
**FR3. Событие `student.completed`.** `StudentAr.advance()`/`markNotAdvanced()` добавляют событие (payload см. решение 3); `CompleteStudentUc` публикует; отправка через фасад удалена из обоих UC.
**FR4. WishTarget + `{ kind: 'module', moduleId }`.** Вариант course не меняется; миграция не требуется.
**FR5. `create-course-wish`** переводится на `isCourseEnrollable` + `getCourseStartModuleId`; флоу анкеты/статусов — без изменений.
**FR6. UC `create-module-wish`.** Валидации через фасад (решение 6), дедуп активного wish, `expressed`.
**FR7. Фасад курса.** Новые `isCourseEnrollable`, `getCourseStartModuleId`, `getModulePlace` (`{courseId, isFirst, isLast, prevModuleId?, nextModuleId?}`), `isSameModule`; переименование `filterCoursesContainingModule` → `whichCoursesIncludeModule`; статус курса и связи модуль↔курс — внутренняя кухня модуля курсов; обновить InProc-реализацию и потребителей.
**FR8. Fulfill по модулю.** `FulfillWishEr`: course-wish → `whichCoursesIncludeModule`; module-wish → `isSameModule`.
**FR9. Уведомление о завершении.** По `student.completed` + `getModulePlace` + `outcome` — три варианта текста/кнопок (решение 10); кнопки — `Routes.course.wishModule(moduleId)` + фабрика `buttons`; обработчик кнопки → `create-module-wish`.
**FR10. Удаление TgFacade.** Порт, реализация + тест, поле `StreamApiModuleResolver.tgFacade`, wiring `main.ts`/`create-api-app.ts`, шаги отправки в UC, моки в тестах UC, `scripts/call-uc.ts`, `apps/u7-bot/tests/helpers/test-app.ts`.

## Нефункциональные требования

**NFR1.** Уведомления не вмешиваются в поток пользователя: без захвата ввода, предыдущие кнопки сохраняются, нажатие кнопки уведомления при активном вводе другого контроллера даёт alert (существующий guard `BotUiApp`).
**NFR2.** Сбой отправки уведомления не валит UC (изоляция ошибок подписчиков шиной `InProcEventBus`).
**NFR3.** MarkdownV2-безопасность (единая точка проверки в транспорте).
**NFR4.** Идентичность и связи модулей/курсов решаются только модулем курсов через фасад; wish-модуль не интерпретирует id.

## Критерии приёмки

1. Зачисление → уведомление с рабочей кнопкой «Моя учёба»; кнопки каталога пользователя сохраняются.
2. Завершение `advanced` (не последний) → кнопка создаёт wish на следующий модуль; `not_advanced` → на тот же; `advanced` на последнем → уведомление без кнопки; `abandoned` → тишина.
3. Уведомление во время заполнения анкеты не сбивает ввод; нажатие кнопки уведомления в этот момент даёт alert.
4. `rg TgFacade` по репозиторию — пусто.
5. Юнит-тесты фиксируют контракты `isSameModule` (включая будущую версию с копиями) и `getModulePlace` (isFirst/isLast/next); `FulfillWishEr` — обе ветки.
6. `bun run check` — чисто.

## За рамками

- Событие `wish.fulfilled` и уведомления на его основе.
- Приглашения при открытии набора (трек wish-invite — фасадный API уже обеспечивает).
- Уведомления при отчислении (`drop-student`, `mark-abandoned`), массовые рассылки.
- Миграция `FillStory` на `notify()`.
- Интеграционные/e2e тесты сквозной синхронизации модулей — отдельный трек перед релизом.
- История версий модулей в данных (контракт `isSameModule` готов, реализация тривиальна).
