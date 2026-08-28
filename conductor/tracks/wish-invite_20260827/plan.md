# План реализации — Трек E: wish-invite (приглашение желающим)

## Фаза 1: Событие `stream.created` [checkpoint: pending]

- [x] Task: Написать падающие тесты на публикацию `stream.created` при создании потока (UC) (a3acc84)
- [x] Task: Добавить `StreamCreatedEvent` + публикацию в UC создания потока (a3acc84)
- [ ] Task: Conductor - Ручная верификация 'Событие stream.created'

## Фаза 2: ER `invite-wishers` + репо + фасад + cancel-wish

- [ ] Task: Написать падающие тесты: `WishRepo.findAllByKind` (фильтр по виду и статусам), ER `invite-wishers` (course-ветка только при isFirst, module-ветка на любой модуль, исторический матчинг через фасад, только активные статусы, пустая рассылка, пользователь без профиля), вариант команды `cancel-wish` (course | module)
- [ ] Task: Реализовать `findAllByKind` (интерфейс + JSON-репо), `whichModulesAreSame` в фасаде курсов, `InviteWishersEr` + регистрация в `WishApiModule.reactions`, вариант команды `cancel-wish` + обновление текущих вызовов
- [ ] Task: Гигиена фасада курсов: удалить `getStep`, убрать `getCourse` из интерфейса (приватный хелпер)
- [ ] Task: Conductor - Ручная верификация 'ER invite-wishers + cancel-wish + фасад'

## Фаза 3: UI приглашения

- [ ] Task: Написать падающие тесты на подписку `wish:invite` (адаптивный текст course/module, ментор-строка: nick → t.me-ссылка, без nick → имя; кнопки «Открыть поток» / «Отменить желание») и на W05-M (module-отмена)
- [ ] Task: Реализовать подписку + ProactiveSender + кнопки через Routes; W05-M: маршрут `cancel-mod:{moduleId}` → подтверждение → `cancel-wish` `{ kind: 'module', moduleId }`
- [ ] Task: Conductor - Ручная верификация 'UI приглашения'

## Фаза 4: Документация

- [ ] Task: Актуализировать `courses/ui-spec.md` (W05, W05-M, «Предложение о реализации») и `streams/ui-spec.md` (S11) по итогам имплементации
- [ ] Task: Conductor - Ручная верификация 'Документация'
