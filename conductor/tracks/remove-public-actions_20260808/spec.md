# Спецификация: Удаление кросс-контроллерных publicActions

## Обзор

Механизм `publicActions` + `getAction<T>()` позволяет сторис одного контроллера
встраивать кнопки из сторис другого контроллера. Это создаёт архитектурную дыру:
префикс контроллера и сжатие UUID (`shortIds`) привязаны к контроллеру-владельцу,
а не к источнику кнопки. При нажатии кнопки callback приходит не в тот контроллер,
а даже если исправить маршрутизацию — сжатые id не найдутся в чужой мапе `shortIds`.

**Решение:** удалить механизм `publicActions`/`getAction` полностью.
Кнопки, которые были кросс-контроллерными, убираются из карточки потока.
Пользователь добирается до них через соответствующие разделы меню.

## Функциональные требования

### FR1: Удаление publicActions из сторис
- `MonitorStory.publicActions.students` — удалить
- `EnrollStory.publicActions.enrollButton` — удалить (если существует)

### FR2: Удаление getAction из ViewStreamStory
- Кнопка «👥 Студенты» — удалить из `buildKeyboard()`
- Кнопка «📝 Записаться» — удалить из `buildKeyboard()`

### FR3: Удаление инфраструктуры publicActions из core
- `UiApp.getAction()` — удалить
- `UiApp.#registerPublicActions()` — удалить
- `UiApp.publicActionsMap` — удалить
- `BotUserStory.publicActions` (поле и дженерик `TActions`) — удалить
- Тип `StoryPublicActions`, `UiCallbackFactory` в `public-actions.ts` — удалить если не нужны
- `BotController.publicActions` (getter на уровне контроллера) — удалить

### FR4: Обновление тестов
- E2E: убрать проверку наличия кнопки «Студенты» в карточке потока
- E2E: убрать проверку клика по «Студенты» (добавленную для диагностики)
- Интеграционные: убрать `MentorController` из `beforeAll` где он был нужен только для `getAction`
- `UiApp` unit-тесты: удалить тесты `getAction`/`publicActionsSize`

### FR5: Документация
- Обновить `conductor/code_styleguides/skills/bot-user-story.md` — убрать упоминания publicActions
- Обновить `conductor/code_styleguides/skills/bot-controller.md` — убрать упоминания publicActions

## Критерии приёмки
- [ ] `bun lint` — чисто
- [ ] `bun tslint` — чисто
- [ ] `bun test` — все тесты проходят
- [ ] Кнопка «Студенты» доступна через «Инструменты ментора» → «Мои потоки» → поток → «Студенты»
- [ ] В карточке потока (S02) нет кнопки «Студенты»
- [ ] В карточке потока (S02) нет кнопки «Записаться» (для curious-режима)

## За рамками
- Не трогаем confirm-диалоги
- Не трогаем delegate
- Не трогаем cbFor (кросс-стори в рамках одного контроллера — работает)
