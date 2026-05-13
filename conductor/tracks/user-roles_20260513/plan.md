# План реализации: Расширение ролей пользователя

## Фаза 1: Модель и агрегат
- [ ] Task: Добавить GUEST, SUBSCRIBER, CANDIDATE в Role enum и RoleSchema
- [ ] Task: Добавить метод UserAr.register(cmd) для создания из telegramId + name с ролью GUEST
- [ ] Task: Добавить метод UserAr.addRole(role) — идемпотентное добавление
- [ ] Task: Обновить UserAr тесты
- [ ] Task: Conductor - User Manual Verification 'Модель и агрегат' (Protocol in workflow.md)

## Фаза 2: UseCases
- [ ] Task: Создать RegisterUserUc (делегирует UserAr.register)
- [ ] Task: Создать AddRoleToUserUc (делегирует UserAr.addRole)
- [ ] Task: Написать тесты для RegisterUserUc
- [ ] Task: Написать тесты для AddRoleToUserUc
- [ ] Task: Обновить UserModule (зарегистрировать новые UC)
- [ ] Task: Conductor - User Manual Verification 'UseCases' (Protocol in workflow.md)

## Фаза 3: Интеграция и финал
- [ ] Task: Обновить экспорты packages/user/src/index.ts
- [ ] Task: Обновить экспорты packages/user/src/domain/index.ts
- [ ] Task: Обновить экспорты packages/user/src/api/index.ts
- [ ] Task: Проверить покрытие >80%: `bun run test:p user --coverage`
- [ ] Task: Проверить lint и tsc: `bun run check:p user`
- [ ] Task: Conductor - User Manual Verification 'Интеграция и финал' (Protocol in workflow.md)
