# План реализации — Трек 2.5: onboarding → questionnaire

## Фаза 1: Удаление старого кода

- [ ] Task: Удалить `domain/questionnaire/` из onboarding
- [ ] Task: Удалить `api/questionnaire/` из onboarding
- [ ] Task: Удалить `infra/db/questionnaire-json-repo.ts`
- [ ] Task: Conductor - Ручная верификация 'Удаление'

## Фаза 2: Интеграция с QuestionnaireFacade

- [ ] Task: Адаптировать OnboardingAr под использование QuestionnaireFacade
- [ ] Task: Настроить подписку на QuestionnaireCompleted через EventBus
- [ ] Task: Перенести логику выдачи роли CANDIDATE в подписчик
- [ ] Task: Написать unit-тесты на интеграцию
- [ ] Task: Conductor - Ручная верификация 'Интеграция'

## Фаза 3: Контроллер

- [ ] Task: Адаптировать OnboardingController под новый API
- [ ] Task: Проверить `bun run check:p onboarding`
- [ ] Task: Conductor - Ручная верификация 'Контроллер'
