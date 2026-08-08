# План реализации — Трек 5: Контроллер `learning`

---

## Фаза 1: Подготовка структуры и разделение learning.story.ts

- [ ] Task: Создать структуру папок `learning/` в `apps/u7-bot/src/`
    - [ ] Создать `learning/controller.ts` (скелет)
    - [ ] Создать `learning/ui-spec.md` (на основе `packages/stream/src/ui/bot/ui-spec.md`)
    - [ ] Создать директорию `learning/stories/`

- [ ] Task: Разделить `learning.story.ts` → `hub.ts`
    - [ ] Написать тесты для `hub.ts`
    - [ ] Выделить хаб (главное меню обучения, список потоков) в `hub.ts`
    - [ ] Убедиться, что тесты проходят

- [ ] Task: Разделить `learning.story.ts` → `step-view.ts`
    - [ ] Написать тесты для `step-view.ts`
    - [ ] Выделить просмотр/прохождение шага (S05a) в `step-view.ts`
    - [ ] Убедиться, что тесты проходят

- [ ] Task: Разделить `learning.story.ts` → `nav-tree.ts`
    - [ ] Написать тесты для `nav-tree.ts`
    - [ ] Выделить дерево уроков с ✅/▶️/🔒 (S05b) в `nav-tree.ts`
    - [ ] Интегрировать с `shared/tree-renderer.ts`
    - [ ] Убедиться, что тесты проходят

- [ ] Task: Разделить `learning.story.ts` → `transition.ts`
    - [ ] Написать тесты для `transition.ts`
    - [ ] Выделить завершение урока/проекта/потока (S05c) в `transition.ts`
    - [ ] Убедиться, что тесты проходят

- [ ] Task: Разделить `learning.story.ts` → `progress.ts`
    - [ ] Написать тесты для `progress.ts`
    - [ ] Выделить прогресс студента (S06) в `progress.ts`
    - [ ] Убедиться, что тесты проходят

- [ ] Task: Перенести `enroll.story.ts` → `enroll.ts`
    - [ ] Написать тесты для `enroll.ts`
    - [ ] Перенести и адаптировать запись с кодовым словом (S10) в `enroll.ts`
    - [ ] Убедиться, что тесты проходят

- [ ] Task: Выделить общие хелперы
    - [ ] Проанализировать: `learning/shared.ts` или protected-методы
    - [ ] Вынести общую логику

- [ ] Task: Conductor - User Manual Verification 'Подготовка структуры и разделение learning.story.ts' (Protocol in workflow.md)

---

## Фаза 2: Интеграция контроллера

- [ ] Task: Реализовать `LearningController`
    - [ ] Написать тесты для контроллера
    - [ ] Реализовать `controller.ts` — реестр из 6 стори
    - [ ] Настроить видимость: только STUDENT

- [ ] Task: Подключить контроллер в `create-ui-app.ts`
    - [ ] Зарегистрировать `LearningController`
    - [ ] Кнопка «🎓 Моя учёба» в главном меню

- [ ] Task: Заменить `cbFor()` на `getAction<T>(name)` во всех стори
    - [ ] Исправить `StreamPolicy.canEnroll` в `packages/stream/src/domain/stream/policy.ts` — `!UserPolicy.isStudent(actor)` вместо `isGuest || isCandidate`
    - [ ] Обновить тесты `policy.test.ts`
    - [ ] Восстановить кнопку «📝 Записаться» через `getAction<EnrollActions>('enroll')(streamId)`
    - [ ] Проверить: кнопка видна гостю, кандидату, ментору, автору, админу — но не студенту
    - [ ] Обновить кросс-ссылки на `view-stream`, `monitor`

- [ ] Task: Обновить `learning/ui-spec.md`
    - [ ] Описать все 6 экранов с актуальными callback-кодами

- [ ] Task: Conductor - User Manual Verification 'Интеграция контроллера' (Protocol in workflow.md)

---

## Фаза 3: Тестирование и миграция

- [ ] Task: Перенести unit-тесты в `apps/u7-bot/src/controllers/learning/stories/`
    - [ ] `enroll.story.test.ts` → `enroll.test.ts`
    - [ ] Все тесты проходят

- [ ] Task: Создать/перенести integration-тесты в `apps/u7-bot/tests/learning/`
    - [ ] Сценарий: хаб → дерево → шаг → завершение
    - [ ] Сценарий: кандидат → запись на поток

- [ ] Task: Обновить E2E-тесты
    - [ ] «Моя учёба» в help — обновить `main-menu.e2e.test.ts`
    - [ ] Кандидат → запись — обновить `curious-showcase.e2e.test.ts`

- [ ] Task: Проверить покрытие и качество
    - [ ] `bun run check` — чисто
    - [ ] Покрытие >80%

- [ ] Task: Conductor - User Manual Verification 'Тестирование и миграция' (Protocol in workflow.md)

---

## Фаза 4: Зачистка

- [ ] Task: Удалить старые файлы
    - [ ] Удалить `learning.story.ts` и `learning.story.test.ts` из `packages/stream/src/ui/bot/stories/`
    - [ ] Удалить `enroll.story.ts` и `enroll.story.test.ts` из `packages/stream/src/ui/bot/stories/`

- [ ] Task: Обновить `conductor/tracks.md` — отметить Трек 5 как выполненный

- [ ] Task: Conductor - User Manual Verification 'Зачистка' (Protocol in workflow.md)
