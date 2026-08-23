# План реализации — Трек 6: Контроллер `mentor`

---

## Фаза 1: Подготовка структуры и перенос стори

- [x] Task: Создать структуру папок `mentor/` в `apps/u7-bot/src/` [c2d8572]
    - [x] Создать `mentor/controller.ts` (скелет)
    - [x] Создать `mentor/ui-spec.md`
    - [x] Создать директорию `mentor/stories/`

- [x] Task: Перенести `submenu.ts` [3a6daa7]
    - [x] Написать тесты для `submenu.ts`
    - [x] Перенести и адаптировать подменю инструментов ментора
    - [x] Убедиться, что тесты проходят

- [x] Task: Перенести `my-streams.ts` [4a15071]
    - [x] Написать тесты для `my-streams.ts`
    - [x] Перенести и адаптировать список потоков ментора
    - [x] Убедиться, что тесты проходят

- [x] Task: Перенести `view-stream-mentor.ts` [b1350f9]
    - [x] Написать тесты для `view-stream-mentor.ts`
    - [x] Проанализировать: наследование vs композиция с `view-stream`
    - [x] Реализовать выбранный подход (наследование, # → protected)
    - [x] Убедиться, что тесты проходят

- [x] Task: Перенести `create-stream.ts` [1871504]
    - [x] Написать тесты для `create-stream.ts`
    - [x] Перенести и адаптировать wizard создания потока (S09)
    - [x] Убедиться, что тесты проходят

- [x] Task: Перенести `activate-stream.ts` [1871504]
    - [x] Написать тесты для `activate-stream.ts`
    - [x] Перенести и адаптировать запуск потока
    - [x] **Исправить баг:** кнопка «Назад» → `cbFor('view-stream-mentor', 'view', streamId)`
    - [x] Убедиться, что тесты проходят

- [x] Task: Перенести `monitor.ts` [1871504]
    - [x] Написать тесты для `monitor.ts`
    - [x] Перенести и адаптировать мониторинг группы (S07/S08)
    - [x] Убедиться, что тесты проходят

- [ ] Task: Conductor - User Manual Verification 'Подготовка структуры и перенос стори' (Protocol in workflow.md)

---

## Фаза 2: Интеграция контроллера

- [x] Task: Реализовать `MentorController` [1871504]
    - [x] Написать тесты для контроллера
    - [x] Реализовать `controller.ts` — реестр из 6 стори
    - [x] Настроить видимость: только MENTOR, ADMIN

- [x] Task: Подключить контроллер в `create-ui-app.ts`
    - [x] Зарегистрировать `MentorController`
    - [x] Кнопка «🛠️ Инструменты ментора» в главном меню

- [x] Task: Заменить `cbFor()` на `getAction<T>(name)` во всех стори
    - [x] Восстановить кнопку «👥 Студенты» через `getAction<MonitorActions>('students')(streamId)`
    - [x] Обновить кросс-ссылки между менторскими стори

- [x] Task: Обновить `mentor/ui-spec.md`
    - [x] Описать все экраны с актуальными callback-кодами

- [ ] Task: Conductor - User Manual Verification 'Интеграция контроллера' (Protocol in workflow.md)

---

## Фаза 3: Тестирование и миграция

- [x] Task: Перенести unit-тесты в `apps/u7-bot/src/controllers/mentor/stories/`
    - [x] 5 тестовых файлов рядом с исходниками (submenu, my-streams, view-stream-mentor, activate-stream, monitor)
    - [x] Все тесты проходят (30 unit + 5 integration = 155 total)

- [x] Task: Создать/перенести integration-тесты в `apps/u7-bot/tests/mentor/`
    - [x] Сценарий: ментор → список потоков → карточка → студенты
    - [x] Сценарий: создание и активация потока (wizard: модули)
    - [x] Сценарий: «Назад» после активации → `view-stream-mentor`

- [x] Task: Обновить E2E-тесты
    - [x] Студенты → список — обновить `curious-showcase.e2e.test.ts`

- [x] Task: Проверить покрытие и качество
    - [x] `tsc --noEmit` — чисто (u7-bot + stream)
    - [x] 155 тестов проходят

- [ ] Task: Conductor - User Manual Verification 'Тестирование и миграция' (Protocol in workflow.md)

---

## Фаза 4: Зачистка

- [x] Task: Удалить старые файлы из `packages/stream/src/ui/bot/stories/`
    - [x] `mentor-tools.story.ts` + тест
    - [x] `view-stream-mentor.story.ts` + тест
    - [x] `monitor.story.ts` + тест
    - [x] `progress.story.ts` + тест
    - [x] `create-stream.story.ts` + тест
    - [x] `activate-stream.story.ts` + тест

- [x] Task: Обновить `conductor/tracks.md` — отметить Трек 6 как выполненный

- [ ] Task: Conductor - User Manual Verification 'Зачистка' (Protocol in workflow.md)
