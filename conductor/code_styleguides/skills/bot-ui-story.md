# BotUiStory — Styleguide

**Назначение:** пользовательский сценарий внутри контроллера бота. Инкапсулирует логику одного сценария (каталог, карточка потока, запись и т.д.). Файл: `apps/u7-bot/src/controllers/<module>/stories/<story-name>.story.ts`.

---

## 1. Базовые классы

| Класс | Пакет | Назначение |
|---|---|---|
| `UiStory` | `@u7-scl/core/ui` | Канально-независимая базовая стори; объявляет подписки на доменные события (`getEventSubscriptions()`) |
| `BotUiStory<TAppMeta, TActor>` | `@u7-scl/core/ui` | Абстрактный сценарий бота (extends `UiStory`) |
| `U7BotUiStory` | `@u7-scl/bot/u7-bot-ui-story` | Специализация для U7-бота: `TAppMeta = U7BotAppMeta`, `TActor = User`, добавляет `menuButtons` (кнопка меню), `contextHelp`, `/cancel` в pipe |

Контроллер, в котором живёт стори — см. [bot-controller.md](./bot-controller.md).

---

## 2. Ключевые правила

1. **Парсинг callback — деструктуризацией** `split(':')`, не по индексу `parts[1]!`:
   ```typescript
   const [cmd, streamId] = action.split(':');
   const [, studentId, streamId, stepId] = action.split(':'); // пропустить префикс
   ```
2. **`this.appApi`** — доменных модулей.
3. **Запрещено `as unknown as`** для результатов `execute()` и **`as any`** в моках — строгая типизация. Если TS ругается — проблема в типах команд/меты.
4. **Не дублируй UC** в своём модуле для фасадов других модулей — вызывай через `this.appApi.execute(...)`.
5. **Актор всегда `User`** из `@u7-scl/app/domain` — не `unknown`, не локальные интерфейсы.
6. **Права — через Policy-объекты** (`UserPolicy.isStudent(...)`, `StreamPolicy.canEnroll(...)`), не ручные проверки `actor.roles.includes(...)`.
7. **Кросс-стори вызовы — через `this.cbFor(storyName, action, ...args)`**. Стори не импортируют другие стори напрямую. **Только в пределах одного контроллера** — `storyName` должен быть зарегистрирован в том же контроллере, что и текущая стори.
8. **Кросс-контроллерные переходы — через реестр `Routes` и готовые кнопки `buttons`.** `cbFor` работает только для стори того же контроллера. Чужие адреса бери из `Routes` (`apps/u7-bot/src/controllers/shared/routes.ts`), готовые кнопки — из `buttons` (`apps/u7-bot/src/controllers/shared/buttons.ts`): `buttons.mainMenu(text?)` возвращает `{ text, code }` (текст по умолчанию «↩️ Главное меню», можно переопределить), `Routes.app.mainMenu` — только адрес. `delegate.path` — всегда полный маршрут: относительный путь (`this.cb`/`this.cbFor`) префиксуется контроллером.

Живой образец стори на контракте «Диалог и Экран»: `apps/u7-bot/src/controllers/app/stories/community.story.ts`; базовый класс с докой — `packages/core/src/ui/bot/bot-ui-story.ts`.

---

## 3. Обработка исключений

`try/catch` нужен **только** при специфичной реакции на ошибку: показать поля валидации, вернуть fallback, компенсирующее действие. Если стори просто вызывает `appApi.execute()` без реакции — `try/catch` НЕ нужен, ошибка пробросится в контроллер → `handleError` (см. [bot-controller.md](./bot-controller.md), §6).

Внутри catch можно вызвать `this.handleError(err)` — он возвращает `DialogResponse`-экран. Логируются `internal`/`unauthorized`/`default`; `validation`/`not-found`/`conflict`/`access-denied`/`bad-request` — нормальный поток, не логируются.

---

## 4. Тексты: `MdText` через `md`/`mdRaw`

Ответ стори — `DialogResponse` (`packages/core/src/ui/bot/types.ts`): шесть декларативных полей — `screen`/`finalize`/`notify` (влияние на чат), `awaitInput`/`release` (ввод), `delegate` (маршрут). Механика рендера принадлежит транспорту. Строится хелперами (§5), не литералами.

