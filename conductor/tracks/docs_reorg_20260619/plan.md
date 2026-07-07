# План реализации: Реорганизация документации conductor

Для всего трека применять скилл: `conductor-docs`.

## Фаза 1: Удаление и объединение (FR1, FR3, FR4, FR5)

- [x] Task: Удалить `skills/bot-e2e-testing.md`
  - [x] Удалить файл

- [x] Task: Объединить `errors.md` → `skills/errors.md`
  - [x] Извлечь уникальное из `errors.md` (иерархия AppError, kind→HTTP, AppException)
  - [x] Удалить чужеродную секцию «Инструкция по предотвращению регресса» из `skills/errors.md`
  - [x] Перенести уникальное в `skills/errors.md`
  - [x] Удалить `errors.md`
  - [x] Обновить ссылки в `product-guidelines.md` (выжимку привести к ссылке + роли), `index.md`, ddd-скиллах

- [x] Task: Перенести `integration.md` → `architecture.md`
  - [x] Извлечь уникальное: правила DI, запрет прямого импорта UC, фасады
  - [x] Слить в `architecture.md` с дедупликацией пересечений (поток выполнения команды, модульная структура)
  - [x] Удалить `integration.md`
  - [x] Обновить ссылки в `product-guidelines.md`, `index.md`

- [x] Task: Перенести `markdown-bot.md` → `bot-test.md`
  - [x] Извлечь важное: правила экранирования, функции валидации
  - [x] Добавить секцией «MarkdownV2-валидация» в `bot-test.md`
  - [x] Удалить `markdown-bot.md`
  - [x] Обновить ссылки в `testing.md`, `bot-test.md`, `index.md`

- [x] Task: Conductor - Ручная верификация 'Удаление и объединение'

## Фаза 2: Создание `skills/bot-controller.md` (FR2)

- [x] Task: Проанализировать кодовую базу контроллеров
  - [x] `BotController` (core) — базовый класс
  - [x] `U7BotController` (app) — специализация для U7-бота
  - [x] `StreamController` (stream) — пример доменного контроллера
  - [x] `OnboardingController` (onboarding) — пример без стори
  - [x] `app-controller.md` — контроллер для сценариев приложения

- [x] Task: Написать `skills/bot-controller.md`
  - [x] Структура: Назначение, Ключевые правила, Конструктор/init, Обработчики, Сжатие id, handleError

- [x] Task: Удалить `app-controller.md`
  - [x] Обновить ссылки в `index.md`

- [x] Task: Conductor - Ручная верификация 'Создание bot-controller.md'

## Фаза 3: Упрощение раздутых файлов (FR6)

- [x] Task: Сократить `bot-test.md`
  - [x] Цель: ~150 строк (сейчас 390)
  - [x] Убрать очевидное, оставить структуру уровней и ключевые правила
  - [x] Ссылки на живые тесты вместо примеров
  - [x] Следовать скиллу `conductor-docs`

- [x] Task: Сократить `bot-user-story.md`
  - [x] Цель: ~150 строк (сейчас 467)
  - [x] Убрать дублирование с `bot-controller.md`
  - [x] Заменить длинные примеры ссылками на живые story-файлы
  - [x] Следовать скиллу `conductor-docs`

- [x] Task: Conductor - Ручная верификация 'Упрощение файлов'

## Фаза 4: Анализ связности и перестройка (FR7)

- [x] Task: Проанализировать все файлы документации на связность
  - [x] Проверить цепочку от общего к частному: architecture → api/ddd → usecase/controller/errors → naming/testing
  - [x] Выявить несогласованности, дублирования, пробелы
  - [x] Следовать скиллу `conductor-docs`

- [x] Task: Выдать результаты анализа и план действий
  - [x] Представить пользователю отчёт
  - [x] Получить обратную связь

- [x] Task: Перестроить файлы согласно утверждённому плану
  - [x] Внести изменения
  - [x] Проверить ссылки

- [x] Task: Conductor - Ручная верификация 'Анализ и перестройка'

## Фаза 5: Актуализация индекса и ссылок (FR8)

- [x] Task: Обновить `conductor/index.md`
  - [x] Отразить все удаления, перемещения, переименования
  - [x] Проверить структуру: Определение → Workflow → Styleguides → Learning Skills → Управление

- [x] Task: Обновить `product-guidelines.md`
  - [x] Поправить ссылки на перемещённые/удалённые файлы

- [x] Task: Финальная проверка grep'ом
  - [x] `grep -rn "bot-e2e-testing\|errors\.md\|integration\.md\|markdown-bot\.md\|app-controller\.md" --include="*.md" conductor/ .pi/`
  - [x] Убедиться, что нет битых ссылок

- [x] Task: Conductor - Ручная верификация 'Индекс и ссылки'
