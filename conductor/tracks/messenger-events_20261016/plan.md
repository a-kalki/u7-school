# План реализации: События мессенджера (группы и чаты) — абстракция в Core, обработчики в School и Stream, ProactiveSender.execute

**Трек:** `messenger-events_20261016`  
**Методология:** TDD (Red → Green → Refactor), поэтапная верификация слоёв.

---

## Фаза 1: Core — Контракты Inbound и Outbound мессенджера

- [x] Task: Добавить типы `MessengerEvent`, `MessengerAction`, `MessengerEventReaction`, `ChatMemberUser` в `packages/core/src/ui/bot/types.ts` [119b902]
    - [x] [Red] Написать тесты на совместимость типов и контрактов в `packages/core/src/ui/bot/types.test.ts`.
    - [x] [Green] Объявить `MessengerEvent` (joined, left, bot_membership), `MessengerEventReaction` ('pass' | 'stop'), `MessengerAction` (kick_member, etc.) и расширить `ProactiveSender` методом `execute(action: MessengerAction): Promise<void>`.
    - [x] Пометить метод `kickFromGroup` как `@deprecated`.
- [x] Task: Поддержка `handleMessengerEvent` (цепочка stop/pass, гост-регистрация) и `execute` в `BotController` и `BotUiApp` [TDD] [0c68cc4]
    - [x] [Red] Тест в `ui-app.test.ts`: при вызове `uiApp.handleMessengerEvent(event)` с объектом участника автоматически вызывается `ensureRegisteredGuest`.
    - [x] [Red] Тест в `ui-app.test.ts`: вызов `uiApp.handleMessengerEvent(event)` последовательно опрашивает контроллеры и прерывается при ответе `'stop'`.
    - [x] [Green] Реализовать централизованную регистрацию гостя и цепочку диспетчеризации в `U7BotUiApp` / `BotUiApp`.
    - [x] [Green] Опциональный хук `handleMessengerEvent?(event): Promise<MessengerEventReaction | undefined>` в `BotController`.
    - [x] [Red/Green] Делегирование `execute(action)` из `BotController` в `proactiveSender.execute(action)`.

---

## Фаза 2: Domain — Права роли SUBSCRIBER в UserPolicy (закрытие TODO.md)

- [x] Task: Разрешить управление ролью `SUBSCRIBER` администратору [TDD] [1a2fbc2]
    - [x] [Red] Тесты в `packages/user/src/domain/user/policy.test.ts`:
        - `UserPolicy.canAddRole(targetUser, Role.SUBSCRIBER, adminActor)` возвращает `true`;
        - `UserPolicy.canRemoveRole(targetUser, Role.SUBSCRIBER, adminActor)` возвращает `true`.
        - Не-админ не может добавлять/снимать `SUBSCRIBER` (возвращает `false`).
    - [x] [Green] Добавить правило в `UserPolicy.canAddRole` и `UserPolicy.canRemoveRole`.
    - [x] Удалить пункт о неработающей роли `SUBSCRIBER` из `TODO.md`.

---

## Фаза 3: Transport — Маппинг событий Telegram и исполнение действий

- [x] Task: Реализовать `execute(action: MessengerAction)` в `BotTransport` [TDD] [7efccfa]
    - [x] [Red] Тесты в `apps/u7-bot/src/infra/bot-transport.test.ts`:
        - `execute({ kind: 'kick_member', chatId, userId })` вызывает `banChatMember` + `unbanChatMember`.
    - [x] [Green] Реализовать метод `execute` в `BotTransport`.
    - [x] Переписать `kickFromGroup` в `BotTransport` как вызов `this.execute({ kind: 'kick_member', ... })`.
