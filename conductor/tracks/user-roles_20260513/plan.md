[$T1=packages/user/src/, $T2=UserAr.register]
# План реализации: Расширение ролей пользователя

## Фаза 1: Модель и агрегат [checkpoint: 98478a4]
- [x] Task: Добавить GUEST, SUBSCRIBER, CANDIDATE в Role enum и RoleSchema
- [x] Task: Добавить метод $T2(cmd) для создания из telegramId + name с ролью GUEST
- [x] Task: Добавить метод UserAr.addRole(role) — идемпотентное добавление
- [x] Task: Обновить UserAr тесты
- [ ] Task: Conductor - User Manual Verification 'Модель и агрегат' (Protocol in workflow.md)

## Фаза 2: UseCases
- [~] Task: Создать RegisterUserUc (делегирует $T2)
- [ ] Task: Создать AddRoleToUserUc (делегирует UserAr.addRole)
- [ ] Task: Написать тесты для RegisterUserUc
- [ ] Task: Написать тесты для AddRoleToUserUc
- [ ] Task: Обновить UserModule (зарегистрировать новые UC)
- [ ] Task: Conductor - User Manual Verification 'UseCases' (Protocol in workflow.md)

## Фаза 3: Интеграция и финал
- [ ] Task: Обновить экспорты $T1index.ts
- [ ] Task: Обновить экспорты $T1domain/index.ts
- [ ] Task: Обновить экспорты $T1api/index.ts
- [ ] Task: Проверить покрытие >80%: `bun run test:p user --coverage`
- [ ] Task: Проверить lint и tsc: `bun run check:p user`
- [ ] Task: Conductor - User Manual Verification 'Интеграция и финал' (Protocol in workflow.md)
