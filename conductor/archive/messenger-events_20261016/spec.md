# Спецификация: События мессенджера (группы и чаты) — абстракция в Core, обработчики в School и Stream, ProactiveSender.execute

**Тип:** feature / refactor  
**Трек:** `messenger-events_20261016`  
**Релизная группа:** `0.3.x` (bot-ui архитектура)  
**Зависимости:** `bot-ui-session-architecture.md`, ревизия ФР-4 (трек 1.1), `TODO.md` (роль `SUBSCRIBER`)

---

## 1. Обзор и контекст

В ходе ревизии ФР-4 (трек 1.1) и анализа текущей архитектуры выявлены следующие технические долги:

1. **Процедурный артефакт `group-handler.ts`:**
   Файл `apps/u7-bot/src/handlers/group-handler.ts` подключён напрямую к сырому экземпляру GramMY в `main.ts` (`bot.on('chat_member')`, `bot.on('my_chat_member')`), минуя архитектуру `BotUiApp` / `U7BotController`.
2. **Смешение разнородных доменов:**
   В одном файле смешаны:
   - Системная регистрация в школе: вход в группу сообщества школы (`school.communityGroup.id`), вызов `registerGuest` и выдача/снятие роли `SUBSCRIBER`.
   - Учебный домен потоков (FR-7): выход студента из группы учебного потока (`stream.telegramGroupId`), перебор `list-streams`, проверка статуса студента и отправка уведомления ментору.
3. **Дефект роли `SUBSCRIBER` из `TODO.md`:**
   В `apps/u7-bot/src/handlers/group-handler.ts` вызовы `addRoleToUser` и `removeRoleFromUser` для `SUBSCRIBER` падают на проверке прав `UserPolicy.canAddRole` / `canRemoveRole` и тихо глушатся в `try/catch`. Системный/ADMIN актор должен иметь явное право управлять ролью `SUBSCRIBER`.
4. **Нарушение SRP в `ProactiveSender`:**
   Интерфейс `ProactiveSender` содержит точечный метод `kickFromGroup(groupId, userId)`, реализующий Telegram-специфичный мягкий кик (ban + unban). Инициативные действия над чатами мессенджера должны быть абстрактными и расширяемыми.

---

## 2. Архитектурные решения

### 2.1. Имя интерфейса
- Сохраняем имя **`ProactiveSender`**. Имя устоялось в кодовой базе, тестах, контроллерах и дорожной карте (ФР-6).

### 2.2. Метод `notify`
- Метод **`proactiveSender.notify(telegramId, payload)` остаётся первоклассным методом**.
- Он **НЕ** заворачивается в DTO действий, так как:
  - это доставка контента человеку (UX, `MdText`, оформление реплик 🔔/ℹ️/⚠️);
  - это 95% всех вызовов;
  - это защищает систему от массового бесполезного регресса и диф-шума.

### 2.3. Исходящие команды управления мессенджером (Outbound Actions)
В `packages/core/src/ui/bot/types.ts`:
- Вводится Discriminated Union **`MessengerAction`**:
  ```ts
  export type MessengerAction =
    | { kind: 'kick_member'; chatId: string | number; userId: number }
    | { kind: 'restrict_member'; chatId: string | number; userId: number; untilDate?: Date }
    | { kind: 'pin_message'; chatId: string | number; messageId: number; silent?: boolean }
    | { kind: 'approve_join'; chatId: string | number; userId: number };
  ```
- В `ProactiveSender` добавляется единый метод выполнения инициативных команд:
  ```ts
  execute(action: MessengerAction): Promise<void>;
  ```
- Метод `kickFromGroup` помечается как `@deprecated` и перенаправляется на `this.execute({ kind: 'kick_member', chatId: groupId, userId })`.
- `BotController` и `BotUiStory` получают прозрачный доступ к `this.proactiveSender.execute(action)`.

### 2.4. Входящие события мессенджера (Inbound Events)
В `packages/core/src/ui/bot/types.ts`:
- Вводится DTO данных пользователя чата:
  ```ts
  export interface ChatMemberUser {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
  }
  ```
- Вводится Discriminated Union **`MessengerEvent`**:
  ```ts
  export type MessengerEvent =
    | {
        kind: 'member_joined';
        chatId: string;
        user: ChatMemberUser;
      }
    | {
        kind: 'member_left';
        chatId: string;
        user: ChatMemberUser;
        kicked?: boolean;
      }
    | {
        kind: 'bot_membership';
        chatId: string;
        status: 'added' | 'removed' | 'promoted' | 'demoted';
        byUser?: ChatMemberUser;
      };
  ```
- Вводится тип реакции контроллера на событие:
  ```ts
  export type MessengerEventReaction = 'pass' | 'stop';
  ```
- В `BotController` добавляется единый опциональный метод-хук:
  ```ts
  handleMessengerEvent?(event: MessengerEvent): Promise<MessengerEventReaction | void>;
  ```
