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
- Создан ApplicationDs — доменный сервис для атомарного изменения двух агрегатов
- Реализован механизм транзакции через BaseJsonDb (атомарная запись двух JSON-файлов)
- ApplicationDs создаёт заявку и добавляет роль CANDIDATE пользователю
- Написаны тесты для ApplicationDs с проверкой отката транзакции
- Обновлён UserJsonRepo для поддержки BaseJsonDb

### Фаза 4: UseCases и инфраструктура
- Созданы 5 UseCases: CreateApplication, GetApplication, ListApplications, GetApplicationByUserId, UpdateApplication
- Созданы команды для всех UC с валидацией и типизированными ошибками
- Создан OnboardingApiModule с регистрацией всех UC
- Создан ApplicationRepo interface и ApplicationJsonRepo
- Написаны интеграционные тесты для модуля

### Фаза 5: Финал
- Обновлены экспорты пакета
- Пакет подключён к workspace
- Покрытие кода: 89.22% строк, 82.85% функций
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

## Архитектурные решения
- **ApplicationDs как координатор транзакций**: доменный сервис управляет атомарной записью в два репозитория через единый BaseJsonDb
- **UserJsonRepo с поддержкой транзакций**: репозиторий пользователей теперь может участвовать в транзакциях других модулей
- **Политики вынесены в отдельный объект**: ApplicationPolicy stateless, проверяет права на основе ролей и владения

## Отклонения от плана
- Нет значимых отклонений. Все задачи выполнены согласно спецификации.

## Известные ограничения
- Пока нет UI и Telegram-бота для заполнения анкеты (вынесено в отдельный трек bot-onboarding)
- Распределение по потокам не реализовано (вынесено в будущие треки)
