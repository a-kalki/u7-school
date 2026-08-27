# План реализации — Трек E: wish-invite (приглашение желающим)

## Фаза 1: Событие `stream.created`

- [ ] Task: Написать падающие тесты на публикацию `stream.created` при создании потока (UC)
- [ ] Task: Добавить `StreamCreatedEvent` + публикацию в UC создания потока
- [ ] Task: Conductor - Ручная верификация 'Событие stream.created'

## Фаза 2: ER `invite-wishers` + `getByTarget`

- [ ] Task: Написать падающие тесты на `WishRepo.getByTarget` (все по цели) и ER (резолв курса, фильтр статусов, событие на каждого желающего, пустая рассылка)
- [ ] Task: Реализовать `getByTarget` (интерфейс + JSON-репо) + `InviteWishersEr` + регистрация в `WishApiModule.reactions`
- [ ] Task: Conductor - Ручная верификация 'ER invite-wishers'

## Фаза 3: UI приглашения

- [ ] Task: Написать падающие тесты на подписку `wish:invite` (рендер + кнопки «Открыть поток» / «Отменить желание»)
- [ ] Task: Реализовать подписку + ProactiveSender + кнопки через Routes
- [ ] Task: Conductor - Ручная верификация 'UI приглашения'

## Фаза 4: Документация

- [ ] Task: Обновить `courses/ui-spec.md` (перенести «Предложение о реализации» в статус трека) и `streams/ui-spec.md` при необходимости
- [ ] Task: Conductor - Ручная верификация 'Документация'