- В `BotUiApp` добавляется цепочка диспетчеризации (Chain of Responsibility):
  ```ts
  async handleMessengerEvent(event: MessengerEvent): Promise<void> {
    for (const controller of this.controllers) {
      const reaction = await controller.handleMessengerEvent?.(event);
      if (reaction === 'stop') {
        break;
      }
    }
  }
  ```
  Если контроллер обработал событие и возвращает `'stop'`, опрос последующих контроллеров прекращается.

### 2.5. Транспорт (`BotTransport`)
- `BotTransport` подписывается на события GramMY `chat_member` и `my_chat_member`.
- Маппит их в нейтральный `MessengerEvent` (отсекая технический мусор Telegram) и передаёт в `uiApp.handleMessengerEvent(event)`.
- Реализует `execute(action: MessengerAction)`:
  - для `kick_member` выполняет `banChatMember` + `unbanChatMember`.

### 2.6. Разделение бизнес-логики по контроллерам

#### Безусловная гост-регистрация на уровне приложения (`U7BotUiApp`):
Точно так же, как на команду `/start`, регистрация гостя выполняется **централизованно в `U7BotUiApp`** до опроса цепочки контроллеров:
- При получении любого `MessengerEvent` с данными участника (`user` или `byUser`) `U7BotUiApp` сразу вызывает `ensureRegisteredGuest(userFacade, botAdminUser, user)`.
- Ни `AppController`, ни `StreamController` не занимаются регистрацией гостей — участник гарантированно существует в БД к моменту, когда событие доходит до контроллеров.

#### 1. `SchoolController` (контур школы и сообщества):
- Включает домен школы: у него уже есть зависимость от `school` (включая `school.communityGroup.id`) и стори `CommunityStory`.
- При `event.kind === 'bot_membership'` (статус `added`) в школьной группе: выдаёт `Role.SUBSCRIBER` добавившему админу и возвращает `'stop'`.
- При `event.kind === 'member_joined'` в школьной группе: выдаёт вошедшему `Role.SUBSCRIBER` и возвращает `'stop'`.
- При `event.kind === 'member_left'` в школьной группе: снимает `Role.SUBSCRIBER` и возвращает `'stop'`.
- Если чат не школьный — возвращает `'pass'`.

#### 2. `AppController` (системный контур приложения):
- Остаётся системным контроллером приложения: системные команды (`/log_level`), системное меню и системные коды `app:*`. Не перегружается школьной или учебной спецификой.

#### 2. `StreamController` (контур студенческих групп потоков):
- Занимается исключительно учебным контекстом потоков (участник уже зарегистрирован в системе):
- При `event.kind === 'member_joined'` в группу с `chatId === stream.telegramGroupId`:
  - Проверяет, числится ли вошедший участник активным студентом данного потока (`list-stream-students`, `outcomeCategory === IN_PROGRESS`).
  - **Если пользователь НЕ студент потока:** отправляет ментору потока предупреждение:
    `⚠️ В группу «${stream.title}» вступил неизвестный участник: ${userName}${username ? ' (@' + username + ')' : ''}. Он не числится студентом этого потока.`
  - Возвращает `'stop'`.
- При `event.kind === 'member_left'` в группе с `chatId === stream.telegramGroupId` (FR-7):
  - Проверяет, был ли вышедший активным студентом потока.
  - Если да: отправляет ментору потока уведомление:
    `🚪 Студент ${userName} покинул группу «${stream.title}».`
  - Возвращает `'stop'`.
- Сохраняется логика исключения из группы (`proactiveSender.execute({ kind: 'kick_member', ... })`) при отчислении или неактивности (`InactivityStory`).

#### 3. Ликвидация старого кода:
- Файл `apps/u7-bot/src/handlers/group-handler.ts` и `group-handler.test.ts` полностью удаляются.

### 2.7. Починка прав роли `SUBSCRIBER` (`TODO.md`)
- В `packages/user/src/domain/user/policy.ts`:
  - `UserPolicy.canAddRole`: разрешить актору с ролью `ADMIN` назначать `Role.SUBSCRIBER`.
  - `UserPolicy.canRemoveRole`: разрешить актору с ролью `ADMIN` снимать `Role.SUBSCRIBER`.

---

## 3. Критерии приёмки
1. `UserPolicy` покрыт юнит-тестами на добавление/снятие `SUBSCRIBER` администратором; пункт из `TODO.md` закрыт.
2. В `packages/core/src/ui/bot/` добавлены типы `MessengerEvent`, `MessengerAction`, метод `execute` в `ProactiveSender` и `handleMessengerEvent` в `BotController` / `BotUiApp`.
3. В `BotTransport` реализован приём событий Telegram с трансляцией в `MessengerEvent`, а также исполнение `MessengerAction.kick_member`.
4. `SchoolController` корректно управляет ролью `SUBSCRIBER` для группы школы сообщества.
5. `StreamController` корректно реализует требование FR-7 (уведомление ментора при выходе студента из группы потока).
6. Файл `group-handler.ts` удалён, прямой вызов `registerGroupHandlers` в `main.ts` убран.
7. E2E-тест `inactivity.e2e.test.ts` переведён на `uiApp.handleMessengerEvent` и проходит успешно.
8. Полная проверка `bun run check` (типы, линтер, все тесты проекта) зелёная.
