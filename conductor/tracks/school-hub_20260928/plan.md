# План реализации: Хаб «Школа» (school-hub)

> Методология — [workflow.md](../../workflow.md): TDD (Red → Green → Refactor),
> гейт из трёх проверок (`lint` + `tslint` + `test`), протокол завершения фазы.

---

## Фаза 1: Контроллер `school` и карточка школы (SH01)

- [ ] Task: Тесты `SchoolHubStory`: карточка показывает имя, описание и менторов
      (резолв uuid → имена); пустой список менторов — строка не выводится.
- [ ] Task: Создать `apps/u7-bot/src/controllers/school/` — `SchoolController`
      и `SchoolHubStory` (карточка SH01, кнопки `📚 Потоки · 💬 Отзывы · ℹ️ Инфо ·
      💬 Сообщество · ↩️ Главное меню`).
- [ ] Task: Зарегистрировать `SchoolController` в сборке приложения (`create-ui-app`).
- [ ] Task: Взять данные из `school` резолвера; экспорт `ui-spec.md` контроллера.
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Контроллер school и карточка' (Protocol in workflow.md)

## Фаза 2: Экран «Инфо» (SH02)

- [ ] Task: Тесты SH02: имя, описание, адрес, телефон; сайт задан/не задан (заглушка).
- [ ] Task: Реализовать экран «Инфо» и возврат в хаб.
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Экран Инфо' (Protocol in workflow.md)

## Фаза 3: «Сообщество школы» (перенос)

- [ ] Task: Тесты: кнопка сообщества в хабе ведёт по `school.communityGroup.url`.
- [ ] Task: Перенести `CommunityStory` из `AppController` в `SchoolController`
      (убрать кнопку из главного меню).
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Сообщество школы' (Protocol in workflow.md)

## Фаза 4: «Потоки» (перенос каталога)

- [ ] Task: Тесты: кнопка `📚 Потоки` открывает каталог потоков; возврат «⬅️ Назад в школу».
- [ ] Task: Кнопка хаба делегирует в `CatalogStory`; убрать вход из главного меню;
      скорректировать кнопку возврата каталога.
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Потоки' (Protocol in workflow.md)

## Фаза 5: «Отзывы» (простой срез о менторах школы)

- [ ] Task: Тесты: срез собирает отзывы студентов о менторах для потоков школы;
      пустой срез — корректный экран; пагинация.
- [ ] Task: Реализовать экран «Отзывы» на `list-scope-reviews` по потокам школы
      (фильтр student→mentor).
- [ ] Task: Conductor - User Manual Verification 'Фаза 5: Отзывы' (Protocol in workflow.md)

## Фаза 6: Главное меню

- [ ] Task: Тесты меню: есть `🏫 Школа` и `📖 Курсы`; нет `📚 Потоки курсов` и
      `💬 Сообщество школы`; `💬 Отзывы` остаётся.
- [ ] Task: Реализовать: переименовать каталог курсов → `📖 Курсы`, добавить
      `🏫 Школа`, убрать перенесённые кнопки.
- [ ] Task: Conductor - User Manual Verification 'Фаза 6: Главное меню' (Protocol in workflow.md)

## Фаза 7: Финал — гейт и документация

- [ ] Task: Полный прогон `bun run check` (lint + tslint + test), триаж красных.
- [ ] Task: Обновить conductor-документацию (`schools-system.md`, `tracks.md`,
      `streams/ui-spec.md` — новый вход).
- [ ] Task: `summary.md` трека.
- [ ] Task: Conductor - User Manual Verification 'Фаза 7: Финал' (Protocol in workflow.md)
