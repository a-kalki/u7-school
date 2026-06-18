# Todo задачи

**Архитектурные:**
1. ~~`ContentSnapshot` дублирован~~ ✅ Выполнено (трек `arch_fixes_20260618`, Фаза 1) — course единственный source of truth.
2. Нужен базовый класс `WizardStory` с унифицированным движком пошагового ввода: контекст, переходы, обработка ошибок валидации. Сейчас логика wizard дублируется в `CreateStreamStory`.
3. ~~В `CreateStreamStory.#handleConfirm` обработка ошибок — ad-hoc~~ ✅ Выполнено (трек `arch_fixes_20260618`, Фаза 2) — добавлен `U7BotUserStory.handleError(err)`.

**Логирование и обработка ошибок (основа для трека):**

Добавлен универсальный `handleError(err)` в `U7BotUserStory` (`packages/app/src/ui/u7-bot-user-story.ts`).
Метод использует `fromError()` из `@u7-scl/core/domain` и `serializeError()` из `@u7-scl/core/shared`.

Что нужно доделать:

### 1. Заменить `console.error` на нормальный логгер
Сейчас `handleError` для `internal` и `unauthorized` ошибок использует `console.error`.
Нужно:
- Добавить метод `logger` в `U7BotUserStory` (через `this.appApi.logger` или `getGlobalLogger()` из `@u7-scl/core/shared`)
- Логировать через `this.logger.error('bot', 'Ошибка в story', serializeError(err))`
- Логировать ТОЛЬКО ошибки с kind `internal` и `unauthorized`
- Ошибки `validation`, `not-found`, `conflict`, `access-denied`, `bad-request` — НЕ логировать (они часть нормального потока)

### 2. Просмотреть базовые классы в core
В `packages/core/src/` проверить:
- `BotUserStory` — есть ли ещё места с ad-hoc обработкой ошибок
- `ApiModule` (`packages/core/src/api/module/api-module.ts`) — логирует ли ошибки при dispatch команд
- `BaseUc` / `UseCase` — какие ошибки пробрасываются и как
- Добавить `logger` в `BotUserStory` на уровне `core`, чтобы все story имели доступ

### 3. Аудит всех story на обработку ошибок
Пройтись по всем `*.story.ts` в проекте и проверить:
- `packages/stream/src/ui/bot/stories/*.story.ts` — все ли используют `this.handleError(err)` вместо ad-hoc try/catch
- `packages/course/src/ui/bot/stories/*.story.ts` — то же
- `packages/user/src/ui/bot/stories/*.story.ts` — то же
- `packages/onboarding/src/ui/bot/stories/*.story.ts` — то же
- `packages/app/src/ui/stories/*.story.ts` — то же

Критерии для каждой story:
1. Вызовы `this.moduleApi.execute()` обёрнуты в try/catch
2. Catch вызывает `this.handleError(err)` (а не ad-hoc логику)
3. Нет подавленных ошибок (пустой catch без обработки)

### 4. Добавить тесты на handleError для каждой story
Для каждой story, где заменяется обработка ошибок — написать тест, проверяющий:
- Что validation error показывает поля
- Что internal error не раскрывает деталей пользователю

**Доменные:**
1. `studentId` в cb-data кнопки «Выполнено» избыточен — студент однозначно определяется через `actor.uuid`. Нужно убрать `studentId` из `complete:<studentId>:<streamId>:<stepId>`, оставив `complete:<streamId>:<stepId>`. Заодно в `#handleComplete` сначала получать студента по `actor.uuid`, сверять `streamId`, потом вызывать `complete-step`.
2. Кнопка «↩️ Назад» на уровнях глубже главного меню. Должна добавляться на уровне story (каждая story знает свой контекст и явно указывает кнопку возврата). Реализация на уровне роутера откачена — будет в отдельном треке.
