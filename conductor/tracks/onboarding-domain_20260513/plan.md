# План реализации: Доменный пакет onboarding

## Фаза 1: Модель данных и схемы
- [x] Task: Создать enums для ответов анкеты (source, experience, format, goals, intensity и т.д.)
- [x] Task: Создать ApplicationAnswers schema (valibot)
- [x] Task: Создать Application entity schema
- [x] Task: Создать QuestionnaireConfig — структура вопросов и вариантов ответов
- [x] Task: Написать тесты схем и QuestionnaireConfig
- [x] Task: Conductor - User Manual Verification 'Модель данных' (Protocol in workflow.md)

## Фаза 2: Агрегат и политики
- [x] Task: Создать ApplicationAr с методом create
- [x] Task: Создать ApplicationPolicy (canCreate, canRead, canList, canUpdate)
- [x] Task: Написать тесты для ApplicationAr
- [x] Task: Написать тесты для ApplicationPolicy
- [x] Task: Conductor - User Manual Verification 'Агрегат' (Protocol in workflow.md)

## Фаза 3: Domain Service
- [ ] Task: Создать ApplicationDs — доменный сервис для атомарного изменения двух агрегатов
- [ ] Task: Реализовать механизм транзакции (атомарная запись двух JSON-файлов)
- [ ] Task: Написать тесты для ApplicationDs
- [ ] Task: Conductor - User Manual Verification 'Domain Service' (Protocol in workflow.md)

## Фаза 4: UseCases и инфраструктура
- [ ] Task: Создать CreateApplicationCmd / CreateApplicationUc (через ApplicationDs)
- [ ] Task: Создать GetApplicationCmd / GetApplicationUc
- [ ] Task: Создать ListApplicationsCmd / ListApplicationsUc
- [ ] Task: Создать GetApplicationByUserIdCmd / GetApplicationByUserIdUc
- [ ] Task: Создать UpdateApplicationCmd / UpdateApplicationUc (частичное изменение)
- [ ] Task: Создать ApplicationRepo interface
- [ ] Task: Создать ApplicationJsonRepo
- [ ] Task: Создать OnboardingModule
- [ ] Task: Написать тесты для UC и репо
- [ ] Task: Conductor - User Manual Verification 'UseCases' (Protocol in workflow.md)

## Фаза 5: Финал
- [ ] Task: Обновить экспорты пакета
- [ ] Task: Подключить пакет к workspace
- [ ] Task: Проверить покрытие >80%
- [ ] Task: Проверить lint и tsc
- [ ] Task: Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
