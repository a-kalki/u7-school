# План реализации — Трек 5: Контроллер `learning`

---

## Фаза 1: Подготовка структуры и разделение learning.story.ts

- [x] Task: Создать структуру папок `learning/` в `apps/u7-bot/src/`
    - [x] Создать `learning/controller.ts` (скелет)
    - [x] Создать `learning/ui-spec.md` (на основе `packages/stream/src/ui/bot/ui-spec.md`)
    - [x] Создать директорию `learning/stories/`

- [x] Task: Разделить `learning.story.ts` → `hub.ts`
    - [x] Написать тесты для `hub.ts`
    - [x] Выделить хаб (главное меню обучения, список потоков) в `hub.ts`
    - [x] Убедиться, что тесты проходят

- [x] Task: Разделить `learning.story.ts` → `step-view.ts`
    - [x] Написать тесты для `step-view.ts`
    - [x] Выделить просмотр/прохождение шага (S05a) в `step-view.ts`
    - [x] Убедиться, что тесты проходят

- [x] Task: Разделить `learning.story.ts` → `nav-tree.ts`
    - [x] Написать тесты для `nav-tree.ts`
    - [x] Выделить дерево уроков с ✅/▶️/🔒 (S05b) в `nav-tree.ts`
    - [x] Интегрировать с `shared/tree-renderer.ts`
    - [x] Убедиться, что компиляция чистая

- [x] Task: Разделить `learning.story.ts` → `transition.ts`
    - [x] Выделить завершение урока/проекта/потока (S05c) в `transition.ts`
    - [x] Логика форматирования вынесена в `shared.ts`

- [x] Task: Разделить `learning.story.ts` → `progress.ts`
    - [x] Написать тесты для `progress.ts`
    - [x] Выделить прогресс студента (S06) в `progress.ts`
    - [x] Убедиться, что компиляция чистая

- [x] Task: Перенести `enroll.story.ts` → `enroll.ts`
    - [x] Написать тесты для `enroll.ts`
    - [x] Перенести и адаптировать запись с кодовым словом (S10) в `enroll.ts`
    - [x] Убедиться, что компиляция чистая

- [x] Task: Выделить общие хелперы
    - [x] Проанализировать: `learning/shared.ts` — чистые функции + async-хелперы
    - [x] Вынести общую логику

- [ ] Task: Conductor - User Manual Verification 'Подготовка структуры и разделение learning.story.ts' (Protocol in workflow.md)

---

## Фаза 2: Интеграция контроллера

- [x] Task: Реализовать `LearningController`
    - [x] Написать тесты для контроллера
    - [x] Реализовать `controller.ts` — реестр из 6 стори
    - [x] Настроить видимость: только STUDENT

- [x] Task: Подключить контроллер в `create-ui-app.ts`
    - [x] Зарегистрировать `LearningController`
    - [x] Кнопка «🎓 Моя учёба» в главном меню

- [x] Task: Заменить `cbFor()` на `getAction<T>(name)` во всех стори
    - [x] Исправить `StreamPolicy.canEnroll` в `packages/stream/src/domain/stream/policy.ts` — `!UserPolicy.isStudent(actor)` вместо `isGuest || isCandidate`
    - [x] Обновить тесты `policy.test.ts`
    - [x] Восстановить кнопку «📝 Записаться» через `getAction<EnrollActions>('enrollButton')(streamId)`
    - [x] Проверить: кнопка видна гостю, кандидату, ментору, автору, админу — но не студенту
    - [x] Обновить кросс-ссылки на `view-stream`, `monitor`

- [x] Task: Обновить `learning/ui-spec.md`
    - [x] Описать все 6 экранов с актуальными callback-кодами

- [ ] Task: Conductor - User Manual Verification 'Интеграция контроллера' (Protocol in workflow.md)

---

## Фаза 3: Тестирование и миграция

- [x] Task: Перенести unit-тесты в `apps/u7-bot/src/controllers/learning/stories/`
    - [x] Тесты для `hub.ts` — 11 тестов
    - [x] Тесты для `step-view.ts` — 15 тестов
    - [x] Тесты для `nav-tree.ts` — 8 тестов
    - [x] Тесты для `enroll.ts` — 7 тестов
    - [x] Тесты для `progress.ts` — 6 тестов
    - [x] Тесты для `transition.ts` — 2 теста
    - [x] Тесты для контроллера — 4 теста
    - [x] Все 55 тестов проходят

- [x] Task: Создать/перенести integration-тесты в `apps/u7-bot/tests/learning/`
    - [x] `hub.integration.test.ts` — 9 тестов: хаб, шаги, дерево (3 уровня), прогресс, leave-confirm
    - [x] Все тесты проходят через `router.handleCallback` с полным callback_data

- [x] Task: Обновить E2E-тесты
    - [x] «Моя учёба» в help — обновить `main-menu.e2e.test.ts`
    - [x] Кандидат → запись — обновить `curious-showcase.e2e.test.ts`
    - [x] **Новый E2E-сценарий студента** в `main-menu.e2e.test.ts`:
        - главное меню → Моя учёба → хаб (проверка кнопок)
        - хаб → Начать учёбу → просмотр шага → Выполнено (полный цикл)
        - хаб → Уроки → проект → урок → шаги (навигация по дереву)

- [x] Task: Проверить покрытие и качество
    - [x] `tsc --noEmit` — чисто для всех новых файлов
    - [x] `biome check` — чисто для всех новых файлов

- [ ] Task: Conductor - User Manual Verification 'Тестирование и миграция' (Protocol in workflow.md)

---

## Фаза 4: Зачистка

- [x] Task: Удалить старые файлы
    - [x] Удалить `learning.story.ts` и `learning.story.test.ts` из `packages/stream/src/ui/bot/stories/`
    - [x] Удалить `enroll.story.ts` и `enroll.story.test.ts` из `packages/stream/src/ui/bot/stories/`

- [x] Task: Обновить `conductor/tracks.md` — отметить Трек 5 как выполненный

- [ ] Task: Conductor - User Manual Verification 'Зачистка' (Protocol in workflow.md)
