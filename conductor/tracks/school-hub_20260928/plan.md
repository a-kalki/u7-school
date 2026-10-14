# План реализации: Хаб «Школа» (school-hub)

> Методология — [workflow.md](../../workflow.md): TDD (Red → Green → Refactor),
> гейт из трёх проверок (`lint` + `tslint` + `test`), протокол завершения фазы.

---

## Фаза 1: Контроллер `school` и карточка школы (SH01) [checkpoint: fbb09b5]

- [x] Task: Тесты `SchoolHubStory`: карточка показывает имя, описание и менторов
      (резолв uuid → имена); пустой список менторов — строка не выводится. [1557a05]
- [x] Task: Создать `apps/u7-bot/src/controllers/school/` — `SchoolController`
      и `SchoolHubStory` (карточка SH01, кнопки `📚 Потоки · 💬 Отзывы ·
      ℹ️ Инфо · 💬 Сообщество · ↩️ Главное меню`). [42ff340]
- [x] Task: Зарегистрировать `SchoolController` в сборке приложения (`create-ui-app`). [52c1c91]
- [x] Task: Взять данные из `school` резолвера; экспорт `ui-spec.md` контроллера. [7449346]
- [x] Task: Conductor - User Manual Verification 'Фаза 1: Контроллер school и карточка' (Protocol in workflow.md) [fbb09b5]

## Фаза 2: Экран «Инфо» (SH02)

- [x] Task: Тесты SH02: имя, описание, адрес, телефон; сайт задан/не задан (заглушка). [5edfd25]
- [x] Task: Реализовать экран «Инфо» и возврат в хаб. [939b50d]
- [x] Task: Conductor - User Manual Verification 'Фаза 2: Экран Инфо' (Protocol in workflow.md) [008a0df]

## Фаза 3: «Сообщество» (перенос)

- [x] Task: Тесты: кнопка сообщества в хабе ведёт по `school.communityGroup.url`. [1d7b8f6]
- [x] Task: Перенести `CommunityStory` из `AppController` в `SchoolController`
      (убрать кнопку из главного меню). [b4e9ad8]
- [x] Conductor - User Manual Verification 'Фаза 3: Сообщество' [56f586c9]

## Фаза 4: «Потоки» (перенос каталога)

- [x] Task: Тесты: кнопка `📚 Потоки` открывает каталог потоков; возврат «⬅️ Назад в школу». [0372543]
- [x] Task: Кнопка хаба делегирует в `CatalogStory`; убрать вход из главного меню;
      скорректировать кнопку возврата каталога. [08f3e34]
- [x] Task: Обновить тексты путей записи (`wish-invite.story.ts`,
      `streams/ui-spec.md` S11) на `🏫 Школа → 📚 Потоки` + тесты. [46ea977]
- [x] Conductor - User Manual Verification 'Фаза 4: Потоки' [b3aaec8e]

## Фаза 5: Потоки школы и «Отзывы»

- [x] Task: `Stream.schoolId` — тесты схемы, создания потока, фильтра `list-streams`. [042a426]
- [x] Task: Реализовать `schoolId` в домене потока (значение — `appResolver.school.id`
      при создании) и фильтр `schoolId` в `list-streams`. [ffff2c5]
- [x] Task: Скрипт `scripts/migrate-streams-school-id.ts` (идемпотентный) — проставляет
      `schoolId` существующим потокам. [b32ba33]
- [x] Task: Migration-секция в `CHANGELOG` для релиза `0.2.0`: что нужно сделать на
      проде — остановить бота, сделать бэкап `data/streams/`, прогнать миграцию,
      запустить с `--env production` (на работающем старом коде мигрировать нельзя:
      valibot отбрасывает неизвестные поля). Порядок и способ выполнения — на усмотрение
      агента деплоя; запуск с подтверждением владельца. [b32ba33]
- [x] Task: Расширить `list-scope-reviews`: `scopeId` → `scopeIds: string[]` (+ фильтр
      `direction`), `scopeId` в DTO отзыва; обновить существующего потребителя
      (`scope-reviews.story`, передаёт `[scopeId]`) и его тесты. [b7df9dc]
- [x] Task: Тесты сбора отзывов по потокам школы (student→mentor): непустой/пустой срез,
      пагинация. [d6b549a]
- [x] Task: Реализовать экран «Отзывы»: `list-streams({ schoolId })` → `scopeIds` →
      `list-scope-reviews`. [02717bc]
- [x] Task: Conductor - User Manual Verification 'Фаза 5: Отзывы' (Protocol in workflow.md) [02717bc]

## Фаза 6: Главное меню и название «Курсы»

- [x] Task: Тесты меню: `🏫 Школа`=priority 10, `📖 Курсы`=priority 12; нет
      `📚 Потоки курсов` и `💬 Сообщество школы`; личные `💬 Отзывы` (25) остаются. [0c84e39]
- [x] Task: Реализовать: переименовать каталог курсов → `📖 Курсы` с priority 12,
      добавить `🏫 Школа`, убрать перенесённые кнопки. [4af5485]
- [x] Task: Обновить `courses/ui-spec.md` и `courses/content-nav.md` под новый маршрут
      и название «Курсы». [02fd945]
- [x] Task: Обновить e2e-тесты меню (`tests/e2e/main-menu.e2e.test.ts`,
      `tests/e2e/curious-showcase.e2e.test.ts`) под `🏫 Школа` / `📖 Курсы`
      и перенесённые входы. [a8cf9e5]
- [x] Task: Conductor - User Manual Verification 'Фаза 6: Главное меню' (Protocol in workflow.md) [53fc197]

## Фаза 7: Финал — гейт и документация

- [x] Task: Полный прогон `bun run check` (lint + tslint + test), триаж красных.
- [x] Task: Обновить conductor-документацию (`schools-system.md`, `tracks.md`,
      `streams/ui-spec.md` — новый вход). [6ead66f]
- [x] Task: `summary.md` трека. [e7a813d]
- [ ] Task: Conductor - User Manual Verification 'Фаза 7: Финал' (Protocol in workflow.md)
