# Спецификация: MarkdownV2 — единая точка проверки (fail-fast) и исправление экранирования

> Трек `markdownv2_guard_20260825`. Тип: bug (исправление + тесты + документация).
> Создан 2026-08-25 по итогам анализа продакшен-логов после релиза 23.08.

---

## 1. Обзор

После релиза 23.08 (большой рефакторинг Bot UI, перенос в `apps/u7-bot`) экран
«Программа курса» (S03, `ViewStreamStory`) падает с `GrammyError 400:
can't parse entities: Character '-' is reserved...`. Анализ логов выявил три
проблемы, которые трек устраняет:

1. **Баг экранирования:** `handleProgramView` не экранирует заголовки проектов/уроков
   перед `renderTree` — нарушение контракта `TreeNode.title` («уже экранированный»).
2. **Бесполезная прод-проверка:** `validateResponseInPlace` в `executeResponses` только
   пишет `console.warn` и всё равно отправляет битый текст в Telegram. Не защищает
   и не сигналит громко.
3. **Слепая зона тестов и документации:** тесты используют санитарные значения без
   спецсимволов; документация не фиксирует требования экранирования для дерева.

---

## 2. Контекст из продакшен-логов

Файл: `logs/u7-school-bot-error.log` (pm2, сервис `u7-school-bot`, перезапущен
23.08 06:56 UTC — момент релиза). Лог НЕ ротируется — записи с 25.06.

**Активные ошибки после релиза (8 случаев, 23.08–25.08, повторяются ежедневно):**

```
[ERROR] [bot] Непредвиденная ошибка в обработчике
{"message":"Call to 'sendMessage' failed! (400: Bad Request: can't parse entities:
Character '-' is reserved and must be escaped with the preceding '\\')",
 "stack":"... at executeResponses (apps/u7-bot/src/core/ui-utils.ts:169)
          at connect-ui-app.ts:150"}
```

Перед каждым падением в логе есть warn-блок (от `validateResponseInPlace`):
```
[MarkdownV2] 9 issue(s): неэкранированный '-', '(', ')', ...
[MarkdownV2] text: 📖 *Программа курса* ...
```

**Старые ошибки (до релиза, НЕ входят в область трека):** 2× MarkdownV2 italic (25.06,
старая структура), 1× UUID validation (26.06), 2× onboarding CANDIDATE (29.06),
1× RangeError formatProgressBar (15.07, старый путь `packages/stream/...`).

**u7-hub** (`/srv/u7-hub`, отдельный проект) — ошибка `ENOENT program.md` в AI-сервисе.
Вне области трека.

---

## 3. Root cause (подробный анализ)

### 3.1. Баг экранирования

`apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts`, метод
`handleProgramView` (~строки 257–266):

```ts
const treeText = renderTree(projectNodes);   // заголовки БЕЗ экранирования
const text = `📖 *Программа курса*\n\n${treeText}`;
return { sendMessage: { text: this.#truncate(text), parseMode: 'MarkdownV2', ... } };
```

- Контракт `TreeNode.title` (`apps/u7-bot/src/shared/tree-renderer.ts`):
  «Заголовок узла (уже экранированный для MarkdownV2)».
- `course-catalog.story.ts` (строки 338/342) соблюдает контракт: `title: this.#esc(...)`.
- Весь остальной `view-stream.story.ts` экранирует через `esc`/`escapeMarkdown`
  (строки 187, 295, 495, 531, 636, 843–848) — пропущен ТОЛЬКО `handleProgramView`.
- Реальные названия из `contentSnapshot` содержат `-`, `(`, `)`, `.` (например,
  «Обработка ошибок: throw и try-catch», «Математические операторы (+, -, *, /)»).

### 3.2. Бесполезная прод-проверка

`apps/u7-bot/src/core/ui-utils.ts`:

```ts
export async function executeResponses(ctx: BotContext, res: BotResponse) {
  // Dev-assert: ... В продакшене пишет предупреждение в консоль
  validateResponseInPlace(res);   // ← строка 18
  ...
}

function validateResponseInPlace(res: BotResponse): void {
  // перебор sendMessage / sendMessages / editMessage
  // при невалидном MarkdownV2 → console.warn + ПРОДОЛЖАЕТ отправку
}
```

Дублирует перебор из `assertResponseMarkdownSafe` (`packages/core/src/ui/bot/response-assert.ts`),
но с поведением «warn вместо throw». Итог: битый текст уходит в Telegram → 400 → падение.

### 3.3. Слепая зона тестов

`apps/u7-bot/src/controllers/streams/stories/view-stream.story.test.ts`, тест S03
(строки 287–334): `assertResponseMarkdownSafe` вызывается (строка 330), НО данные
санитарные — `'Основы'`, `'Введение'`, `'Переменные'`, `'Продвинутый'`,
`'Асинхронность'`. Без спецсимволов валидация всегда зелёная, регрессия не ловится.

---

## 4. Функциональные требования

### FR-1. Исправить экранирование в `handleProgramView`

- `projectTitle` и `lessonTitle` экранируются через `escapeMarkdown` до передачи
  в `renderTree` (образец: `course-catalog.story.ts`, `this.#esc` / `this.escapeMarkdown`).
