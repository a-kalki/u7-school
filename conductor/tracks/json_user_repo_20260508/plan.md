# План реализации: Постоянное JSON-хранилище пользователей

## Фаза 1: Общий JSON-адаптер в core [checkpoint: e2eb74c]

- [x] Task: Написать тесты для `JsonFileRepo<T>` (TDD Red) [`4894252`]
    - [x] Создать `packages/core/src/infra/json-file-repo.test.ts`
    - [x] Тест: запись и чтение массива объектов
    - [x] Тест: валидация объектов через Valibot-схему (невалидные пропускаются)
    - [x] Тест: пустой/отсутствующий файл → возврат пустого массива
    - [x] Тест: сохранение перезаписывает файл полностью
- [x] Task: Реализовать `JsonFileRepo<T>` (TDD Green + Refactor) [`4894252`]
    - [x] Создать `packages/core/src/infra/json-file-repo.ts`
    - [x] Параметры: путь к файлу, Valibot-схема для валидации
    - [x] Методы: `readAll()`, `writeAll(items)`
    - [x] При чтении: парсинг JSON → фильтрация через схему → лог предупреждений для невалидных записей
- [x] Task: Conductor - User Manual Verification 'Фаза 1: Общий JSON-адаптер в core' (Protocol in workflow.md) [`e2eb74c`]

## Фаза 2: Реализация UserJsonRepo в user

- [x] Task: Написать тесты для `UserJsonRepo` (TDD Red) [`c22bbe6`]
    - [x] Создать `packages/user/src/infra/db/user-json-repo.test.ts`
    - [x] Тест: `save` → `getByUuid` возвращает сохранённого пользователя
    - [x] Тест: `save` дважды (update) — перезаписывает существующего
    - [x] Тест: `getByTelegramId` находит по telegramId
    - [x] Тест: `getAll()` возвращает всех пользователей
    - [x] Тест: `getAll()` с фильтром по `role`, `name`, `telegramId`
    - [x] Тест: `isTelegramIdTaken` — true/false
    - [x] Тест: `isEmpty` — true для нового хранилища, false после save
    - [x] Тест: невалидные данные в файле пропускаются с логом
- [x] Task: Реализовать `UserJsonRepo` (TDD Green + Refactor) [`c22bbe6`]
    - [x] Создать `packages/user/src/infra/db/user-json-repo.ts`
    - [x] Наследует/использует `JsonFileRepo<User>` из core
    - [x] Реализует интерфейс `UserRepo`
    - [x] Фильтрация `getAll`: по `role`, `name` (частичное совпадение), `telegramId`, `sort`
    - [x] Путь по умолчанию: `data/users/users.json` (от корня проекта)
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Реализация UserJsonRepo' (Protocol in workflow.md)

## Фаза 3: Seed-данные и финальная интеграция

- [ ] Task: Создать seed.json и механизм инициализации
    - [ ] Создать `data/users/seed.json` с одним пользователем ADMIN
    - [ ] В `UserJsonRepo` при первом вызове `isEmpty()` → true → загрузка из seed
    - [ ] Написать тест на авто-инициализацию из seed
- [ ] Task: Интегрировать UserJsonRepo в модуль user
    - [ ] Заменить `UserInMemoryRepo` на `UserJsonRepo` в `packages/user/src/api/module.ts`
    - [ ] Обновить `packages/user/src/infra/index.ts`
    - [ ] Убедиться, что `UserJsonRepo` совместим с DI модуля
- [ ] Task: Прогнать все существующие тесты и устранить регрессии
    - [ ] Запустить `bun test --filter @u7/user`
    - [ ] Исправить тесты, завязанные на inMemory (если есть)
    - [ ] Проверить интеграционные тесты Auto-UI
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Seed-данные и финальная интеграция' (Protocol in workflow.md)
