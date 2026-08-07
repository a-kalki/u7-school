# Трек 8: Зачистка и обновление документации

**Контекст:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md#трек-8-зачистка-и-обновление-документации)

---

## 1. Обзор

Финальный трек рефакторинга. Удалить весь старый UI-код, оставшийся в доменных пакетах, обновить документацию, проверить целостность проекта.

## 2. Функциональные требования

### 2.1. Удаление старого кода

Удалить директории и файлы:
- `packages/stream/src/ui/` — целиком
- `packages/course/src/ui/` — целиком
- `packages/onboarding/src/ui/` — целиком
- `packages/app/src/ui/` — целиком (если осталось)
- `packages/app/src/domain/u7-bot-app-meta.ts` — удалён

### 2.2. Обновление `package.json` exports

- Убрать UI-экспорты из `packages/stream/package.json`
- Убрать UI-экспорты из `packages/course/package.json`
- Убрать UI-экспорты из `packages/onboarding/package.json`
- Убрать `u7-bot-app-meta` экспорт из `packages/app/package.json`

### 2.3. Обновление документации (7 файлов)

| Файл | Что изменить |
|------|-------------|
| `code_styleguides/architecture.md` | Убрать `ui/` из структуры доменных модулей |
| `code_styleguides/skills/bot-controller.md` | Новая иерархия, `UiApp`, `publicActions` |
| `code_styleguides/skills/bot-user-story.md` | Новые пути, `uiApp.getAction<T>()` |
| `conductor/index.md` | Обновить ссылки на перенесённые файлы |
| `packages/core/src/ui/bot/README.md` | Правила навигации |
| `packages/stream/src/ui/bot/ui-spec.md` | Разделить на 4 файла в `apps/u7-bot/src/{courses,streams,learning,mentor}/ui-spec.md` |
| `apps/u7-bot/README.md` | Создать |

### 2.4. Финальная проверка

- `bun run check` (biome + tsc + тесты) — всё чисто
- `grep` по удалённым путям — не должно быть ссылок

## 3. Нефункциональные требования

- Все тесты проходят
- `tsc --noEmit` чисто
- `biome check` чисто
- Нет битых импортов

## 4. Критерии приёмки

- [ ] Все старые UI-директории удалены
- [ ] `package.json` exports обновлены во всех пакетах
- [ ] 7 файлов документации обновлены
- [ ] `bun run check` проходит всё
- [ ] Ни одной циклической зависимости (проверить через `tsc --noEmit`)
- [ ] `grep -r "packages/stream/src/ui" --include="*.ts"` — пусто

## 5. За рамками

- Изменения в доменных слоях
- Новые фичи
- Рефакторинг onboarding (будет в треке metrics)
