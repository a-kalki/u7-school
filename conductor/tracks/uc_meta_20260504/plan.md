## План реализации: Метаданные UseCase и output-валидация в `@u7/core`

### Фаза 1: Расширение доменных типов (ArMeta, UcMeta)

- [ ] Task: Написать падающие тесты для расширенных типов
  - [ ] Тест: ArMeta содержит поле `label`
  - [ ] Тест: UcMeta содержит поля `description`, `arMeta`, `requiresAuth`, `type`
- [ ] Task: Реализовать расширение ArMeta (`label`)
- [ ] Task: Реализовать расширение UcMeta (`description`, `arMeta`, `requiresAuth`, `type`)
- [ ] Task: Запустить тесты, убедиться что проходят (Green)
- [ ] Task: Рефакторинг (при необходимости)
- [ ] Task: Закоммить изменения
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Расширение доменных типов' (Protocol in workflow.md)

### Фаза 2: Output-валидация и рефакторинг handle()

- [ ] Task: Написать падающие тесты для output-валидации
  - [ ] Тест: UseCase валидирует output через outputSchema
  - [ ] Тест: При ошибке output-валидации выбрасывается internal error
  - [ ] Тест: validateInput() работает корректно (переименовано из validate)
  - [ ] Тест: handle() вызывает validateInput → execute → validateOutput
- [ ] Task: Реализовать outputSchema и validateOutput() на UseCase
- [ ] Task: Реализовать validateInput() (переименовать validate → validateInput)
- [ ] Task: Обновить handle() для вызова цепочки: validateInput → execute → validateOutput
- [ ] Task: Запустить тесты, убедиться что проходят (Green)
- [ ] Task: Рефакторинг (при необходимости)
- [ ] Task: Закоммить изменения
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Output-валидация и рефакторинг handle()' (Protocol in workflow.md)

### Фаза 3: Авторизация и метаданные UC

- [ ] Task: Написать падающие тесты для авторизации и метаданных
  - [ ] Тест: requiresAuth=true требует actorId, иначе UnauthorizedError
  - [ ] Тест: checkAuth() можно переопределить
  - [ ] Тест: actorId в execute типизирован условно
  - [ ] Тест: UseCase содержит description, aggregateName, aggregateLabel, type
  - [ ] Тест: UseCase.getCommand() возвращает полные метаданные
  - [ ] Тест: getInputSchema() удалён
- [ ] Task: Реализовать requiresAuth и checkAuth() на UseCase
- [ ] Task: Реализовать условную типизацию actorId в execute()
- [ ] Task: Реализовать description, aggregateName, aggregateLabel, type на UseCase
- [ ] Task: Реализовать getCommand() на UseCase, удалить getInputSchema()
- [ ] Task: Запустить тесты, убедиться что проходят (Green)
- [ ] Task: Рефакторинг (при необходимости)
- [ ] Task: Закоммить изменения
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Авторизация и метаданные UC' (Protocol in workflow.md)

### Фаза 4: Module, интеграция и экспорты

- [ ] Task: Написать падающие тесты для Module
  - [ ] Тест: Module.getCommands() агрегирует uc.getCommand() с полными метаданными
  - [ ] Тест: Интеграционный тест проходит с новыми метаданными
- [ ] Task: Обновить Module.getCommands() для агрегации uc.getCommand()
- [ ] Task: Обновить packages/core/src/index.ts (новые типы и экспорты)
- [ ] Task: Обновить интеграционный тест (packages/core/src/integration.test.ts)
- [ ] Task: Запустить тесты, убедиться что проходят (Green)
- [ ] Task: Проверить покрытие кода (>80%)
- [ ] Task: Рефакторинг (при необходимости)
- [ ] Task: Закоммить изменения
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Module, интеграция и экспорты' (Protocol in workflow.md)
