# Спецификация: Полное удаление publicActions/getAction

## Обзор

Механизм `publicActions` + `getAction<T>()` в `BotController`/`BotUserStory`/`UiApp` позволяет сторис одного контроллера получать кнопки других сторис. После Трека 9 кросс-контроллерные вызовы удалены из прикладного кода. Единственный оставшийся потребитель — `MonitorStory.publicActions.students` — **мёртвый код** (никто не вызывает через `getAction`, все используют `cbFor`).

**Решение:** удалить `publicActions`/`getAction` из фреймворка (`packages/core`) и прикладного кода полностью.

## Текущее состояние

| Расположение | Что | Статус |
|---|---|---|
| `BotUserStory` (core/ui) | Дженерик `TPublicActions`, поле `publicActions` | 🔴 удалить |
| `BotController` (core/ui) | Геттер `publicActions`, агрегация | 🔴 удалить |
| `UiApp` (core/ui) | Метод `getAction<T>()`, реестр | 🔴 удалить |
| `MonitorStory` (прикладной) | `publicActions`, `MonitorActions` | 🔴 удалить |
| `U7BotUserStory` (прикладной) | Передача дженерика | 🔴 убрать |

## Функциональные требования

### FR1: Удалить publicActions из BotUserStory

- Удалить дженерик-параметр `TPublicActions` из `BotUserStory`
- Удалить поле `publicActions`
- Убрать связанные типы (`UiCallbackFactory` если не используется elsewhere)

### FR2: Удалить publicActions из BotController

- Удалить геттер `publicActions`
- Удалить агрегацию `publicActions` из сторис в `init()`

### FR3: Удалить getAction из UiApp

- Удалить метод `getAction<T>(name)`
- Удалить связанные приватные поля/мапы
- Удалить `collectPublicActions` если есть

### FR4: Удалить publicActions из прикладного кода

- `MonitorStory` — удалить поле `publicActions` и тип `MonitorActions`
- Убрать импорт `UiCallbackFactory` из MonitorStory

### FR5: Обновить документацию

- `bot-user-story.md` — удалить правило 8, заменить пометкой «механизм удалён в Треке 10»
- `bot-controller.md` — удалить секцию про `publicActions`

## Критерии приёмки

- [ ] `bun lint` — чисто
- [ ] `bun tslint` — чисто
- [ ] `bun test` — все тесты проходят
- [ ] `grep -r "publicActions" packages/core --include="*.ts"` — пусто
- [ ] `grep -r "getAction" packages/core --include="*.ts"` — пусто (кроме re-export если есть)
- [ ] `MonitorStory` не экспортирует `MonitorActions`
- [ ] `UiCallbackFactory` удалён если нигде не используется

## За рамками

- Не трогаем `cbFor` — это основной механизм кросс-стори вызовов
- Не трогаем константы (`MAIN_MENU_BUTTON`)
- Не трогаем confirm-диалоги и delegate