Все тексты (`screen.text`, `notify.text`, `finalize.text`) — тип `MdText`:

- **`md\`…${data}…\``** — интерполяция доменных данных экранируется автоматически. Точка в литеральной части пишется `\\.` (`\.` — невалидный JS-escape, backslash отбрасывается).
- **`mdRaw\`…\``** — только для полностью статичных литералов (весь текст пишется в MarkdownV2-нотации вручную).
- **Композиция** готовых `MdText` — только через `mdConcat`/`mdJoin` из `@u7-scl/core/shared`: вложенная интерполяция `${fragment}` в `md`-шаблон экранирует уже-безопасный текст повторно.
- `confirm(text: MdText)` — confirm-хелпер принимает уже готовый текст.

Fail-fast: `assertDialogResponseMarkdownSafe(response)` (тесты, транспорт) роняет невалидный MarkdownV2. Живой образец: `packages/core/src/shared/markdown.ts` (+ тесты там же).

**Дерево (`TreeNode[]` → `renderTree`, `apps/u7-bot/src/shared/tree-renderer.ts`):** `TreeNode.title` — строка, уже безопасная для MarkdownV2: формируй заголовки через `md\`…\``.

---

## 5. Хелперы ответов: `screen`/`ask`/`notify`/`warn`/`note`/`go`/`kb`/`btn`

Ответ стори — доменный язык («показать экран», «спросить», «предупредить», «уйти»), а не транспортные поля `DialogResponse`. Чистые билдеры живут в `packages/core/src/ui/bot/response-builders.ts` (экспорт `@u7-scl/core/ui`), на `BotUiStory` — тонкие `protected`-делегаты `this.screen(...)` и т.д. Возвращают те же структуры — контракт и транспорт не меняются.

| Хелпер | Возвращает | Назначение |
|---|---|---|
| `screen(text, keyboard?)` | `{ screen }` | Экран: текст + опц. клавиатура |
| `ask(text, context, keyboard?)` | `{ screen, awaitInput }` | Спросить: экран + ожидание текстового ввода с контекстом |
| `notify(text)` | `{ notify }` | Уведомление поверх диалога, дефолтный тон транспорта 🔔 (без `kind`) |
| `warn(text)` | `{ notify, kind: 'warn' }` | Предупреждение поверх диалога — экран и ввод не трогает |
| `note(text)` | `{ notify, kind: 'info' }` | Инфо-заметка поверх диалога |
| `go(path)` | `{ delegate }` | Уйти: делегировать диалог по полному маршруту |
| `kb(rows, opts?)` | `KeyboardDescription` | Клавиатура: `isMultiple: false` по умолчанию, `{ multiple: true }` — многострочный выбор |
| `btn(text, code)` | `KbButton` | Callback-кнопка: нажатие шлёт `code` |
| `btnUrl(text, url)` | `KbButton` | Кнопка-ссылка (callback-код пуст) |

**Когда хелпер, когда спред, когда литерал:**

- **Стандартная реплика — всегда хелпер.** Ручные литералы `{ screen: { text, keyboard } }` и `keyboard: { rows, isMultiple }` в сторях запрещены (в т.ч. локальные kb-хелперы в стори — клавиатуру собирай через `this.kb`/`this.btn`).
- **Комбинации-редкости — спредом поверх хелпера:** `{ ...this.notify(текст), release: true }`, `{ release: true, ...this.screen(...) }`, `{ ...this.ask(...), release: true }`.
- **Литерал `KeyboardDescription`** — только если клавиатура строится по частям доменной логикой с нетривиальным `isMultiple`-режимом (с комментарием почему не `kb(...)`).
- Билдеры чистые (аргументы → структура, без сессии/транспорта) — можно использовать вне наследников `BotUiStory` (контроллеры, ui-app) прямым импортом из `@u7-scl/core/ui`.

**Живые образцы** (мигрированные стори):

Каталог с клавиатурой — `apps/u7-bot/src/controllers/courses/stories/course-catalog.story.ts`:
```typescript
if (courses.length === 0) {
  return this.screen(
    md`📖 *Курсы*\n\nПока нет доступных курсов\.`,
    this.kb([[buttons.mainMenu()]]),
  );
// ...
rows.push([
  this.btn(`${direction} ${course.title}`, this.cb('phases', course.uuid)),
]);
return this.screen(mdJoin(lines), this.kb(rows));
```

