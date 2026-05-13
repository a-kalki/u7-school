[$T1=packages/user/src/, $T2=UserAr.register]
# План реализации: Расширение ролей пользователя

## Фаза 1: Модель и агрегат [checkpoint: 98478a4]
- [x] Task: Добавить GUEST, SUBSCRIBER, CANDIDATE в Role enum и RoleSchema
- [x] Task: Добавить метод $T2(cmd) для создания из telegramId + name с ролью GUEST
- [x] Task: Добавить метод UserAr.addRole(role) — идемпотентное добавление
- [x] Task: Обновить UserAr тесты
- [x] Task: Conductor - User Manual Verification 'Модель и агрегат' (Protocol in workflow.md)

## Фаза 2: UseCases [checkpoint: c61e983]
- [x] Task: Создать RegisterUserUc (делегирует $T2)
- [x] Task: Создать AddRoleToUserUc (делегирует UserAr.addRole)
- [x] Task: Написать тесты для RegisterUserUc
- [x] Task: Написать тесты для AddRoleToUserUc
- [x] Task: Обновить UserModule (зарегистрировать новые UC)
- [ ] Task: Conductor - User Manual Verification 'UseCases' (Protocol in workflow.md)

## Фаза 3: Интеграция и финал
- [x] Task: Обновить экспорты $T1index.ts
- [x] Task: Обновить экспорты $T1domain/index.ts
- [x] Task: Обновить экспорты $T1api/index.ts
- [~] Task: Проверить покрытие >80%: `bun run test:p user --coverage`
- [ ] Task: Проверить lint и tsc: `bun run check:p user`
- [ ] Task: Conductor - User Manual Verification 'Интеграция и финал' (Protocol in workflow.md)
