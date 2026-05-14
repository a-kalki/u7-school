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
- [x] Task: Создать ApplicationDs — доменный сервис для атомарного изменения двух агрегатов
- [x] Task: Реализовать механизм транзакции (атомарная запись двух JSON-файлов)
- [x] Task: Написать тесты для ApplicationDs
- [x] Task: Conductor - User Manual Verification 'Domain Service' (Protocol in workflow.md)

## Фаза 4: UseCases и инфраструктура
- [x] Task: Создать CreateApplicationCmd / CreateApplicationUc (через ApplicationDs)
- [x] Task: Создать GetApplicationCmd / GetApplicationUc
- [x] Task: Создать ListApplicationsCmd / ListApplicationsUc
- [x] Task: Создать GetApplicationByUserIdCmd / GetApplicationByUserIdUc
- [x] Task: Создать UpdateApplicationCmd / UpdateApplicationUc (частичное изменение)
- [x] Task: Создать ApplicationRepo interface
- [x] Task: Создать ApplicationJsonRepo
- [x] Task: Создать OnboardingModule
- [x] Task: Написать тесты для UC и репо
- [x] Task: Conductor - User Manual Verification 'UseCases' (Protocol in workflow.md)

## Фаза 5: Финал
- [ ] Task: Обновить экспорты пакета
- [ ] Task: Подключить пакет к workspace
- [ ] Task: Проверить покрытие >80%
- [ ] Task: Проверить lint и tsc
- [ ] Task: Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
