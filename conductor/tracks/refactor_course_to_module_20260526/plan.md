# План реализации: refactor_course_to_module_20260526

## Фаза 0: Переименование файлов и директорий

- [x] Task: Переименовать директорию domain/course → domain/module ✅
- [x] Task: Переименовать директорию api/course → api/module ✅
- [x] Task: Переименовать и удалить файлы ✅
- [x] Task: Conductor - User Manual Verification 'Переименование файлов' ✅

---

## Фаза 1: Упрощение схемы entity (без kind)

- [x] Task: Написать тесты для новой ModuleSchema ✅
- [x] Task: Реализовать ModuleSchema без kind ✅
- [x] Task: Conductor - User Manual Verification 'Упрощение схемы' ✅

---

## Фаза 2: Переименование агрегата CourseAr → ModuleAr

- [x] Task: Написать тесты для ModuleAr.create (без kind) ✅
- [x] Task: Реализовать ModuleAr.create без kind ✅
- [x] Task: Написать тесты для упрощённых методов ✅
- [x] Task: Упростить методы ModuleAr ✅
- [x] Task: Conductor - User Manual Verification 'Агрегат ModuleAr' ✅

---

## Фаза 3: Переименование команд и чистка

- [x] Task: Обновить команды (переименование + удаление kind) ✅
- [x] Task: Conductor - User Manual Verification 'Команды' ✅

---

## Фаза 4: Snapshot API — CourseDs + Фасад + UseCase

- [x] Task: Написать тесты для CourseDs.buildSnapshot ✅ (7 тестов, все проходят)
- [x] Task: Реализовать CourseDs.buildSnapshot ✅ (фильтр только PUBLISHED)
- [~] Task: Написать тесты для get-module-snapshot-uc (пропущено)
- [x] Task: Реализовать get-module-snapshot-uc ✅
- [x] Task: Создать фасадный интерфейс CourseFacade ✅
- [x] Task: Реализовать CourseInProcFacade ✅
- [ ] Task: Conductor - User Manual Verification 'Snapshot API'

---

## Фаза 5: Переименование API слоя

- [x] Task: Обновить базовый класс CourseUseCase ✅ (методы getCourse→getModule)
- [x] Task: Обновить use cases ✅
- [x] Task: Обновить api/module.ts (ApiModule) ✅
- [x] Task: Conductor - User Manual Verification 'API слой' ✅

---

## Фаза 6: Инфра-слой и финальная сборка

- [x] Task: Обновить инфра-слой ✅ (ModuleJsonRepo, CourseInProcFacade)
- [x] Task: Обновить repo.ts ✅ (ModuleRepo, ModuleListFilter без kind)
- [x] Task: Обновить публичные экспорты ✅ (domain/index.ts, api/index.ts, infra/index.ts)
- [~] Task: Обновить все тесты в вертикали (~45 ошибок типов в тестовых файлах)
- [ ] Task: Conductor - User Manual Verification 'Инфра-слой и сборка'

---

## Фаза 7: Обновление трека stream_domain_20260526

- [x] Task: Обновить stream_domain_20260526/spec.md ✅
- [x] Task: Обновить stream_domain_20260526/plan.md ✅
- [ ] Task: Conductor - User Manual Verification 'Обновление трека stream'

---

## Фаза 8: Контроль качества

- [ ] Task: Запустить полную проверку качества
    - [ ] `bun test` — все тесты проходят
    - [ ] `bun run lint` — нет ошибок Biome
    - [ ] `bun run tslint` — нет ошибок типов
    - [ ] `bun test --coverage` — покрытие >80%

- [ ] Task: Проверить импорты во всех пакетах
    - [ ] `packages/user`, `packages/onboarding`, `apps/*`

- [ ] Task: Conductor - User Manual Verification 'Контроль качества'
