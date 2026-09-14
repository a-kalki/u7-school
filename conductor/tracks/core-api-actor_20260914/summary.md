# Итог трека core-api-actor_20260914

**Статус:** выполнен (кодовая часть). Ручные верификации фаз — за владельцем (`plan.md`, задачи «Ручная верификация»).

## Что сделано

Протаскивание `actorId: string` через API-цепочку заменено на готовый объект
актора `User`, резолвимый один раз на входе приложения. Дженерик актора —
параметр класса core/api (зеркально UI-слою `BotUiApp<TAppMeta, TActor, TResolve>`),
закрытый на `User` в модуле `app`.

### Архитектура (итоговая)

- **core/api**: `UseCase<TMeta, TResolve, TActor = unknown>` — `handle(command, actor?)`,
  `execute(command, actor)` с условным типом по `requiresAuth` (обязателен/опционален),
  `checkAuth(actor?)`; `ApiModule<TMeta, TResolve, TActor>`; `ApiApp<TMeta, TActor>`;
  `ApiExecutor<TMeta, TActor>`. `UcMeta` — чистые данные, без актора. ER/Job —
  системные, без актора (решение владельца).
- **app** (`@u7-scl/app/domain`): `U7UseCase`, `U7ApiModule` (базовые классы доменов),
  `U7ApiApp`, `U7ApiExecutor` (типы) — единственная точка закрытия дженерика на
  канонический `User`. Канонические `Role/RoleSchema/UserSchema/User/UserArMeta`
  живут в `packages/app/src/domain/user.ts` (с `nick`).
- **Домены** (user, wish, course, stream, questionnaire): базовые UC наследуют
  `U7UseCase`, модули — `U7ApiModule`; хелперы `getActor()`/`getUser(actorId)`-резолвы
  актора удалены; фасады принимают `actor?: User`.
- **Приложения**: u7-bot — `U7BotApp = U7ApiApp<U7BotAppMeta>`, системный актор бота —
  `botAdminUser: User` (резолв при старте, `createUiApp` стал async); стори передают
  `actor`-объект в `execute`. u7-cli — `currentActor: User` (полный объект через
  `get-user` при `/login`). scripts — `resolveActor(app, uuid)` в `_app-factory`.

### Существенные решения

- `registerGuest(telegramId, name, nick?, actor?)` — `nick` и `actor` поменялись
  местами (actor всегда последним).
- Удалены UC-тесты «отклоняет несуществующего пользователя» (course): проверяли
  `getActor`-резолв внутри UC; гарантия существования актора перенесена на вход
  приложения (UI `actorResolver`), повторный резолв в UC устранён как класс.
- `GetUserUc` читает репо напрямую (раньше `getActor` использовался как
  универсальный «получить или not-found»).
- Идентичность актора в stream-UC: `actor.uuid !== student.userId`.

## Коммиты по фазам

| Фаза | Коммит | Чекпоинт |
| --- | --- | --- |
| 1. Канонизация User в app | `95cfc192` | `b2d4a960` |
| 2. core/api — дженерик актора (v2: класс, не мета) | `989b6ab` | — |
| 3. Домен user | `5c4de46` | `6f69443b` |
| 4. Домены wish/course/stream/questionnaire | `ba7dce8` | `389b18bf` |
| 5. Приложения + scripts | `f891d7a` | `0f231e14` |
| 6. Чистка, доки, финализация | `fde497bd` | см. git log |

## Верификация

- Полный гейт репозитория: `CI=true bun run check` — **2092 теста / 0 fail**,
  biome (775 файлов) + `tsc --noEmit` чисты.
- По пакетам: core 345, app 37, user 135, wish 107, questionnaire 130, course 364,
  stream 264, u7-bot 655.
- Попутно: `biome format` для `conductor/code_styleguides/troubleshoots/registry.json`
  (чужой файл, чистое форматирование — требование гейта).

## Остатки / риски

- `actorId`-имена остались только как локальные переменные uuid-строк в тестах
  (`makeExpressedWish(actorId, ...)`) — это идентификаторы, не параметры актора.
- Ручные верификации фаз 1–6 — за владельцем (чекбоксы в `plan.md`).
