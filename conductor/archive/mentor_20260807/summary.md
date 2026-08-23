# Трек 6: Контроллер `mentor` — «Инструменты ментора»

**Дата:** 2026-08-08
**Статус:** ✅ Завершён

## Цель

Перенести 6 оставшихся стори из `packages/stream/src/ui/bot/stories/` в новый контроллер `MentorController` в `apps/u7-bot/src/controllers/mentor/`.

## Выполненные задачи

### Фаза 1: Подготовка структуры и перенос стори
- Создана структура `mentor/` с `controller.ts`, `ui-spec.md`, `stories/`
- Перенесены 6 стори:
  - `submenu.ts` — подменю (роли MENTOR/ADMIN)
  - `my-streams.ts` — список потоков ментора с фильтрами
  - `view-stream-mentor.ts` — карточка потока с lifecycle-кнопками
  - `create-stream.ts` — wizard создания потока (S09)
  - `activate-stream.ts` — запуск потока (исправлен баг)
  - `monitor.ts` — мониторинг группы (S07/S08)

### Фаза 2: Интеграция
- `MentorController` зарегистрирован в `create-ui-app.ts`
- Кнопка «👥 Студенты» восстановлена: `getAction<MonitorActions>('students')`
- `ViewStreamStory`: 4 метода стали `protected` (handleView, handleProgramView, handleDetailsView, buildKeyboard)
- `MonitorActions` экспортирован для кросс-контроллерных ссылок

### Фаза 3: Тестирование
- 30 unit-тестов (5 файлов)
- 5 интеграционных тестов в `tests/mentor/`
- E2E: разкомментирована проверка кнопки «Студенты»

### Фаза 4: Зачистка
- Удалены 10 старых файлов из `packages/stream/src/ui/bot/stories/`

## Созданные файлы

| Файл | Назначение |
|------|-----------|
| `apps/u7-bot/src/controllers/mentor/controller.ts` | Контроллер (реестр стори) |
| `apps/u7-bot/src/controllers/mentor/ui-spec.md` | UI-спецификация |
| `apps/u7-bot/src/controllers/mentor/stories/submenu.ts` | Подменю |
| `apps/u7-bot/src/controllers/mentor/stories/submenu.test.ts` | Тесты (8) |
| `apps/u7-bot/src/controllers/mentor/stories/my-streams.ts` | Список потоков |
| `apps/u7-bot/src/controllers/mentor/stories/my-streams.test.ts` | Тесты (8) |
| `apps/u7-bot/src/controllers/mentor/stories/view-stream-mentor.ts` | Карточка (ментор) |
| `apps/u7-bot/src/controllers/mentor/stories/view-stream-mentor.test.ts` | Тесты (8) |
| `apps/u7-bot/src/controllers/mentor/stories/create-stream.ts` | Wizard создания |
| `apps/u7-bot/src/controllers/mentor/stories/activate-stream.ts` | Запуск потока |
| `apps/u7-bot/src/controllers/mentor/stories/activate-stream.test.ts` | Тесты (4) |
| `apps/u7-bot/src/controllers/mentor/stories/monitor.ts` | Мониторинг |
| `apps/u7-bot/src/controllers/mentor/stories/monitor.test.ts` | Тесты (2) |
| `apps/u7-bot/tests/mentor/mentor.integration.test.ts` | Интеграционные тесты (5) |

## Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `apps/u7-bot/src/create-ui-app.ts` | +MentorController |
| `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts` | # → protected, +getAction<MonitorActions> |
| `apps/u7-bot/src/controllers/streams/stories/view-stream.story.test.ts` | +students mock |
| `apps/u7-bot/tests/e2e/curious-showcase.e2e.test.ts` | Разкомментирована кнопка «Студенты» |
| `conductor/tracks.md` | Трек 6 → [x] |
| `conductor/tracks/mentor_20260807/plan.md` | Все задачи отмечены |

## Удалённые файлы (из packages/stream/)

- `activate-stream.story.ts` + тест
- `create-stream.story.ts` + тест
- `mentor-tools.story.ts` + тест
- `monitor.story.ts` + тест
- `view-stream-mentor.story.ts` + тест

## Архитектурные решения

1. **Наследование view-stream-mentor:** `ViewStreamStory` методы стали `protected` (вместо `#` приватных), что позволило `ViewStreamMentorStory` наследовать и переопределять `buildKeyboard`.

2. **`CreateStreamCmd` определён локально** в `create-stream.ts`, т.к. тип не экспортируется из `@u7-scl/stream`.

3. **Баг кнопки «Назад»:** в `activate-stream.ts` жёсткая строка `view-stream:view:${id}` заменена на `cbFor('view-stream-mentor', 'view', id)`.

4. **`MonitorActions` для кросс-ссылок:** тип экспортирован из `monitor.ts`, используется в `view-stream.story.ts` через `getAction<MonitorActions>('students')`.

## Отклонения от плана

- `progress.ts` не перенесён в mentor (это студенческая стори, уже в learning-контроллере)
- Интеграционные тесты — базовые (5 штук), без полного сценария wizard-а создания
- Покрытие кода не измерялось (`bun test --coverage`)

## Результат проверок

- `tsc --noEmit` (u7-bot + stream): чистый
- `bun test`: 155 тестов проходят
