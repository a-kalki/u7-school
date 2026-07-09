# Спецификация трека: ContentPath (адресация контента)

> **Контекст эволюции:** `conductor/architecture-evolution.md` (§2.2, §2.1). Прочитать перед началом.
> **Зависимости:** трек 0 (Course — для индекса модуля «A»).

## Обзор
Унифицировать формат адресации контента `A:B:C:D` (module:project:lesson:step) как доменный VO в `course`, с UC `resolve-content-path` и role-based доступом. Устранить дублирование `#findStepPosition` в сториз.

**Роли:** все (curious/student/mentor видят разное).

## Функциональные требования

### F1. VO ContentPath
- В домене `course`: `ContentPath` — value object.
- Формат: `A:B:C:D` (1-based). Partial-формы:
  - `A` — модуль (структура: phases/projects модуля)
  - `A:B` — проект (уроки проекта)
  - `A:B:C` — урок (шаги урока: заголовки/индексы)
  - `A:B:C:D` — шаг (контент)
  - `A:B:C:all` — все шаги урока
- `parse(str)`, `serialize()`, валидация (valibot-схема `ContentPathSchema`).
- Поддержка короткой формы `A:B:C:D` и явной `mA:pB:lC:sD` (алиасы) — унифицировать.

### F2. UC resolve-content-path
- Вход: `path: string`, опционально `streamId`/`courseId` (контекст резолва).
- Выход зависит от уровня пути и роли актора:
  - **curious (GUEST/CANDIDATE) / все желающие**: на уровне шага — только заголовок (`description`), без тела (`content`/`code`). Структура: phases→modules→projects→lessons→шаги (заголовки + тип + кол-во).
  - **student**: completed-шаги — полный контент (read-only); текущий шаг — полный + active; непройденные (будущие) шаги — только заголовок. Требует `streamId` (контекст потока студента).
  - **mentor/admin**: полный доступ ко всему контенту.
- Резолв индексов → UUID через `CourseFacade.getCourseProgram` / `ContentSnapshot` потока.

### F3. Рефакторинг сториз
- `LearningStory.#findStepPosition`, `MonitorStory.#findStepPosition` → использовать `resolve-content-path`.
- Единый рендер шага/урока/проекта на основе результата UC.

### F4. Тесты
- Обновить `tests/bot` для нового резолвера. Добавить сценарии: curious видит структуру без контента; student видит completed + current; mentor видит всё.

## Критерии приёмки
- [ ] `ContentPath` VO парсит/сериализует все partial-формы.
- [ ] `resolve-content-path` корректно фильтрует контент по роли.
- [ ] Дубли `#findStepPosition` устранены.
- [ ] Покрытие >80%, TDD.

## За рамками
- UI навигации по ContentPath (трек 4 — кнопки).
- UI витрины программы (трек 5).
- Шаблонный ввод `mA:pB:lC:sD` пользователем в чат (опц. power-user фича — в треке 4, если решим).
