# UI-спецификация: Контроллер streams — «Потоки курсов»

> **Контроллер:** `StreamsController` (`name = 'stream'`)
> **Префикс callback'ов:** `stream:catalog:*` / `stream:view-stream:*`

## Экраны

### S01: Витрина потоков (Каталог)

**Триггер:** Кнопка «📚 Потоки курсов» в главном меню, callback `stream:catalog:list`

**Содержание:**
- Заголовок: «📚 *Потоки курсов*»
- Легенда: «🟡 — идёт набор   🔵 — идёт обучение   🟢 — завершён   ⚫ — в архиве»
- Список потоков: эмодзи статуса + название (ведёт на S02)
- По умолчанию показывает enrollment + active
- Кнопки-переключатели: «Вкл. завершённые», «Вкл. архивированные», «Только активные»
- Кнопка «↩️ Главное меню» последней строкой

**Особые случаи:**
- Нет потоков: «Нет доступных потоков»
- Есть только завершённые: «Нет активных потоков» + кнопка «Вкл. завершённые»

**Кросс-ссылки:**
- Главное меню: `this.uiApp.getAction<CommunityActions>('mainMenu')()`
- Потоки: `this.cbFor('view-stream', 'view', uuid)`

### S02: Карточка потока

**Триггер:** Клик на поток в S01, callback `stream:view-stream:view:<uuid>`

**Содержание:**
- Название потока (жирный)
- Описание (курсив)
- 👤 Ментор
- 📅 Старт
- 🕐 Время
- 👥 Количество студентов
- 📌 Статус
- 📚 Курс: Fullstack JS

**Кнопки:**
- «📖 Программа курса» → S03
- «👥 Студенты» → MonitorStory (через try/catch с fallback на `cbFor`)
- «📋 Детали» → S04
- «📝 Записаться» (только enrollment, не ментор) → EnrollStory (через try/catch с fallback)
- «🔔 Уведомить о наборе» (только active, не ментор)
- «⬅️ Назад к списку» → S01

**Менторские lifecycle-кнопки** («Запустить», «Завершить», «В архив») — **отсутствуют** в curious-режиме.

### S03: Программа курса (tree-renderer)

**Триггер:** Кнопка «📖 Программа курса», callback `stream:view-stream:program:<uuid>`

**Содержание:**
- Заголовок: «📖 *Программа курса*»
- Дерево проектов → уроков → шагов через `renderTree()` из `shared/tree-renderer.ts`
- Кнопка «⬅️ Назад к потоку» → S02

**Особые случаи:**
- Нет contentSnapshot: «Программа пока не загружена.»

**tree-renderer:**
- Проекты: 📁 *<название>*
- Уроки: 📝 *<название>* — meta: «N шагов»
- Функция `renderTree(nodes: TreeNode[]): string` без изменений

### S04: Детали потока

**Триггер:** Кнопка «📋 Детали», callback `stream:view-stream:details:<uuid>`

**Содержание:**
- Заголовок: «📋 *Детали: <название>*»
- Поля: 🎯 Цель, 🏆 Результат, 📜 Правила, 👤 Целевая аудитория, 📝 Дополнительно
- Кнопка «⬅️ Назад к потоку» → S02

**Особые случаи:**
- Нет заполненных полей: «Расширенная информация пока не добавлена.»

## Кросс-ссылки

| Действие | Текущая реализация | Будущий трек |
|----------|-------------------|--------------|
| Главное меню | `getAction<CommunityActions>('mainMenu')()` | ✅ работает |
| Студенты | `try getAction<MonitorActions>` → fallback `cbFor` | Трек 6 |
| Записаться | `try getAction<EnrollActions>` → fallback `cbFor` | Трек 5 |

## Типы действий

```typescript
export interface MonitorActions extends StoryPublicActions {
  students(streamId: string): UiBotButton;
}
export interface EnrollActions extends StoryPublicActions {
  start(streamId: string): UiBotButton;
}
export interface CatalogActions extends StoryPublicActions {
  list(): { text: string; code: string };
}
```

## Тесты

- Unit: `apps/u7-bot/tests/streams/` — 35 тестов (контроллер + catalog + view-stream)
- Интеграционные: `tests/bot/integration/stream/` — 31 тест
- E2E: `tests/bot/e2e/curious-showcase.e2e.test.ts` + `stream/` — 25+ тестов
