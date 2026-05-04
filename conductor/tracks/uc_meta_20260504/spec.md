## Спецификация: Метаданные UseCase и output-валидация в `@u7/core`

### Обзор
Расширить абстрактный класс `UseCase`, `UcMeta` и `ArMeta` в `@u7/core` системой строгих контрактов и метаданных, обеспечивающей:
1. **Runtime-валидацию выхода** через `outputSchema` (ошибка → `internal`).
2. **Автоматическую проверку авторизации** через `requiresAuth` в метаданных.
3. **User-friendly описания** для UC и агрегатов (документация, UI-меню).
4. **Типобезопасную привязку к агрегату** (`arMeta`) и группировку UC.
5. **Классификацию UC** как `command` или `query` для документации.
6. **Единый метод экспорта метаданных** (`getCommand()`) с UseCase и агрегация в Module.

### Функциональные требования

#### 1. Расширение `ArMeta` (user-friendly имя агрегата)
```ts
interface ArMeta {
  name: string;      // техническое имя (snake_case/kebab-case)
  label: string;     // ← user-friendly название ("Пользователь", "Курс")
  errors: DomainError;
}
```

#### 2. Расширение `UcMeta`
```ts
interface UcMeta {
  commandName: string;
  description: string;      // ← user-friendly описание ("Добавить нового пользователя")
  arMeta: ArMeta;
  input: unknown;
  output: unknown;
  errors: AppError;
  requiresAuth: boolean;
  type: 'command' | 'query';
}
```

#### 3. Output Validation Schema
- `abstract protected readonly outputSchema: v.BaseSchema<unknown, TMeta["output"], v.BaseIssue<unknown>>`.
- В `handle()` после `execute()` результат проходит через `protected validateOutput(result): TMeta["output"]`.
- При `ValiError` выбрасывается `internal` error через `throwInternal`.
- Публичных `getInputSchema()` / `getOutputSchema()` **нет** на UseCase.

#### 4. `requiresAuth` и типизация `actorId`
- `abstract readonly requiresAuth: TMeta['requiresAuth']` на UseCase.
- `handle(command: unknown, actorId?: string)` — `actorId` всегда опционален на уровне handle (ещё неизвестен).
- `execute(command, actorId)` — типизируется условно:
  - Если `requiresAuth === true` → `actorId: string`.
  - Если `requiresAuth === false` → `actorId?: string`.
- Автоматическая проверка в `handle()` через `protected checkAuth(actorId?)`:
  - Если `requiresAuth === true` и `actorId` отсутствует — выбрасывается `UnauthorizedError`.
  - Метод `checkAuth()` можно переопределить.

#### 5. User-friendly поля
- `abstract readonly description: TMeta['description']` — описание UC.
- `abstract readonly aggregateName: TMeta['arMeta']['name']` — техническое имя агрегата.
- `abstract readonly aggregateLabel: TMeta['arMeta']['label']` — user-friendly имя агрегата.

#### 6. Тип UC (`command` | `query`)
- `abstract readonly type: TMeta['type']` на UseCase.
- Пока используется только как мета-информация для документации и OpenAPI.
- Runtime-различий между `command` и `query` **не вводится**.

#### 7. Разделение логики `handle()` на переопределяемые методы
`handle()` вызывает цепочку защищённых методов:
```ts
async handle(command: unknown, actorId?: string): Promise<TMeta["output"]> {
  this.checkAuth(actorId);
  const validatedCommand = this.validateInput(command);
  const result = await this.execute(validatedCommand, actorId as any);
  return this.validateOutput(result);
}
```
- `protected validateInput(command)` — валидация входа (переименовано из `validate`).
- `protected checkAuth(actorId?)` — проверка авторизации.
- `protected validateOutput(result)` — валидация выхода.
- Каждый метод можно переопределить.

#### 8. `getCommand()` — экспорт метаданных с UseCase
- Публичный метод `getCommand()` на UseCase, возвращающий объект:
  ```ts
  {
    commandName: string;
    description: string;
    aggregateName: string;
    aggregateLabel: string;
    type: 'command' | 'query';
    requiresAuth: boolean;
    inputSchema: v.BaseSchema<...>;
    outputSchema: v.BaseSchema<...>;
  }
  ```
- **Удалить** `getInputSchema()` из UseCase.

#### 9. `Module.getCommands()`
- Оставить `getCommands()` в Module.
- `getCommands()` вызывает `uc.getCommand()` для каждого UC и возвращает массив.
- Расширить возвращаемый объект всеми новыми полями.

#### 10. Экспорты
- Обновить `packages/core/src/index.ts`: добавить новые типы (`UcMeta`, `ArMeta`, и т.д.).

### Нефункциональные требования
- Типобезопасность: все свойства типизированы через `TMeta`.
- Покрытие тестами >80%.
- Следование стилю проекта (kebab-case, TDD, etc.).

### Критерии приёмки
- [ ] `ArMeta` содержит `label`.
- [ ] `UcMeta` содержит `description`, `arMeta`, `requiresAuth`, `type`.
- [ ] `UseCase` валидирует output в `handle()`; при ошибке — `internal` error.
- [ ] `UseCase` автоматически проверяет `actorId` через `checkAuth()`, если `requiresAuth === true`.
- [ ] `actorId` в `execute` типизирован условно (`string` vs `string | undefined`).
- [ ] `checkAuth()`, `validateInput()`, `validateOutput()` — protected и переопределяемы.
- [ ] `UseCase` имеет `description`, `aggregateName`, `aggregateLabel`.
- [ ] `UseCase` имеет `type: 'command' | 'query'`.
- [ ] `UseCase.getCommand()` возвращает полные метаданные (включая схемы).
- [ ] `Module.getCommands()` агрегирует `uc.getCommand()`.
- [ ] Нет `getInputSchema()` / `getOutputSchema()` на UseCase.
- [ ] Все тесты проходят, покрытие >80%.
- [ ] `index.ts` экспортирует новые типы.

### За рамками
- Фактическая генерация OpenAPI/Swagger (отдельный трек).
- Runtime-различия между `command` и `query`.
- Сложная ролевая модель (RBAC) — только проверка наличия `actorId`.
