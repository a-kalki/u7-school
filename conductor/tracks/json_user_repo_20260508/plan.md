# План реализации: Постоянное JSON-хранилище пользователей

## Фаза 1: Общий JSON-адаптер в core

- [ ] Task: Написать тесты для `JsonFileRepo<T>` (TDD Red)
    - [ ] Создать `packages/core/src/infra/json-file-repo.test.ts`
    - [ ] Тест: запись и чтение массива объектов
    - [ ] Тест: валидация объектов через Valibot-схему (невалидные пропускаются)
    - [ ] Тест: пустой/отсутствующий файл → возврат пустого массива
    - [ ] Тест: сохранение перезаписывает файл полностью
- [ ] Task: Реализовать `JsonFileRepo<T>` (TDD Green + Refactor)
    - [ ] Создать `packages/core/src/infra/json-file-repo.ts`
    - [ ] Параметры: путь к файлу, Valibot-схема для валидации
    - [ ] Методы: `readAll()`, `writeAll(items)`
    - [ ] При чтении: парсинг JSON → фильтрация через схему → лог предупреждений для невалидных записей
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Общий JSON-адаптер в core' (Protocol in workflow.md)

## Фаза 2: Реализация UserJsonRepo в user

- [ ] Task: Написать тесты для `UserJsonRepo` (TDD Red)
    - [ ] Создать `packages/user/src/infra/db/user-json-repo.test.ts`
    - [ ] Тест: `save` → `getByUuid` возвращает сохранённого пользователя
    - [ ] Тест: `save` дважды (update) — перезаписывает существующего
    - [ ] Тест: `getByTelegramId` находит по telegramId
    - [ ] Тест: `getAll()` возвращает всех пользователей
    - [ ] Тест: `getAll()` с фильтром по `role`, `name`, `telegramId`
    - [ ] Тест: `isTelegramIdTaken` — true/false
    - [ ] Тест: `isEmpty` — true для нового хранилища, false после save
    - [ ] Тест: невалидные данные в файле пропускаются с логом
- [ ] Task: Реализовать `UserJsonRepo` (TDD Green + Refactor)
    - [ ] Создать `packages/user/src/infra/db/user-json-repo.ts`
    - [ ] Наследует/использует `JsonFileRepo<User>` из core
    - [ ] Реализует интерфейс `UserRepo`
    - [ ] Фильтрация `getAll`: по `role`, `name` (частичное совпадение), `telegramId`, `sort`
    - [ ] Путь по умолчанию: `data/users/users.json` (от корня проекта)
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
