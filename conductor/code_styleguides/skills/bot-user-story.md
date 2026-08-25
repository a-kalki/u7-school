# BotUserStory — Styleguide

**Назначение:** пользовательский сценарий внутри контроллера бота. Инкапсулирует логику одного сценария (каталог, карточка потока, запись и т.д.). Файл: `apps/u7-bot/src/controllers/<module>/stories/<story-name>.story.ts`.

---

## 1. Базовые классы

| Класс | Пакет | Назначение |
|---|---|---|
| `BotUserStory<TAppMeta, TModuleMeta, TActor>` | `@u7-scl/core/ui` | Абстрактный сценарий |
| `U7BotUserStory<TModuleMeta>` | `@u7-scl/app/ui` | Специализация для U7-бота: `TAppMeta = U7BotAppMeta`, `TActor = User` |

Контроллер, в котором живёт стори — см. [bot-controller.md](./bot-controller.md).

---

## 2. Ключевые правила

1. **Парсинг callback — деструктуризацией** `split(':')`, не по индексу `parts[1]!`:
   ```typescript
   const [cmd, streamId] = action.split(':');
   const [, studentId, streamId, stepId] = action.split(':'); // пропустить префикс
   ```
2. **`this.moduleApi`** — команды своего модуля; **`this.appApi`** — команды других модулей (фасады).
3. **Запрещено `as unknown as`** для результатов `execute()` и **`as any`** в моках — строгая типизация. Если TS ругается — проблема в типах команд/меты.
4. **Не дублируй UC** в своём модуле для фасадов других модулей — вызывай через `this.appApi.execute(...)`.
5. **Актор всегда `User`** из `@u7-scl/app/domain` — не `unknown`, не локальные интерфейсы.
6. **Права — через Policy-объекты** (`UserPolicy.isStudent(...)`, `StreamPolicy.canEnroll(...)`), не ручные проверки `actor.roles.includes(...)`.
7. **Кросс-стори вызовы — через `this.cbFor(storyName, action, ...args)`**. Стори не импортируют другие стори напрямую. **Только в пределах одного контроллера** — `storyName` должен быть зарегистрирован в том же контроллере, что и текущая стори.
8. **Запрещены кросс-контроллерные переходы.** Нельзя использовать `cbFor` или `delegate` для перехода в стори другого контроллера. Причина: `BotController.#compressAction` добавляет префикс текущего контроллера, и целевой контроллер не сможет обработать колбэк. Для возврата в главное меню используй `app:main-menu`.

Живые примеры: `apps/u7-bot/src/controllers/streams/stories/stream-catalog.story.ts`, `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts`.

---

## 3. Обработка исключений

`try/catch` нужен **только** при специфичной реакции на ошибку: показать поля валидации, вернуть fallback, компенсирующее действие. Если стори просто вызывает `moduleApi.execute()` без реакции — `try/catch` НЕ нужен, ошибка пробросится в контроллер → `handleError` (см. [bot-controller.md](./bot-controller.md), §6).

Внутри catch можно вызвать `this.handleError(err)` для логирования + fallback. Логируются `internal`/`unauthorized`/`default`; `validation`/`not-found`/`conflict`/`access-denied`/`bad-request` — нормальный поток, не логируются.

---

## 4. Форматирование MarkdownV2

`BotUserStory` предоставляет protected-методы — **не дублируй** их в стори:

- `this.escapeMarkdown(text)` — экранирует спецсимволы MarkdownV2.
- `this.formatDate(iso)` — ISO → `дд.мм.гггг` (при ошибке — исходная строка).

Правила экранирования и валидации — см. [bot-test.md](../bot-test.md), §4.1. Пакет `markdown-to-telegram` установлен, пока не используется (для больших блоков текста).

**Дерево (`TreeNode[]` → `renderTree`):** контракт `TreeNode.title` — «уже экранированный
для MarkdownV2». Стори, формирующая `TreeNode[]`, **обязана** экранировать заголовки
через `escapeMarkdown` **до** передачи в `renderTree` (и проекты, и уроки).
Неэкранированные заголовки с `-`, `(`, `)`, `.` роняют отправку с `GrammyError 400`.
Образец: `course-catalog.story.ts` (`#handleProjects`), `view-stream.story.ts`
(`handleProgramView`).

---

## 5. Wizard Story (пошаговый ввод)

Конечный автомат на основе `captureInput`. Пример: `apps/u7-bot/src/controllers/streams/stories/create-stream.story.ts` (если существует, иначе см. `OnboardingController` для wizard-паттерна).

- Определи интерфейс контекста со всеми собираемыми полями (`step`, обязательные `''`, необязательные `undefined`).
- Каждый шаг возвращает `captureInput` с обновлённым контекстом (`step: N+1`).
- Поля со значениями по умолчанию: подсказка «По умолчанию: ...» + кнопки «Принять»/«Пропустить».
- **Выделяй переиспользуемые методы клавиатуры** в private-методы, если клавиатура показывается из нескольких мест.
- Финальный шаг (`#handleConfirm`) оборачивай в `try/catch`: при ошибке валидации покажи детали, освободи `captureInput` (`releaseInput: true`), предложи начать заново.

---

## 6. Тестирование

См. [bot-test.md](../bot-test.md) — уровни и правила. Специфика unit-тестов сторис:

- **Актор:** полный объект `User`, роли через enum `Role` из `@u7-scl/user/domain`.
- **Моки API:** `as unknown as <реальный тип>` (`StreamApiModule`, `U7BotApp`). Никаких `as any` и общих `test-helpers.ts` — каждый тест самодостаточен.
- **Локальный хелпер** внутри `describe` для одинаковых моков — допустим и поощряется.
- **Без вызовов API** (например, `handleStart`) — `init()` не нужен.
- **MarkdownV2:** `assertResponseMarkdownSafe(response)` после каждого `handle*`.

Живой пример теста: `apps/u7-bot/tests/streams/view-stream.integration.test.ts` (интеграционные), `apps/u7-bot/tests/e2e/` (E2E).

---

## 7. Структура файла

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

- [BotController](./bot-controller.md) — реестр сторис, сжатие id, handleError
- [Ошибки](./errors.md) — AppError, хелперы
- [Тестирование бота](../bot-test.md)
- [DDD API](../api.md) — UseCase, Module
