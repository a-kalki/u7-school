# План реализации — Трек C1: wish модуль (ядро)

## Фаза 1: Агрегат Wish + repo

- [ ] Task: Написать падающие тесты на `WishAr` (express/cancel/инварианты) и `WishRepo`
- [ ] Task: Реализовать `Wish` entity + `WishAr` + `WishRepo` (интерфейс) + `WishJsonRepo`
- [ ] Task: Conductor - Ручная верификация 'Wish агрегат и repo'

## Фаза 2: UC express-wish + ER record-wish

- [ ] Task: Написать падающие тесты на `express-wish` (мгновенно / через анкету / конфликт) и `record-wish` ER
- [ ] Task: Реализовать `express-wish` (2 ветки) + `record-wish` ER + пул/конфиг `wish-questionnaire`
- [ ] Task: Conductor - Ручная верификация 'express-wish и record-wish'

## Фаза 3: UC cancel-wish

- [ ] Task: Написать падающие тесты на `cancel-wish`
- [ ] Task: Реализовать `cancel-wish`
- [ ] Task: Conductor - Ручная верификация 'cancel-wish'

## Фаза 4: Удаление onboarding + регистрация

- [ ] Task: Удалить старый код анкет onboarding, переименовать пакет в `@u7-scl/wish`
- [ ] Task: Обновить `create-api-app.ts`, `u7-bot-app-meta.ts`, удалить onboarding-контроллер и e2e-тест
- [ ] Task: Зарегистрировать `WishApiModule` (useCases + reactions) в ApiApp
- [ ] Task: Conductor - Ручная верификация 'Удаление onboarding и регистрация wish'