Wizard-шаг (`ask` + обновлённый контекст) — `apps/u7-bot/src/controllers/mentor/stories/create-stream.ts`:
```typescript
return this.ask(md`📦 *Выберите модуль курса\:*`, ctx, this.kb(rows));
```

Комбинация со снятием ввода (спред) — `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts`:
```typescript
return {
  ...this.notify(md`Извините, на данном этапе сообщения не принимаются\.`),
  release: true,
};
```

---

## 6. Ввод пользователя: `awaitInput`/`release`

У `DialogResponse` два поля ввода: `awaitInput: { context?: unknown }` — диалог ждёт текст (path уже известен — это `dialog.path`), `release: true` — снять ожидание. `handleMessage(update, actor, session)` вызывается только при активном вводе; может вернуть `null` — «стори отказалась», тогда сообщение игнорируется.

Wizard (пошаговый ввод) — конечный автомат на `awaitInput`:

- Контекст со всеми собираемыми полями (`step`, обязательные `''`, необязательные `undefined`) живёт в `awaitInput.context`.
- Каждый шаг возвращает `awaitInput` с обновлённым контекстом (`step: N+1`).
- Поля со значениями по умолчанию: подсказка «По умолчанию: ...» + кнопки «Принять»/«Пропустить».
- **Выделяй переиспользуемые методы клавиатуры** в private-методы, если клавиатура показывается из нескольких мест.
- Финальный шаг (`#handleConfirm`) оборачивай в `try/catch`: при ошибке валидации покажи детали, верни `release: true`, предложи начать заново.

Также у стори:
- `handleCommand(update, actor, session): Promise<CommandReaction>` — команды в pipe (ФР-4). Дефолт `U7BotUiStory`: `/cancel` при активном диалоге стори — сброс себя + `stop{notify}`; `/start` — исключение-сторож (обрабатывает uiApp); прочее — `pass`. Доменные команды (например, `/log_level`) — override.
- `contextHelp(actor, session): Promise<MdText | null>` — контекстная справка активной стори для `/help`; `null` — общий справочник. Публичный мост uiApp → стори: спрашивается только активная стори.
- `menuButtons(actor): Promise<MenuButton[]>` — кнопка стори в главном меню (декларативные данные: `text`, `action`, `priority`, `description`; видимость может быть асинхронной — например, фасад); экран собирает uiApp, упавшая проверка скрывает кнопку + warn-лог.

---

## 7. Тестирование

См. [bot-test.md](../bot-test.md) — уровни и правила. Специфика unit-тестов сторис:

- **Актор:** полный объект `User`, роли через enum `Role` из `@u7-scl/user/domain`.
- **Моки API:** `as unknown as <реальный тип>` (`StreamApiModule`, `U7BotApp`). Никаких `as any` и общих `test-helpers.ts` — каждый тест самодостаточен.
- **Локальный хелпер** внутри `describe` для одинаковых моков — допустим и поощряется.
- **Без вызовов API** (например, `menuButtons`) — `init()` не нужен.
- **MarkdownV2:** `assertDialogResponseMarkdownSafe(response)` после каждого `handle*`.

Живые образцы тестов на новом контракте: `apps/u7-bot/src/controllers/app/stories/community.story.test.ts`, `apps/u7-bot/src/controllers/app/app-controller.test.ts`; базовые сценарии (awaitInput/release, delegate, /help, /cancel) — `packages/core/src/ui/bot/ui-app.test.ts`.

---

## 8. Структура файла

```
apps/u7-bot/src/controllers/<module>/stories/
  <story-name>.story.ts        — реализация
apps/u7-bot/tests/<module>/
  <story-name>.integration.test.ts — интеграционные тесты
apps/u7-bot/tests/e2e/
  <scenario>.e2e.test.ts       — E2E тесты
```

---

## Связанные styleguide-файлы

- [BotController](./bot-controller.md) — реестр сторис, префиксация кнопок, handleError
- [Ошибки](./errors.md) — AppError, хелперы
- [Тестирование бота](../bot-test.md)
- [Архитектура bot-level](../bot-architecture.md)
- [DDD API](./api.md) — UseCase, Module
