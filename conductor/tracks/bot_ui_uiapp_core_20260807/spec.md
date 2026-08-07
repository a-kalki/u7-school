# Спецификация: `UiApp` в core + удаление `BotRouter` + доработка `publicActions`

> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md)
> **Зависимости:** `bot_ui_app_20260807`

## Обзор

`UiApp` становится центральным хабом UI-слоя в core, забирая всю функциональность `BotRouter`. Стори публикует свои кнопки через дженерик `TActions`, другие стори получают их через `this.uiApp.getAction<T>(name)` с полной типизацией. `BotRouter` удаляется.

## Функциональные требования

1. **`UiApp` в core** (`packages/core/src/ui/bot/ui-app.ts`):
   - Дженерики `<TAppMeta, TActor>` — гарантируют согласованность типов по всей цепочке контроллер→стори
   - `constructor(controllers: BotController<TAppMeta, TActor>[])` — принимает контроллеры
   - `init(apiApp: ApiApp<TAppMeta>)` — каскадная инициализация: apiApp → контроллеры → стори + сбор publicActions
   - Вся маршрутизация (бывший `BotRouter`): `handleWelcome`, `handleCallback`, `handleMessage`, `handleCancel`, `handleTimeout`, `collectMainMenu`
   - Управление `activeHandler` и делегированием

2. **Реестр publicActions в `UiApp`**:
   - При инициализации обходит все контроллеры.стори, собирает `publicActions` в плоскую глобальную мапу `Map<actionName, factory>`
   - Проверяет уникальность имён действий — дубликат → исключение
   - `getAction<T extends StoryPublicActions>(name: keyof T): T[typeof name]` — типизированный доступ: дженерик задаёт тип стори, имя проверяется компилятором, возврат типизирован

3. **Доработка `BotController` (core)**:
   - `init(appApi: ApiApp<TAppMeta>, uiApp: UiApp<TAppMeta, TActor>)` — второй аргумент
   - Каскадно пробрасывает `uiApp` в стори: `story.init(appApi, uiApp)`

4. **Доработка `BotUserStory` (core)**:
   - Дженерик `TActions extends StoryPublicActions` — стори объявляет тип своих публичных кнопок
   - Поле `abstract publicActions: TActions`
   - Поле `protected uiApp!: UiApp<TAppMeta, TActor>` — НЕ `ApiApp`
   - `init(appApi, uiApp)` — сохраняет оба

5. **Удаление `BotRouter`** — класс `bot-router.ts` и `bot-router.test.ts` удаляются из core

6. **`connectRouter` → `connectUiApp`** (`apps/u7-bot/src/handlers/connect-ui-app.ts`):
   - Сигнатура: `connectUiApp(bot, uiApp: UiApp<U7BotAppMeta, User>, ...)`
   - Работает напрямую с `UiApp`, не с `BotRouter`

7. **`U7BotUiApp`** (`apps/u7-bot/src/ui-app.ts`):
   - `extends UiApp<U7BotAppMeta, User>`
   - Метод `getPublicActionCb` удаляется (заменяется `getAction` из core)
   - Свойство `router` удаляется

8. **Обновление `packages/core/src/ui/index.ts`**:
   - Убрать экспорт `bot-router`
   - Добавить экспорт `ui-app`
   - Убрать экспорт несуществующего `ui-registry`

9. **`apps/u7-bot/src/ui-actions.ts`**:
   - Удалить реэкспорт несуществующего `@u7-scl/core/ui/ui-registry`
   - Оставить только актуальные локальные типы, если они ещё нужны (реэкспорты publicActions-типов — только из core)

## Пример использования `publicActions`

```typescript
// ── Стори объявляет тип и реализует кнопки ──

// courses/stories/course-catalog.ts
export type CatalogActions = {
  viewModule: (moduleId: string) => UiBotButton;
  viewLesson: (lessonId: string) => UiBotButton;
};

class CourseCatalogStory extends BotUserStory<U7BotAppMeta, User, CatalogActions> {
  readonly name = 'catalog';

  publicActions: CatalogActions = {
    viewModule: (id) => this.action('📋 Модуль', 'view-module', id),
    viewLesson: (id) => this.action('📝 Урок', 'view-lesson', id),
  };
}

// ── Другая стори получает кнопку ──

// streams/stories/view-stream.ts
import type { CatalogActions } from '../../courses/stories/course-catalog';

class ViewStreamStory extends BotUserStory<U7BotAppMeta, User, ViewStreamActions> {
  async handleCallback(action: string, actor: User, session: SessionData) {
    // ...
    const moduleBtn = this.uiApp.getAction<CatalogActions>('viewModule')(moduleId);
    // moduleBtn: UiBotButton { text: '📋 Модуль', code: 'catalog:view-module:...' }
  }
}
```

Хелпер `this.action()` уже существует в `BotUserStory`:
```typescript
protected action(text: string, actionName: string, ...ids: string[]): UiBotButton {
  return { text, code: this.cb(actionName, ...ids) };
}
```

## Нефункциональные требования

- `tsc --noEmit` проходит в затронутых пакетах (`core`, `apps/u7-bot`)
- `biome check` проходит в затронутых пакетах
- Тесты в затронутых пакетах проходят (может потребоваться адаптация тестов, ссылающихся на `BotRouter`)
- Типизация предотвращает вызов несуществующего действия на этапе компиляции
- При дубликате имени publicActions — исключение при старте

## Критерии приёмки

- `UiApp` живёт в core, типизирован `<TAppMeta, TActor>`
- `BotRouter` удалён, весь его код перенесён в `UiApp`
- `connectUiApp` работает напрямую с `UiApp`
- `this.uiApp.getAction<CatalogActions>('viewModule')` возвращает типизированную функцию
- Дубликат имени publicActions вызывает исключение при старте
- `tsc --noEmit` и `biome check` в `core` и `apps/u7-bot` — чисто
- Тесты в `core` и `apps/u7-bot` проходят

## За рамками

- Изменения в `handleStart()` / главном меню — работают как раньше, через `MenuAggregator`
- Изменения в доменных слоях
- Создание новых контроллеров/стори
- Адаптация КОНКРЕТНЫХ контроллеров и стори (`AppController`, `CourseController`, `StreamController`, etc.) — их `init()` пока остаются как есть (со старыми сигнатурами); будут доработаны в следующих треках
