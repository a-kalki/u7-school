# Реестр треков

> Все треки Релиза 1 выполнены и перемещены в архив: `conductor/archive/`.

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

---

- [ ] **Track: MarkdownV2 — единая точка проверки (fail-fast) и исправление экранирования программы курса**
*Link: [./tracks/markdownv2_guard_20260825/](./tracks/markdownv2_guard_20260825/)*
