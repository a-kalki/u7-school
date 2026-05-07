# План реализации: Улучшение CLI — авторизация и UX

## Фаза 1: Улучшение сообщений об ошибках валидации (FR5)

- [x] Task: Реорганизовать слой `auto-ui` с подпапками в `@u7/core` [2e8ec0c]
    - [x] Создать структуру: `auto-ui/app/`, `auto-ui/module/`, `auto-ui/controller/`, `auto-ui/parser/`
    - [x] Перенести файлы в соответствующие подпапки
    - [x] Обновить `index.ts` и все импорты
    - [x] Убедиться, что все существующие тесты проходят
- [ ] Task: Создать `formatValibotErrors()` в `auto-ui/controller/`
    - [ ] Написать тесты: функция возвращает читаемый многострочный текст с полями, ожидаемыми значениями и примерами
    - [ ] Реализовать `formatValibotErrors()` — обходит issues Valibot, форматирует построчно
- [ ] Task: Интегрировать `formatValibotErrors` в `AutoUiConsoleController`
    - [ ] Написать тест: при ошибке валидации контроллер вызывает formatValibotErrors
    - [ ] Обновить `AutoUiModule.executeUseCase()` — не форматировать ошибку самому
    - [ ] Обновить `AutoUiConsoleController` — перехватывать AppException, извлекать Valibot issues, форматировать через `formatValibotErrors`
- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Упреждающие подсказки при вводе команд (FR4)

- [ ] Task: Обновить `renderUseCasePrompt()` в `AutoUiModule` — детальная подсказка
    - [ ] Написать тест: renderUseCasePrompt для create-user показывает текущий блок кода + доп.инфо вне блока
    - [ ] Текущий формат (блок кода с путём и названиями полей) — сохранить
    - [ ] Добавить вне блока кода: для каждого поля — тип, допустимые значения перечислений, формат массива
    - [ ] Если можно сгенерировать пример из схемы — добавить (опционально)
- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Параметризация list-users (FR3)

- [ ] Task: Обновить схему `ListUsersCmdSchema` — добавить параметры
    - [ ] Написать тесты: валидация limit (по умолчанию 20), role, name, telegramId, sort
    - [ ] Обновить `ListUsersCmdSchema` — limit, role, name, telegramId, sort
    - [ ] Обновить мета-тип `ListUsersCmdMeta`
- [ ] Task: Реализовать фильтрацию и сортировку в `ListUsersUc`
    - [ ] Написать тесты: фильтрация по роли, поиск по имени, фильтр по telegramId, сортировка, лимит
    - [ ] Реализовать логику фильтрации/сортировки в `ListUsersUc.execute()`
- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4: Авторизация — бутстрап и логин (FR1, FR2)

- [ ] Task: Реализовать `ActorSession` в приложении `u7-cli`
    - [ ] Написать тесты для ActorSession (установка, получение actorId, isAuthenticated)
    - [ ] Реализовать класс `ActorSession` в `apps/u7-cli/src/`
- [ ] Task: Интегрировать `ActorSession` в `AutoUiConsoleController` и `AutoUiApp`
    - [ ] Написать интеграционный тест: команды выполняются с actorId из сессии
    - [ ] Обновить `AutoUiApp` — опциональный `actorId` через setter/параметр
    - [ ] Обновить `AutoUiConsoleController` — создавать сессию, передавать actorId
- [ ] Task: Добавить команды `/register` и `/login` в CLI
    - [ ] Написать тесты: /register (пустой репо → успех, непустой → ошибка), /login (выбор пользователя)
    - [ ] Реализовать `/register` — создаёт админа через UserApiModule, устанавливает сессию
    - [ ] Реализовать `/login` — показывает список пользователей, принимает выбор, устанавливает сессию
    - [ ] Обновить `CommandParser` — добавить `/register` и `/login`
    - [ ] Обновить `AutoUiApp` — обрабатывать новые команды
- [ ] Task: Обновить стартовый экран CLI
    - [ ] Написать тест: renderAbout показывает /register при пустом репо, /login при непустом
    - [ ] Обновить `AutoUiApp.renderAbout()` — учитывать наличие пользователей
- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)
