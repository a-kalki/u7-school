# Итоговый отчёт — Трек: Механизм уведомлений userFacade.notify (user-notify_20260902)

## Цель

Единый механизм уведомлений: любой UC / ER / Job отправляет уведомление одним
действием — `userFacade.notify(userId, text)` (UI-клиенты:
`appApi.execute('notify-user')`). UC `notify-user` (модуль user) публикует
канал-агностичное событие `user.notified {userId, text}` без мутаций; подписчик —
новый контроллер `user` (bot-ui) со сторей `notify`, которая резолвит telegramId,
рендерит (экранирование, MarkdownV2) и доставляет через `proactiveSender.notify`.
На механизм перенесены чистые уведомления (#3, #4, #7c/7d, #8) и устранён дубль
зачисления. Кнопочные проактивы (#1/#2, 7a/7b) и анкетные флоу не тронуты — этап B.

## Выполненные задачи

### Фаза 1 — Механизм
- Событие `UserNotifiedEvent` (`user.notified`) в `packages/user/src/domain/user/events.ts`.
- Команда `notify-user` (валидация userId + текста) и UC `NotifyUserUc` — публикация события через шину, ноль мутаций; регистрация в `UserApiModule`.
- `UserFacade.notify(userId, text, actorId?)` + реализация в `UserInProcFacade` (делегирование в UC).
- Контроллер `user` (bot-ui) со сторей `NotifyStory`: подписка на `user.notified`, резолв `get-user` → telegramId, экранирование plain-текста, `proactiveSender.notify`. Адресат не найден / нет telegramId → лог-ошибка и пропуск, приложение не падает. Контроллер зарегистрирован в `create-ui-app.ts`.

### Фаза 2 — Пилот (#3, #4)
- UC `drop-student`: ментору «🚪 Студент X покинул учёбу с потока «Y» по собственному желанию.» (имя с fallback на id; поток недоступен — пропуск).
- UC `mark-abandoned`: студенту «Ты снят с учёбы с потока «Y» за бездействие и исключён из его группы. Прогресс сохранён — если захочешь вернуться, напиши ментору потока.»
- `InactivityStory`: notify-ветки #3/#4 удалены; от реакции на `student.abandoned` остался мягкий кик из TG-группы; удалён резолвер `#resolveMentorTelegramId`. Кнопки #1/#2 и callback'и не тронуты.

### Фаза 3 — Закрытие потока (#7c/7d), набор (#8), дубль зачисления
- UC `complete-student` (advanced): последний модуль → «🎉 Курс завершён! Поздравляем — ты прошёл всю программу.»; место неизвестно → «🏁 Модуль завершён!»; есть следующий модуль / not_advanced → notify не шлётся (кнопки 7a/7b остаются в HubStory). Место — через `courseFacade.getModulePlace`.
- `HubStory`: безкнопочные ветки 7c/7d удалены; рендерятся только кнопочные.
- ER `invite-wishers`: текст FR-6 #8 собирает сам (поток/дата дд.мм.гггг/ментор) и шлёт `userFacade.notify` каждому совпавшему желающему; событие `wish:invite` удалено.
- Новый **`StreamFacade`** (interface + `StreamInProcFacade`) в `packages/stream` — чтение потока для wish-модуля; добавлен в `WishApiModuleResolver` и обе сборки (`create-api-app.ts`, `test-app.ts`).
- Удалены `WishInviteEvent`, сторя `WishInviteStory` (+ её unit/integration/e2e тесты); `StreamsController` — 3 стори.
- Подписка `HubStory` на `student.enrolled` удалена (дубль зачисления); событие осталось (слушает ER `fulfill-wish`). Флоу-ответ view-stream дополнен инструкцией «Теперь вы можете получить функционал по учёбе, набрав /start и перейдя по кнопке «Моя учёба»».

### Фаза 4 — E2E, документация
- E2E `tests/e2e/user-notify.e2e.test.ts`: открытие набора → одно уведомление желающему; закрытие на последнем модуле → поздравление; закрытие с следующим модулем → notify нет.
- E2E `inactivity.e2e.test.ts`: в стенд добавлен `UserController`, тексты #3/#4 проверяются через механизм.
- Интеграционный тест зачисления: инструкция в ответе + отсутствие дубля «Ты зачислен…».
- Документация: `streams/ui-spec.md` (S11 перенесён, SIN-A — тексты в UC), `learning/ui-spec.md` (S05n — только кнопочные ветки), `bot-architecture.md` (секция чистых уведомлений), `skills/bot-controller.md` (UserController), `tasks-system-implementation.md` (этап A — реализовано).

## Созданные файлы
- `packages/user/src/domain/user/events.ts`
- `packages/user/src/domain/user/commands/notify-user-cmd.ts`
- `packages/user/src/api/user/notify-user-uc.ts` (+ `.test.ts`)
- `packages/user/src/infra/user-in-proc-facade.test.ts`
- `packages/stream/src/domain/facade.ts`
- `packages/stream/src/infra/stream-in-proc-facade.ts`
- `apps/u7-bot/src/controllers/user/controller.ts`
- `apps/u7-bot/src/controllers/user/stories/notify.story.ts` (+ `.test.ts`)
- `apps/u7-bot/tests/e2e/user-notify.e2e.test.ts`

## Изменённые файлы (ключевые)
- `packages/user`: `api/module.ts`, `domain/module.ts`, `domain/index.ts`, `domain/facade.ts`, `infra/user-in-proc-facade.ts`
- `packages/stream`: `api/student/drop-student-uc.ts`, `mark-abandoned-uc.ts`, `complete-student-uc.ts` (+ тесты), `domain/index.ts`, `infra/index.ts`, `package.json` (import `#api/*`)
- `packages/wish`: `api/er/invite-wishers-er.ts` (+ тест переписан), `domain/module.ts`, `domain/index.ts`
- `packages/course/src/api/module.test.ts` (MockUserFacade + notify)
- `apps/u7-bot`: `create-ui-app.ts`, `create-api-app.ts`, `tests/helpers/test-app.ts`, `controllers/streams/controller.ts` (+ тест), `controllers/streams/stories/inactivity.story.ts` (+ тесты), `controllers/learning/stories/hub.ts` (+ тесты), `controllers/streams/stories/view-stream.story.ts`
- Документация: 2 ui-spec, 2 стайлгайда, `tasks-system-implementation.md`

## Удалённые файлы
- `packages/wish/src/domain/wish/events.ts` (WishInviteEvent)
- `apps/u7-bot/src/controllers/streams/stories/wish-invite.story.ts` (+ `.test.ts`)
- `apps/u7-bot/tests/streams/wish-invite.integration.test.ts`
- `apps/u7-bot/tests/e2e/wish-invite.e2e.test.ts`

## Архитектурные решения
1. **Событие вместо мутации**: UC `notify-user` не проверяет существование пользователя и ничего не пишет — доставка и её ошибки (best-effort) полностью в подписчике. Сбой доставки изолирует `InProcEventBus`.
2. **Текст — plain по контракту**: экранирование MarkdownV2 — в стори доставки; отправители не знают о канале.
3. **`StreamFacade`** вместо протекания stream-данных в событие: ER wish-модуля читает поток через фасад (разрешённое межмодульное взаимодействие: зависимый модуль импортирует фасад вышестоящего).
4. **Тексты уведомлений — в домене** (UC/ER), который владеет контекстом; UI только рендерит.
5. `notify-user` — `requiresAuth: false`, `type: command`: внутренний механизм, вызывается серверным кодом (фасад/appApi), валидация входа — schema.

## Отклонения от плана
- Тесты DI-моков существующих UC (`drop-student`, `mark-abandoned`, `complete-student`, course `module.test.ts`) дополнены методом `notify` / `streamRepo.getByUuid` — контрактная правка моков под новые вызовы, логика тестов не менялась.
- В e2e `user-notify.e2e.test.ts` для перевода студента в `active` использован существующий UC `activate-stream` (статус `enrolled` не завершается).
- Тест «пользователь без профиля — пропуск» ER заменён проверками деградации на уровне механизма (story пропускает без профиля/telegramId) и деградации текста в ER (поток/ментор).

## Ограничения и что дальше
- Ручная верификация фаз (Conductor-протокол) не проводилась — по явному указанию пользователя («выполни полностью не останавливаясь»); рекомендуются `/conductor:review` и ручной прогон сценариев в бою.
- Кнопочные проактивы #1/#2 (бездействие) и 7a/7b (завершение с кнопкой) — этап B (модуль задач).
- `bun run lint` (полный репозиторий) падает на контентных файлах `data/fullstack-js/**` — предсуществующая проблема из пользовательского коммита b143a9e1, к треку отношения не имеет; изменённые треком файлы линтер проходят чисто.
