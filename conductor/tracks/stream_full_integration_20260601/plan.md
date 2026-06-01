# План реализации: Полная интеграция жизненного цикла потоков

## Фаза 1: Рефакторинг Domain (DDD)
- [ ] Переименовать `packages/stream/src/domain/stream-student` -> `packages/stream/src/domain/student`.
- [ ] Исправить импорты во всем модуле `stream` (domain, api, infra, ui).
- [ ] Обновить тесты доменного слоя.

## Фаза 2: Доменное API (UseCase)
- [ ] `ActivateStreamUc`: 
    - Проверка прав `StreamPolicy`.
    - Активация `StreamAr`.
    - Активация `StudentAr` (выдача первого шага).
- [ ] `CompleteStepUc`: 
    - Проверка прав.
    - Завершение шага `StudentAr`.
    - Выдача следующего шага или завершение курса.
- [ ] `GetStudentProgressUc`: Данные для прогресс-бара и текущего шага.

## Фаза 3: Bot UI & Контроллеры
- [ ] `StreamController`:
    - Обработка `callback_query` (запись, "выполнено", переключение шагов).
    - Рендеринг карточки потока (динамическая клавиатура).
    - Панель ментора (создание, запуск, просмотр списка).
- [ ] Динамическое меню (ролевая модель):
    - Доработка `top-menu-handler.ts` для проверки прав (`UserFacade`) и скрытия/показа кнопок.

## Фаза 4: Финальная интеграция
- [ ] Обеспечить передачу `actorId` (UUID) во все `StreamController.handleUpdate()` (через `UserFacade.getUserByTelegramId`).
- [ ] Интеграция с ботом (обновление `StreamHandler`).
