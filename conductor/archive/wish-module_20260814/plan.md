# План реализации — Трек C1: wish модуль (ядро)

## Фаза 1: Агрегат Wish + repo

- [x] Task: Написать падающие тесты на `WishAr` (express/cancel/инварианты) и `WishRepo` (f76a179)
- [x] Task: Реализовать `Wish` entity + `WishAr` + `WishRepo` (интерфейс) + `WishJsonRepo` (f76a179)
- [x] Task: Conductor - Ручная верификация 'Wish агрегат и repo'

## Фаза 2: UC express-wish + ER record-wish

- [x] Task: Написать падающие тесты на `express-wish` (мгновенно / через анкету / конфликт) и `record-wish` ER (f76a179)
- [x] Task: Реализовать `express-wish` (2 ветки) + `record-wish` ER + пул/конфиг `wish-questionnaire` (f76a179)
- [x] Task: Conductor - Ручная верификация 'express-wish и record-wish'

## Фаза 3: UC cancel-wish

- [x] Task: Написать падающие тесты на `cancel-wish` (f76a179)
- [x] Task: Реализовать `cancel-wish` (f76a179)
- [x] Task: Conductor - Ручная верификация 'cancel-wish'

## Фаза 4: Удаление onboarding + регистрация

- [x] Task: Удалить старый код анкет onboarding, переименовать пакет в `@u7-scl/wish` (f76a179)
- [x] Task: Обновить `create-api-app.ts`, `u7-bot-app-meta.ts`, удалить onboarding-контроллер и e2e-тест (f76a179)
- [x] Task: Зарегистрировать `WishApiModule` (useCases + reactions) в ApiApp (f76a179)
- [x] Task: Conductor - Ручная верификация 'Удаление onboarding и регистрация wish'
