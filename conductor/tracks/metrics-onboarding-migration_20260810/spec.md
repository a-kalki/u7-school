# Спецификация — Трек 2.5: onboarding → questionnaire

## Обзор

Модуль `onboarding` становится потребителем `questionnaire`, а не владельцем движка анкет. Старый код анкет из onboarding удаляется. OnboardingAr использует `QuestionnaireFacade` для старта анкеты и подписывается на `QuestionnaireCompleted` через EventBus для выдачи роли `CANDIDATE`.

## FR1 — Удаление старого кода анкет из onboarding

Удалить из `packages/onboarding/src/`:
- `domain/questionnaire/` — a-root.ts, entity.ts, question.ts, question-pool-service.ts, types.ts, policy.ts, repo.ts, errors.ts, commands/
- `api/questionnaire/` — start-uc.ts, handle-action-uc.ts, abandon-uc.ts, get-current-question-uc.ts
- `infra/db/questionnaire-json-repo.ts`

## FR2 — Интеграция с QuestionnaireFacade

`OnboardingAr` использует фасад:
- `questionnaireFacade.start(telegramId, questionPool)` — старт онбординг-анкеты
- `questionnaireFacade.handleAction(questionnaireId, action)` — обработка ответов
- `questionnaireFacade.getQuestionnaire(questionnaireId)` — получение результатов

## FR3 — Подписка на QuestionnaireCompleted

- Onboarding подписывается через EventBus на `questionnaire.completed`
- При событии с `context === 'onboarding'` — выдаёт роль `CANDIDATE`
- Старая логика (completed → роль) удаляется из анкетного движка

## FR4 — OnboardingController

- Остаётся в `apps/u7-bot` (из Релиза 2, Трек 7 — заглушка)
- Адаптируется под вызовы `QuestionnaireFacade` вместо старого API

## Критерии приёмки

- [ ] Старый код анкет удалён из onboarding
- [ ] Онбординг-анкета работает через QuestionnaireFacade
- [ ] Роль CANDIDATE выдаётся через подписку на QuestionnaireCompleted
- [ ] `bun run check:p onboarding`
- [ ] Кнопка онбординга в боте работает

## За рамками

- Изменения в самом questionnaire модуле (→ Трек 2.4a/b)

## Контекст и связанные документы

- [Система сбора метрик (родитель)](../metrics-system.md) — видение, архитектурные решения
- [2. Questionnaire + EventBus](../metrics-questionnaire-and-events.md) — техническая спецификация
- [Дорожная карта](../development-roadmap.md) — Релиз 3
- [Трек 2.4a — модуль questionnaire](../tracks/metrics-questionnaire_20260810/spec.md) — API фасада
- [Трек 2.1 — EventBus](../tracks/metrics-eventbus_20260810/spec.md) — подписка на события