- `TreeNode.title` заполняется уже экранированным значением — контракт соблюдается.

### FR-2. Единая точка проверки MarkdownV2 — fail-fast перед отправкой

- `executeResponses` в `ui-utils.ts` вызывает `assertResponseMarkdownSafe`
  из `@u7-scl/core/ui` (единственная функция проверки BotResponse).
- При невалидном MarkdownV2 — **бросать** исключение `MarkdownV2ValidationError`
  (громко). Битый текст НЕ отправляется.
- `validateResponseInPlace` (warn-версия) — **удаляется полностью**.
- Диагностика: `MarkdownV2ValidationError` в `message` несёт список issues
  + фрагмент текста → глобальный обработчик `main.ts` (строки 83–93) логирует
  через `serializeError` и отвечает пользователю текстом
  «Произошла внутренняя ошибка. Попробуйте позже.» (текст менять не нужно).
- Класс ошибки — в `packages/core/src/shared/markdown-validator.ts`;
  `assertMarkdownV2Safe` переводится на него (единый тип для тестов и прода).

### FR-3. Тесты с реальными спецсимволами

- `view-stream.story.test.ts` S03: данные содержат `-`, `(`, `)`, `.` (реальные
  названия уроков, см. §3.1); `assertResponseMarkdownSafe` обязан проходить.
- `ui-utils.test.ts`: новые тесты —
  - валидный MarkdownV2 → `executeResponses` не бросает;
  - невалидный → бросает `MarkdownV2ValidationError`;
  - проверка распространяется на sendMessage / sendMessages / editMessage.

### FR-4. Документация (явные правила, чтобы исключить повтор)

- `conductor/code_styleguides/bot-test.md` §4/§4.1:
  - прод-поведение: fail-fast через `assertResponseMarkdownSafe` в `executeResponses`;
  - правило: «тестовые данные для MarkdownV2-проверок обязаны содержать спецсимволы
    (`-`, `(`, `)`, `.`, `!`, `+`) — санитарные значения не ловят регрессии»;
  - обновить список функций (warn-версии больше нет).
- `conductor/code_styleguides/skills/bot-user-story.md` §4: явное правило — стори,
  формирующая `TreeNode[]`, обязана экранировать заголовки через `escapeMarkdown`
  до передачи в `renderTree`.
- `apps/u7-bot/src/controllers/streams/ui-spec.md` S03: зафиксировать требование
  экранирования заголовков.
- JSDoc в `markdown-validator.ts`: уточнить роли функций
  (`escapeMarkdown` — producer, `validateMarkdownV2` — диагностика,
  `assertMarkdownV2Safe` / `assertResponseMarkdownSafe` — fail-fast в тестах и проде).

---

## 5. Нефункциональные требования

- Без изменений API, домена, БД. Только UI-слой бота (`apps/u7-bot`) и core
  (`packages/core/src/shared`, `packages/core/src/ui`).
- `bun run check` (biome + tsc + тесты) — чисто; покрытие >80%.
- Ошибка логируется с полным текстом и списком issues (для диагностики).
- Протокол TDD (workflow.md): Red → Green → рефакторинг → покрытие → коммит
  с git note → обновление plan.md.

---

## 6. Критерии приёмки

1. Программа курса с реальными названиями (дефисы, скобки, точки) отправляется
   без ошибок.
2. Любой невалидный MarkdownV2 из любой стори → ERROR-лог (issues + текст)
   + текст об ошибке пользователю; битый текст не отправляется.
3. Тест S03 со спецсимволами зелёный; тесты fail-fast в `ui-utils.test.ts` зелёные.
4. `validateResponseInPlace` удалён; в проде используется `assertResponseMarkdownSafe`.
5. Документация обновлена: `bot-test.md`, `bot-user-story.md`, `streams/ui-spec.md`,
   JSDoc `markdown-validator.ts`.

---

## 7. За рамками

- Авто-экранирование / fallback на этапе отправки (fail-safe) — сознательно НЕ делаем.
- Ревизия всех остальных стори на предмет экранирования — точечно, только если
  fail-fast выявит новые случаи (отдельная задача/трек).
- u7-hub (отдельный проект) — не трогаем.
- Старые ошибки из лога (onboarding CANDIDATE, formatProgressBar и др.) — не трогаем.

---

## 8. Справочник

- Рабочий процесс: `conductor/workflow.md` (TDD, фазы, контрольные точки, `bun run check`)
- Тестирование бота: `conductor/code_styleguides/bot-test.md` (§4/§4.1)
- Story-стиль: `conductor/code_styleguides/skills/bot-user-story.md` (§4, §6)
- Архитектура Bot UI: `conductor/bot-ui-refactoring.md` (tree-renderer, контроллеры)
- Границы: `conductor/code_styleguides/domain-boundaries.md`; skill `arch-boundary-design`
- Валидатор: `packages/core/src/shared/markdown-validator.ts`, `markdown.ts`
- Ассерты ответов: `packages/core/src/ui/bot/response-assert.ts`
- Исполнитель ответов: `apps/u7-bot/src/core/ui-utils.ts`
- Стори: `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts`
- Тесты: `apps/u7-bot/src/controllers/streams/stories/view-stream.story.test.ts`,
  `apps/u7-bot/src/core/ui-utils.test.ts`
