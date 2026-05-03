# План реализации: Множественные роли, переименование, исправление ai-service

## Phase 1: Переименование файлов на kebab-case (FR3) [checkpoint: 6f6a708]

- [x] Task: Переименовать файлы в `packages/core/src/domain/` [663d2f2]
    - [x] `user_ar.ts` → `user-ar.ts`
    - [x] `user_ar.test.ts` → `user-ar.test.ts`
    - [x] `user_policy.ts` → `user-policy.ts`
    - [x] `user_policy.test.ts` → `user-policy.test.ts`
    - [x] `course_ar.ts` → `course-ar.ts`
    - [x] `course_ar.test.ts` → `course-ar.test.ts`
    - [x] `course_policy.ts` → `course-policy.ts`
    - [x] `course_policy.test.ts` → `course-policy.test.ts`
    - [x] `iso_now.ts` → `iso-now.ts`
    - [x] `iso_now.test.ts` → `iso-now.test.ts`
- [x] Task: Переименовать файлы в `packages/core/src/api/`
    - [x] `create_course_command.ts` → `create-course-command.ts`
    - [x] `create_course_command.test.ts` → `create-course-command.test.ts`
    - [x] `create_user_command.ts` → `create-user-command.ts`
    - [x] `create_user_command.test.ts` → `create-user-command.test.ts`
    - [x] `course_creating_uc.ts` → `course-creating-uc.ts`
    - [x] `course_creating_uc.test.ts` → `course-creating-uc.test.ts`
    - [x] `course_repository.ts` → `course-repository.ts`
    - [x] `course_repository.test.ts` → `course-repository.test.ts`
    - [x] `user_creating_uc.ts` → `user-creating-uc.ts`
    - [x] `user_creating_uc.test.ts` → `user-creating-uc.test.ts`
    - [x] `user_repository.ts` → `user-repository.ts`
    - [x] `user_repository.test.ts` → `user-repository.test.ts`
    - [x] `parse_or_throw.ts` → `parse-or-throw.ts`
- [x] Task: Переименовать файлы в `apps/u7-bot/`
    - [ ] `course.schema.test.ts` → `course-schema.test.ts`
- [x] Task: Обновить все импорты в `packages/core/src/` на новые имена файлов
- [x] Task: Обновить все импорты в `apps/u7-bot/` на новые имена файлов
- [x] Task: Добавить соглашение о kebab-case в `docs/architecture.md`
- [x] Task: Регресс-проверка: запустить `bun test`, все ранее проходившие тесты должны проходить
- [x] Task: Conductor - User Manual Verification 'Phase 1: kebab-case' (Protocol in workflow.md) [6f6a708]

## Phase 2: Переименование модуля @u7/core → @u7/course (FR2) [checkpoint: 8ede3ed]

- [x] Task: Переименовать директорию `packages/core` → `packages/course` [bb78fca]
- [x] Task: Обновить `packages/course/package.json`: `"name": "@u7/course"`
- [x] Task: Обновить все импорты `@u7/core` → `@u7/course` в проекте (packages, apps)
- [x] Task: Обновить путь в `package.json` корня (workspaces)
- [x] Task: Обновить ссылки в `docs/architecture.md`
- [x] Task: Регресс-проверка: запустить `bun test`, все ранее проходившие тесты должны проходить
- [x] Task: Conductor - User Manual Verification 'Phase 2: rename module' (Protocol in workflow.md) [8ede3ed]

## Phase 3: Множественные роли пользователя (FR1)

- [ ] Task: Обновить тесты для `UserSchema` — заменить `role` на `roles: Role[]`, добавить новые тесты
    - [ ] Обновить существующие тесты: `role` → `roles` (массив)
    - [ ] Новый тест: пустой массив ролей — ошибка валидации
    - [ ] Новый тест: невалидная роль в массиве — ошибка валидации
    - [ ] Убедиться что все старые тесты всё ещё проходят (регресс)
- [ ] Task: Обновить тесты для `UserAr` с множественными ролями
    - [ ] Обновить существующие тесты: `role` → `roles` (массив)
    - [ ] Новый тест: создание пользователя с несколькими ролями
    - [ ] Новый тест: изменение ролей через метод агрегата
- [ ] Task: Обновить тесты для `UserPolicy` с множественными ролями
    - [ ] Обновить существующие тесты: проверка прав по массиву ролей
    - [ ] Новый тест: доступ разрешён при наличии нужной роли среди нескольких
    - [ ] Новый тест: доступ запрещён при отсутствии нужной роли
- [ ] Task: Обновить тесты для `UserCreatingUc` с `roles: Role[]`
    - [ ] Обновить существующие тесты: `role` → `roles` (массив)
    - [ ] Новый тест: ошибка при пустом массиве ролей
- [ ] Task: Реализовать `UserSchema`: заменить `role` на `roles: v.array(RoleSchema)` с `minLength(1)`
- [ ] Task: Реализовать `UserAr`: поддержка `roles: Role[]` (конструктор, create, методы)
- [ ] Task: Реализовать `UserPolicy`: проверка прав по массиву ролей
- [ ] Task: Реализовать `CreateUserCommand` и схему: `role` → `roles`
- [ ] Task: Реализовать `UserCreatingUc`: работа с массивом ролей
- [ ] Task: Обновить `UserRepository`: интерфейс и in-memory реализацию
- [ ] Task: Регресс-проверка: запустить `bun test --coverage`, все тесты проходят, покрытие >80%
- [ ] Task: Conductor - User Manual Verification 'Phase 3: multi-roles' (Protocol in workflow.md)

## Phase 4: Исправление тестов ai-service (FR4)

- [ ] Task: Заменить мок `@google/genai` на `openai` в `ai-service.test.ts`
    - [ ] Мок `chat.completions.create` — возвращает корректный ответ в формате OpenAI API
    - [ ] Мок ошибки API через `mockRejectedValue` с актуальной структурой
- [ ] Task: Обновить тест ошибки: убрать `spyOn(ai.models, "generateContent")` (старый Gemini API)
- [ ] Task: Регресс-проверка: запустить `bun test --filter w3school`, все тесты проходят, без реальных HTTP-запросов
- [ ] Task: Conductor - User Manual Verification 'Phase 4: ai-service fix' (Protocol in workflow.md)
