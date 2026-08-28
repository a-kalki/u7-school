# План реализации — Трек E: wish-invite (приглашение желающим)

## Фаза 1: Событие `stream.created` [checkpoint: be0a3c6]

- [x] Task: Написать падающие тесты на публикацию `stream.created` при создании потока (UC) (a3acc84)
- [x] Task: Добавить `StreamCreatedEvent` + публикацию в UC создания потока (a3acc84)
- [ ] Task: Conductor - Ручная верификация 'Событие stream.created'

## Фаза 2: ER `invite-wishers` + репо + фасад + cancel-wish [checkpoint: 07af347]

- [x] Task: Написать падающие тесты: `WishRepo.findAllByKind` (фильтр по виду и статусам), ER `invite-wishers` (course-ветка только при isFirst, module-ветка на любой модуль, исторический матчинг через фасад, только активные статусы, пустая рассылка, пользователь без профиля), вариант команды `cancel-wish` (course | module) (97796a1)
- [x] Task: Реализовать `findAllByKind` (интерфейс + JSON-репо), `whichModulesAreSame` в фасаде курсов, `InviteWishersEr` + регистрация в `WishApiModule.reactions`, вариант команды `cancel-wish` + обновление текущих вызовов (97796a1)
- [x] Task: Гигиена фасада курсов: удалить `getStep`, убрать `getCourse` из интерфейса (приватный хелпер) (97796a1)
- [ ] Task: Conductor - Ручная верификация 'ER invite-wishers + cancel-wish + фасад'

## Фаза 3: UI приглашения [checkpoint: 169f3cc]

- [x] Task: Написать падающие тесты на подписку `wish:invite` (адаптивный текст course/module, ментор-строка: nick → t.me-ссылка, без nick → имя; кнопки «Открыть поток» / «Отменить желание») и на W05-M (module-отмена) (a3e3f90)
- [x] Task: Реализовать подписку + ProactiveSender + кнопки через Routes; W05-M: маршрут `cancel-mod:{moduleId}` → подтверждение → `cancel-wish` `{ kind: 'module', moduleId }` (a3e3f90)
- [ ] Task: Conductor - Ручная верификация 'UI приглашения'

## Фаза 4: Документация [checkpoint: e133e43]

- [x] Task: Актуализировать `courses/ui-spec.md` (W05, W05-M, «Предложение о реализации») и `streams/ui-spec.md` (S11) по итогам имплементации (6c58b1e)
- [ ] Task: Conductor - Ручная верификация 'Документация'

## Фаза 5: Интеграционные и e2e тесты

- [x] Task: Интеграционный тест контура create-stream → ER invite-wishers → wish:invite: обе ветки матчинга, ворота isFirst, неактивные статусы, пустая рассылка, полный payload события (376e7c1)
- [x] Task: E2E тест пользовательских циклов: course (apply → S11 → «Открыть поток» → W05) и module («Хочу пройти модуль» → S11 → W05-M), ментор-строка с nick/без nick (376e7c1)
- [x] Task: Фикс по итогам e2e: экранирование внешних скобок t.me-ссылки в ментор-строке (MarkdownV2-валидация падала — приглашение с nick-ментором не доставлялось) + запись в troubleshoot-базу (376e7c1)
