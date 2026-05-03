# План реализации: Множественные роли, переименование, исправление ai-service

## Phase 1: Переименование файлов на kebab-case (FR3)

- [ ] Task: Переименовать файлы в `packages/core/src/domain/`
    - [ ] `user_ar.ts` → `user-ar.ts`
    - [ ] `user_ar.test.ts` → `user-ar.test.ts`
    - [ ] `user_policy.ts` → `user-policy.ts`
    - [ ] `user_policy.test.ts` → `user-policy.test.ts`
    - [ ] `course_ar.ts` → `course-ar.ts`
    - [ ] `course_ar.test.ts` → `course-ar.test.ts`
    - [ ] `course_policy.ts` → `course-policy.ts`
    - [ ] `course_policy.test.ts` → `course-policy.test.ts`
    - [ ] `iso_now.ts` → `iso-now.ts`
    - [ ] `iso_now.test.ts` → `iso-now.test.ts`
- [ ] Task: Переименовать файлы в `packages/core/src/api/`
    - [ ] `create_course_command.ts` → `create-course-command.ts`
    - [ ] `create_course_command.test.ts` → `create-course-command.test.ts`
    - [ ] `create_user_command.ts` → `create-user-command.ts`
    - [ ] `create_user_command.test.ts` → `create-user-command.test.ts`
    - [ ] `course_creating_uc.ts` → `course-creating-uc.ts`
    - [ ] `course_creating_uc.test.ts` → `course-creating-uc.test.ts`
    - [ ] `course_repository.ts` → `course-repository.ts`
    - [ ] `course_repository.test.ts` → `course-repository.test.ts`
    - [ ] `user_creating_uc.ts` → `user-creating-uc.ts`
    - [ ] `user_creating_uc.test.ts` → `user-creating-uc.test.ts`
    - [ ] `user_repository.ts` → `user-repository.ts`
    - [ ] `user_repository.test.ts` → `user-repository.test.ts`
    - [ ] `parse_or_throw.ts` → `parse-or-throw.ts`
- [ ] Task: Переименовать файлы в `apps/u7-bot/`
    - [ ] `course.schema.test.ts` → `course-schema.test.ts`
- [ ] Task: Обновить все импорты в `packages/core/src/` на новые имена файлов
- [ ] Task: Обновить все импорты в `apps/u7-bot/` на новые имена файлов
- [ ] Task: Добавить соглашение о kebab-case в `docs/architecture.md`
- [ ] Task: Регресс-проверка: запустить `bun test`, все ранее проходившие тесты должны проходить
- [ ] Task: Conductor - User Manual Verification 'Phase 1: kebab-case' (Protocol in workflow.md)

## Phase 2: Переименование модуля @u7/core → @u7/course (FR2)

- [ ] Task: Переименовать директорию `packages/core` → `packages/course`
- [ ] Task: Обновить `packages/course/package.json`: `"name": "@u7/course"`
- [ ] Task: Обновить все импорты `@u7/core` → `@u7/course` в проекте (packages, apps)
- [ ] Task: Обновить путь в `package.json` корня (workspaces)
- [ ] Task: Обновить ссылки в `docs/architecture.md`
- [ ] Task: Регресс-проверка: запустить `bun test`, все ранее проходившие тесты должны проходить
- [ ] Task: Conductor - User Manual Verification 'Phase 2: rename module' (Protocol in workflow.md)

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