- [x] Task: Маппинг `chat_member` и `my_chat_member` в `MessengerEvent` в `BotTransport` [TDD] [30949ee]
    - [x] [Red] Тесты в `apps/u7-bot/src/infra/bot-transport.test.ts`:
        - переход `left → member` маппится в `{ kind: 'member_joined', chatId, user }`;
        - переход `member → left` (или `kicked`) маппится в `{ kind: 'member_left', chatId, user, kicked }`;
        - `my_chat_member` переход `left → member|administrator` маппится в `{ kind: 'bot_membership', status: 'added', ... }`;
        - технические изменения прав без смены членства игнорируются (не порождают лишних событий).
    - [x] [Green] Подключить обработчики в `BotTransport`, передающие события в `uiApp.handleMessengerEvent(event)`.

---

## Фаза 4: SchoolController — Роль SUBSCRIBER для школьного сообщества

- [x] Task: Реализовать реакцию на события школьной группы в `SchoolController` [TDD] [2c0bee0]
    - [x] [Red] Тесты в `apps/u7-bot/src/controllers/school/controller.test.ts`:
        - При `bot_membership(status: 'added')` в группе школы (`school.communityGroup.id`): `userFacade.addRoleToUser(uuid, SUBSCRIBER, adminActor)` и `'stop'`;
        - При `member_joined` в группе школы: `userFacade.addRoleToUser(uuid, SUBSCRIBER, adminActor)` и `'stop'`;
        - При `member_left` в группе школы: `userFacade.removeRoleFromUser(uuid, SUBSCRIBER, adminActor)` и `'stop'`;
        - События в чужих группах пропускаются (`'pass'`).
    - [x] [Green] Реализация `handleMessengerEvent` в `SchoolController`.

---

## Фаза 5: StreamController — Обработка студенческих групп потоков

- [x] Task: Реализовать реакцию на вход и выход участников в учебную группу в `StreamController` [TDD] [44017a3]
    - [x] [Red] Тесты в `apps/u7-bot/src/controllers/streams/controller.test.ts`:
        - При `member_joined` в группу с `stream.telegramGroupId`:
          - если участник НЕ является студентом этого потока → отправка ментору предупреждения: `⚠️ В группу «...» вступил неизвестный участник: ...`;
          - если участник — активный студент потока → ментор предупреждение не получает;
          - возвращает `'stop'`.
        - При `member_left` из группы с `stream.telegramGroupId` (FR-7):
          - если вышедший студент активен в потоке (`outcomeCategory === IN_PROGRESS`) → отправка `proactiveSender.notify(mentorTgId, "🚪 Студент ...")`;
          - если студент не активен (завершён, отчислен) или вышел из чужого чата → уведомление ментору не отправляется;
          - возвращает `'stop'`.
    - [x] [Green] Реализовать логику в `StreamController.handleMessengerEvent`.

---

## Фаза 6: Интеграция, очистка и верификация

- [x] Task: Перевести стори и тесты на `execute` вместо `kickFromGroup` [f774378]
    - [x] Обновить `apps/u7-bot/src/controllers/streams/stories/inactivity.story.ts`: вызов `this.proactiveSender.execute({ kind: 'kick_member', ... })`.
    - [x] Обновить тестовые хелперы `TestBotTransport`.
- [x] Task: Удалить процедурный `group-handler.ts` и `group-handler.test.ts` [6e45b93]
    - [x] Убрать вызов `registerGroupHandlers` из `apps/u7-bot/src/main.ts`.
    - [x] Удалить файлы `apps/u7-bot/src/handlers/group-handler.ts` и `group-handler.test.ts`.
- [x] Task: Актуализировать e2e-тесты [7bfb32a]
    - [x] Перевести `apps/u7-bot/tests/e2e/inactivity.e2e.test.ts` на эмуляцию через `uiApp.handleMessengerEvent`.
    - [x] Убедиться, что тест `inactivity.e2e.test.ts` полностью зелёный.
- [ ] Task: Финальная сквозная проверка качества
    - [ ] Запуск `bun run check` (типизация `tsc --noEmit`, линтер `biome check`, полный прогон всех юнит/интеграционных/e2e тестов).
- [ ] Task: Conductor - User Manual Verification 'События мессенджера' (Protocol in workflow.md)
