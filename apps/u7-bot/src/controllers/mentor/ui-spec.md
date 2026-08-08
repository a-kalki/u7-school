# UI-спецификация: Контроллер mentor — «Инструменты ментора»

> **Контроллер:** `MentorController` (`name = 'mentor'`)
> **Префикс callback'ов:** `mentor:submenu:*` / `mentor:my-streams:*` / `mentor:view-stream-mentor:*` / `mentor:create-stream:*` / `mentor:activate-stream:*` / `mentor:monitor:*`

## Экраны

### Подменю инструментов ментора

**Триггер:** Кнопка «🛠️ Инструменты ментора» в главном меню, callback `mentor:submenu:start`

**Содержание:**
- Заголовок: «🛠️ *Инструменты ментора*»
- Кнопка «📋 Мои потоки» → my-streams
- Кнопка «➕ Создать поток» → create-stream
- Кнопка «🔙 Назад» → главное меню (через `getAction<CommunityActions>('mainMenu')`)

### Мои потоки (список)

**Триггер:** Кнопка «📋 Мои потоки», callback `mentor:my-streams:list`

**Содержание:**
- Заголовок: «📋 *Мои потоки*»
- Легенда: «🟡 — идёт набор   🔵 — идёт обучение   🟢 — завершён   ⚫ — в архиве»
- Список потоков ментора с фильтрацией по статусу
- Переключатели: «Вкл. архивированные», «Вкл. завершённые»
- Кнопка «🔙 Назад» → submenu:start

### S02m: Карточка потока (менторский режим)

**Триггер:** Клик на поток в «Мои потоки», callback `mentor:view-stream-mentor:view:<uuid>`

**Содержание:**
- Та же карточка, что S02 (curious), но с lifecycle-кнопками
- Кнопки: «📖 Программа курса», «👥 Студенты», «📋 Детали»
- Lifecycle: «🚀 Запустить» (enrollment), «✅ Завершить» (active), «📁 В архив» (completed)
- «⬅️ Назад к моим потокам» → my-streams:list

### S03 (программа) и S04 (детали) — делегируются view-stream

### S09: Wizard создания потока

**Триггер:** Кнопка «➕ Создать поток», callback `mentor:create-stream:start`

Многошаговый wizard: выбор модуля → название → описание → дата → необязательные поля → группа → кодовое слово → превью → подтверждение.

### Запуск потока

**Триггер:** Кнопка «🚀 Запустить», callback `mentor:activate-stream:activate:<uuid>`

**Содержание:**
- Сообщение: «🚀 Поток запущен!»
- Кнопка «⬅️ Назад к потоку» → view-stream-mentor:view:<uuid>

### S07/S08: Мониторинг группы

**Триггер:** Кнопка «👥 Студенты», callback `mentor:monitor:students:<uuid>`

**Содержание:**
- Статистика группы
- Список студентов с прогресс-барами и маркерами отставания
- Кнопки действий: ⛔ (mark-abandoned), ✅ (complete-student)
- Детальная карточка студента: `mentor:monitor:detail:<studentId>`

## Типы действий

```typescript
export interface MonitorActions extends StoryPublicActions {
  students(streamId: string): UiBotButton;
}
export interface ViewStreamMentorActions extends StoryPublicActions {
  view(streamId: string): UiBotButton;
}
```

## Тесты

- Unit: `apps/u7-bot/src/controllers/mentor/stories/*.test.ts` — 6 файлов
- Интеграционные: `apps/u7-bot/tests/mentor/`
- E2E: `apps/u7-bot/tests/e2e/`
