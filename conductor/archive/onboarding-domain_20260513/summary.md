# Итоговый отчёт: Доменный пакет onboarding (onboarding-domain)

## Цель
Создать новый DDD-пакет `@u7/onboarding` для хранения и управления заявками студентов (пул кандидатов).

## Выполненные задачи

### Фаза 1: Модель данных и схемы
- Созданы enums для ответов анкеты: Source, Experience, Format, Goals, Intensity, BaseDays, BaseTime, IntensiveTime
- Создана ApplicationAnswers schema (valibot) с валидацией всех полей
- Создана Application entity schema с uuid, userId, status, answers, createdAt, submittedAt, updatedAt
- Создана QuestionnaireConfig — структура вопросов и вариантов ответов с условной логикой
- Написаны тесты для всех схем и конфигурации

### Фаза 2: Агрегат и политики
- Создан ApplicationAr с методами create() и updateAnswers()
- Создана ApplicationPolicy (canCreate, canRead, canList, canUpdate)
- Написаны тесты для ApplicationAr и ApplicationPolicy

### Фаза 3: Domain Service
- Создан **OnboardingDs** — чистый доменный сервис (пустой конструктор, без зависимостей от репозиториев)
- Координирует создание заявки (`ApplicationAr.create`) и присвоение роли CANDIDATE (`UserAr.addRole`)
- Возвращает изменённые агрегаты в plain-объекте `{ application, userAr }`
- Транзакционность и сохранение в БД перенесены на уровень UseCase (соответствие стайлгайду)
- Написаны тесты для OnboardingDs

### Фаза 4: UseCases и инфраструктура
- Созданы 5 UseCases: CreateApplication, GetApplication, ListApplications, GetApplicationByUserId, UpdateApplication
- Созданы команды для всех UC с валидацией и типизированными ошибками
- Создан OnboardingApiModule с регистрацией всех UC
- Создан ApplicationRepo interface и ApplicationJsonRepo
- Написаны интеграционные тесты для модуля

### Фаза 5: Финал
- Обновлены экспорты пакета
- Пакет подключён к workspace
- Добавлена зависимость `@u7/user` в `package.json`
- Добавлены `*Schema` валидации во все enum-файлы
- Убрано устаревшее свойство `errors: never` из `ApplicationArMeta`
- Убран хардкод пути в `ApplicationJsonRepo`
- Добавлены dedicated тесты для `ApplicationJsonRepo`
- Исправлена изоляция тестов модуля (уникальные пути + `afterEach`)
- Негативные тесты проверяют конкретные сообщения ошибок
- Покрытие кода: **89.36% строк**, **82.21% функций**
- Lint и tsc проходят без ошибок

## Созданные/изменённые файлы

### Новые файлы (packages/onboarding/)
- package.json, tsconfig.json
- src/index.ts, src/domain/index.ts, src/api/index.ts, src/infra/index.ts
- src/domain/application/entity.ts, a-root.ts, policy.ts, repo.ts
- src/domain/application/answers.ts, status.ts
- src/domain/application/source.ts, experience.ts, format.ts, goals.ts, intensity.ts
- src/domain/application/base-days.ts, base-time.ts, intensive-time.ts
- src/domain/application/commands/*.ts (create, get, list, get-by-user-id, update, errors)
- src/domain/application/*.test.ts (entity, a-root, policy, answers)
- src/domain/questionnaire/config.ts, config.test.ts
- src/domain/application-ds.ts, application-ds.test.ts
- src/domain/module.ts
- src/api/onboarding-uc.ts
- src/api/application/*.ts (5 UC)
- src/api/module.ts, module.test.ts
- src/infra/db/application-json-repo.ts

### Изменённые файлы
- packages/user/src/infra/db/user-json-repo.ts — добавлена поддержка BaseJsonDb
- packages/onboarding/package.json — добавлена зависимость `@u7/user`

## Архитектурные решения
- **OnboardingDs как чистый координатор агрегатов**: доменный сервис не зависит от репозиториев, возвращает изменённые агрегаты для сохранения внешним кодом (UseCase)
- **Транзакции на уровне UseCase**: UC сам управляет `db.begin()`, `commit()`, `rollback()` — сохраняет заявку и пользователя атомарно
- **UserJsonRepo с поддержкой транзакций**: репозиторий пользователей может участвовать в транзакциях других модулей через `BaseJsonDb`
- **Политики вынесены в отдельный объект**: ApplicationPolicy stateless, проверяет права на основе ролей и владения
- **Enum-схемы как единый источник валидации**: каждый enum имеет соответствующую `*Schema`, используемую в `ApplicationAnswersSchema` и `ApplicationSchema`

## Отклонения от плана
- Нет значимых отклонений. Все задачи выполнены согласно спецификации.

## Известные ограничения
- Пока нет UI и Telegram-бота для заполнения анкеты (вынесено в отдельный трек bot-onboarding)
- Распределение по потокам не реализовано (вынесено в будущие треки)
