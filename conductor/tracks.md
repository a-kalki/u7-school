# Реестр треков

## Релиз 1: Новый Bot UI — фундамент и базовые контроллеры

> Треки 0–6 выполнены. Архив: `conductor/archive/`.

### Оставшиеся треки

- [~] **Трек 8: Зачистка и обновление документации**
  *Удаление оставшегося старого кода, финальная проверка.*
  *Link: [./tracks/cleanup_20260807/](./tracks/cleanup_20260807/)*
  *Документ: [bot-ui-refactoring.md](./bot-ui-refactoring.md#трек-8-зачистка-и-обновление-документации)*

---

## Структура тестов после Треков 0–6

```
apps/u7-bot/
├── src/**/*.test.ts          ← unit-тесты рядом с исходниками
└── tests/
    ├── helpers/              ← test-app.ts, fixture-loader.ts
    ├── fixtures/             ← JSON-шаблоны
    ├── courses/              ← 4 integration-теста
    ├── streams/              ← 2 integration-теста
    ├── learning/             ← 1 integration-тест (Трек 5)
    ├── mentor/               ← 5 integration-тестов (Трек 6)
    └── e2e/                  ← 3 e2e-теста

packages/stream/src/ui/bot/stories/   ← пусто (все стори перенесены)
```

## TODO в коде (для будущих треков)

| Что | Где | Трек |
|-----|-----|------|
| — | — | — |
