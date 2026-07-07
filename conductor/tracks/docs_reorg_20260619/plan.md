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

- [ ] Task: Сократить `bot-test.md`
  - [ ] Цель: ~150 строк (сейчас 390)
  - [ ] Убрать очевидное, оставить структуру уровней и ключевые правила
  - [ ] Ссылки на живые тесты вместо примеров
  - [ ] Следовать скиллу `conductor-docs`

- [ ] Task: Сократить `bot-user-story.md`
  - [ ] Цель: ~150 строк (сейчас 467)
  - [ ] Убрать дублирование с `bot-controller.md`
  - [ ] Заменить длинные примеры ссылками на живые story-файлы
  - [ ] Следовать скиллу `conductor-docs`

- [ ] Task: Conductor - Ручная верификация 'Упрощение файлов'

## Фаза 4: Анализ связности и перестройка (FR7)

- [ ] Task: Проанализировать все файлы документации на связность
  - [ ] Проверить цепочку от общего к частному: architecture → api/ddd → usecase/controller/errors → naming/testing
  - [ ] Выявить несогласованности, дублирования, пробелы
  - [ ] Следовать скиллу `conductor-docs`

- [ ] Task: Выдать результаты анализа и план действий
  - [ ] Представить пользователю отчёт
  - [ ] Получить обратную связь

- [ ] Task: Перестроить файлы согласно утверждённому плану
  - [ ] Внести изменения
  - [ ] Проверить ссылки

- [ ] Task: Conductor - Ручная верификация 'Анализ и перестройка'

## Фаза 5: Актуализация индекса и ссылок (FR8)

- [ ] Task: Обновить `conductor/index.md`
  - [ ] Отразить все удаления, перемещения, переименования
  - [ ] Проверить структуру: Определение → Workflow → Styleguides → Learning Skills → Управление

- [ ] Task: Обновить `product-guidelines.md`
  - [ ] Поправить ссылки на перемещённые/удалённые файлы

- [ ] Task: Финальная проверка grep'ом
  - [ ] `grep -rn "bot-e2e-testing\|errors\.md\|integration\.md\|markdown-bot\.md\|app-controller\.md" --include="*.md" conductor/ .pi/`
  - [ ] Убедиться, что нет битых ссылок

- [ ] Task: Conductor - Ручная верификация 'Индекс и ссылки'
