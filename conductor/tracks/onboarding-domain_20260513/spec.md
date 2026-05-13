# Спецификация: Доменный пакет onboarding

## Обзор
Создать новый DDD-пакет `packages/u7/onboarding` (или `@u7/onboarding`) для хранения и управления заявками студентов (пулл кандидатов).

## Функциональные требования
### Модель данных
1. `ApplicationAr` — агрегат заявки:
   - `uuid`, `userId`, `status: "SUBMITTED"`, `answers: ApplicationAnswers`, `createdAt`, `submittedAt`.
   - Храним `userId` (не telegramId), предполагается что бот делает запрос к User перед созданием.
2. `ApplicationAnswers` — структура с кодами (не строками) для статистики:
   - `source`, `interestReason`, `experience`, `format`, `goals`, `intensity`, `baseDays?`, `baseTime?`, `intensiveTime?`.
3. `QuestionnaireConfig` — конфигурация вопросов и вариантов ответов. Позволяет:
   - Легко изменять, добавлять, заменять вопросы.
   - Выдавать структуру "вопрос → ответы" для сторонних сервисов (дашборды).
4. Valibot-схемы валидации для всех полей.

### Domain Service
- `ApplicationDs` — доменный сервис, который атомарно изменяет два агрегата:
  - Создаёт `ApplicationAr`.
  - Добавляет роль `CANDIDATE` в `UserAr` через `addRole`.
  - Использует механизм транзакции (атомарная запись двух JSON-файлов).

### Команды и UseCases
- `CreateApplicationCmd` / `CreateApplicationUc` — через `ApplicationDs`.
- `GetApplicationCmd` / `GetApplicationUc`.
- `ListApplicationsCmd` / `ListApplicationsUc`.
- `GetApplicationByUserIdCmd` / `GetApplicationByUserIdUc`.
- `UpdateApplicationCmd` / `UpdateApplicationUc` — частичное изменение ответов ("Изменить ответы").

### Политики
- `canCreate`: любой пользователь, существующий в системе.
- `canRead`: владелец заявки, ADMIN, MENTOR.
- `canList`: ADMIN, MENTOR.
- `canUpdate`: владелец заявки, ADMIN.

### Инфраструктура
- `ApplicationRepo` — интерфейс.
- `ApplicationJsonRepo` — JSON-файловая реализация.
- `OnboardingModule` — регистрация UC и репозитория.

## Нефункциональные требования
- JSON-хранилище (как принято в проекте).
- Покрытие >80%.
- Valibot для всех схем.

## Критерии приёмки
- [ ] `ApplicationAr` создаётся с валидированными `ApplicationAnswers`.
- [ ] `QuestionnaireConfig` выдаёт структуру вопросов и ответов.
- [ ] `ApplicationDs` атомарно создаёт заявку и добавляет роль CANDIDATE.
- [ ] Можно получить заявку по UUID и по userId.
- [ ] Можно листить заявки (ADMIN/MENTOR).
- [ ] Можно частично обновить ответы.
- [ ] Политики корректно ограничивают доступ.
- [ ] Все тесты проходят, покрытие >80%.

## За рамками
- Telegram-бот, UI, conversation-опросник.
- Розыгрыш/распределение по потокам.
