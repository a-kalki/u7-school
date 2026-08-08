# Реестр треков

## Релиз 1: Новый Bot UI — фундамент и базовые контроллеры

> Треки 0–4 выполнены. Архив: `conductor/archive/`.

### Оставшиеся треки

- [x] **Трек 6: Контроллер `mentor` — «Инструменты ментора»**
  *Перенос 6 стори (submenu, my-streams, view-stream-mentor, create-stream, activate-stream, monitor).*
  *Link: [./tracks/mentor_20260807/](./tracks/mentor_20260807/)*
  *Документ: [bot-ui-refactoring.md](./bot-ui-refactoring.md#трек-6-контроллер-mentor--инструменты-ментора)*

- [ ] **Трек 7: `OnboardingController` — заглушка**
  *Перенос как есть, отключение кнопки до Релиза 3.*
  *Link: [./tracks/onboarding_20260807/](./tracks/onboarding_20260807/)*
  *Документ: [bot-ui-refactoring.md](./bot-ui-refactoring.md#трек-7-onboarding--заглушка)*

- [ ] **Трек 8: Зачистка и обновление документации**
  *Удаление оставшегося старого кода, финальная проверка.*
  *Link: [./tracks/cleanup_20260807/](./tracks/cleanup_20260807/)*
  *Документ: [bot-ui-refactoring.md](./bot-ui-refactoring.md#трек-8-зачистка-и-обновление-документации)*

---

## Структура тестов после Треков 0–4

```
apps/u7-bot/
├── src/**/*.test.ts          ← unit-тесты рядом с исходниками
└── tests/
    ├── helpers/              ← test-app.ts, fixture-loader.ts
    ├── fixtures/             ← JSON-шаблоны
    ├── courses/              ← 4 integration-теста
    ├── streams/              ← 2 integration-теста
    ├── learning/             ← 1 integration-тест (Трек 5)
    └── e2e/                  ← 3 e2e-теста

packages/stream/src/ui/bot/stories/
    ├── monitor.story.ts / .test.ts       ← Трек 6
    ├── mentor-tools.story.ts / .test.ts  ← Трек 6
    ├── view-stream-mentor.story.ts / .test.ts  ← Трек 6
    ├── progress.story.ts / .test.ts      ← Трек 6
    ├── create-stream.story.ts / .test.ts ← Трек 6
    └── activate-stream.story.ts / .test.ts ← Трек 6
```

## TODO в коде (для будущих треков)

| Что | Где | Трек |
|-----|-----|------|
| Кнопка «👥 Студенты» | `view-stream.story.ts:241` | Трек 6 |
| E2E: Студенты → список | `e2e/curious-showcase.e2e.test.ts` | Трек 6 |
