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

- [ ] Task: Реализовать `MentorController`
    - [ ] Написать тесты для контроллера
    - [ ] Реализовать `controller.ts` — реестр из 6 стори
    - [ ] Настроить видимость: только MENTOR, ADMIN

- [ ] Task: Подключить контроллер в `create-ui-app.ts`
    - [ ] Зарегистрировать `MentorController`
    - [ ] Кнопка «🛠️ Инструменты ментора» в главном меню

- [ ] Task: Заменить `cbFor()` на `getAction<T>(name)` во всех стори
    - [ ] Восстановить кнопку «👥 Студенты» через `getAction<MonitorActions>('students')(streamId)`
    - [ ] Обновить кросс-ссылки между менторскими стори

- [ ] Task: Обновить `mentor/ui-spec.md`
    - [ ] Описать все экраны с актуальными callback-кодами

- [ ] Task: Conductor - User Manual Verification 'Интеграция контроллера' (Protocol in workflow.md)

---

## Фаза 3: Тестирование и миграция

- [ ] Task: Перенести unit-тесты в `apps/u7-bot/src/controllers/mentor/stories/`
    - [ ] 6 тестовых файлов рядом с исходниками
    - [ ] Все тесты проходят

- [ ] Task: Создать/перенести integration-тесты в `apps/u7-bot/tests/mentor/`
    - [ ] Сценарий: ментор → список потоков → карточка → студенты
    - [ ] Сценарий: создание и активация потока
    - [ ] Сценарий: «Назад» после активации → `view-stream-mentor`

- [ ] Task: Обновить E2E-тесты
    - [ ] Студенты → список — обновить `curious-showcase.e2e.test.ts`

- [ ] Task: Проверить покрытие и качество
    - [ ] `bun run check` — чисто
    - [ ] Покрытие >80%

- [ ] Task: Conductor - User Manual Verification 'Тестирование и миграция' (Protocol in workflow.md)

---

## Фаза 4: Зачистка

- [ ] Task: Удалить старые файлы из `packages/stream/src/ui/bot/stories/`
    - [ ] `mentor-tools.story.ts` + тест
    - [ ] `view-stream-mentor.story.ts` + тест
    - [ ] `monitor.story.ts` + тест
    - [ ] `progress.story.ts` + тест
    - [ ] `create-stream.story.ts` + тест
    - [ ] `activate-stream.story.ts` + тест

- [ ] Task: Обновить `conductor/tracks.md` — отметить Трек 6 как выполненный

- [ ] Task: Conductor - User Manual Verification 'Зачистка' (Protocol in workflow.md)
