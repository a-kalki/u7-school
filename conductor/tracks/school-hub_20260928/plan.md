# План реализации: Хаб «Школа» (school-hub)

> Методология — [workflow.md](../../workflow.md): TDD (Red → Green → Refactor),
> гейт из трёх проверок (`lint` + `tslint` + `test`), протокол завершения фазы.

---

## Фаза 1: Контроллер `school` и карточка школы (SH01)

- [ ] Task: Тесты `SchoolHubStory`: карточка показывает имя, описание и менторов
      (резолв uuid → имена); пустой список менторов — строка не выводится.
- [ ] Task: Создать `apps/u7-bot/src/controllers/school/` — `SchoolController`
      и `SchoolHubStory` (карточка SH01, кнопки `📚 Потоки · 💬 Отзывы ·
      ℹ️ Инфо · 💬 Сообщество · ↩️ Главное меню`).
- [ ] Task: Зарегистрировать `SchoolController` в сборке приложения (`create-ui-app`).
- [ ] Task: Взять данные из `school` резолвера; экспорт `ui-spec.md` контроллера.
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Контроллер school и карточка' (Protocol in workflow.md)

## Фаза 2: Экран «Инфо» (SH02)

- [ ] Task: Тесты SH02: имя, описание, адрес, телефон; сайт задан/не задан (заглушка).
- [ ] Task: Реализовать экран «Инфо» и возврат в хаб.
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Экран Инфо' (Protocol in workflow.md)

## Фаза 3: «Сообщество» (перенос)

- [ ] Task: Тесты: кнопка сообщества в хабе ведёт по `school.communityGroup.url`.
- [ ] Task: Перенести `CommunityStory` из `AppController` в `SchoolController`
      (убрать кнопку из главного меню).
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Сообщество' (Protocol in workflow.md)

## Фаза 4: «Потоки» (перенос каталога)

- [ ] Task: Тесты: кнопка `📚 Потоки` открывает каталог потоков; возврат «⬅️ Назад в школу».
- [ ] Task: Кнопка хаба делегирует в `CatalogStory`; убрать вход из главного меню;
      скорректировать кнопку возврата каталога.
- [ ] Task: Обновить тексты путей записи (`wish-invite.story.ts`,
      `streams/ui-spec.md` S11) на `🏫 Школа → 📚 Потоки` + тесты.
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Потоки' (Protocol in workflow.md)

## Фаза 5: Потоки школы и «Отзывы»

- [ ] Task: `Stream.schoolId` — тесты схемы, создания потока, фильтра `list-streams`.
- [ ] Task: Реализовать `schoolId` в домене потока (значение — `appResolver.school.id`
      при создании) и фильтр `schoolId` в `list-streams`.
- [ ] Task: Скрипт `scripts/migrate-streams-school-id.ts` (идемпотентный) — проставляет
      `schoolId` существующим потокам.
- [ ] Task: Migration-секция в `CHANGELOG` для релиза `0.2.0`: что нужно сделать на
      проде — остановить бота, сделать бэкап `data/streams/`, прогнать миграцию,
      запустить с `--env production` (на работающем старом коде мигрировать нельзя:
      valibot отбрасывает неизвестные поля). Порядок и способ выполнения — на усмотрение
      агента деплоя; запуск с подтверждением владельца.
- [ ] Task: Расширить `list-scope-reviews`: `scopeId` → `scopeIds: string[]` (+ фильтр
      `direction`), `scopeId` в DTO отзыва; обновить существующего потребителя
      (`scope-reviews.story`, передаёт `[scopeId]`) и его тесты.
- [ ] Task: Тесты сбора отзывов по потокам школы (student→mentor): непустой/пустой срез,
      пагинация.
- [ ] Task: Реализовать экран «Отзывы»: `list-streams({ schoolId })` → `scopeIds` →
      `list-scope-reviews`.
- [ ] Task: Conductor - User Manual Verification 'Фаза 5: Отзывы' (Protocol in workflow.md)

## Фаза 6: Главное меню и название «Курсы»

- [ ] Task: Тесты меню: `🏫 Школа`=priority 10, `📖 Курсы`=priority 12; нет
      `📚 Потоки курсов` и `💬 Сообщество школы`; личные `💬 Отзывы` (25) остаются.
- [ ] Task: Реализовать: переименовать каталог курсов → `📖 Курсы` с priority 12,
      добавить `🏫 Школа`, убрать перенесённые кнопки.
- [ ] Task: Обновить `courses/ui-spec.md` и `courses/content-nav.md` под новый маршрут
      и название «Курсы».
- [ ] Task: Conductor - User Manual Verification 'Фаза 6: Главное меню' (Protocol in workflow.md)

## Фаза 7: Финал — гейт и документация

- [ ] Task: Полный прогон `bun run check` (lint + tslint + test), триаж красных.
- [ ] Task: Обновить conductor-документацию (`schools-system.md`, `tracks.md`,
      `streams/ui-spec.md` — новый вход).
- [ ] Task: `summary.md` трека.
- [ ] Task: Conductor - User Manual Verification 'Фаза 7: Финал' (Protocol in workflow.md)
