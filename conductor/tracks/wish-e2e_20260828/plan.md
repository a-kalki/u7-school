# План реализации — wish: интеграционные и e2e тесты пользовательского пути

## Фаза 1: Инфраструктура — тестовое приложение и фикстуры

- [ ] Task: Расширить `tests/helpers/test-app.ts`: WishJsonRepo + WishApiModule, QuestionnaireJsonRepo + QuestionnaireApiModule + фасады (зеркально `create-api-app.ts`); экспорт `wishRepo`, `questionnaireModule`, `questionnaireFacade`, общего `eventBus`
    - [ ] Проверить, что существующие integration/e2e тесты не сломались (не используют новые модули — им безразлично)
- [ ] Task: Расширить `tests/helpers/test-bot-transport.ts`: общий eventBus (параметр) + вызов `uiApp.subscribeEvents()`
- [ ] Task: Добавить в шаблон фикстур курс `dddddddd-dddd-4ddd-8ddd-dddddddddddd` с опасным названием (спецсимволы MarkdownV2), published, phases → модуль `a0a0a0a0`
- [ ] Task: Добавить в `packages/wish/src/domain/wish/pools/course.json` малый пул (3 вопроса: choice → text → choice) для курса `dddddddd`; проверить зелёным `CI=true bun test packages/wish` (валидация схемы пула)
- [ ] Task: Conductor - Ручная верификация 'Инфраструктура тестов'

## Фаза 2: Интеграционные тесты instant-ветки (A)

- [ ] Task: Написать `tests/courses/wish-flow.integration.test.ts`: apply → W03 (`expressed` в репо), повторный apply → W04 expressed с кнопкой отмены
- [ ] Task: Тесты цикла отмены: подтверждение-экран; «❌ Отмена» → phases без изменения статуса; «✅ Да» → сообщение + `cancelled` в репо; apply после отмены → снова W03; двойное «✅ Да» → мягкое «уже нет»
- [ ] Task: Тест W04 confirmed (confirmed-желание через wishRepo напрямую): текст «обучаешься», отмена из confirmed → `cancelled`
- [ ] Task: Тест экранирования: курс с опасным названием через `create-course` → list/карточка/apply/W03/W04 — все ответы `assertBotResponseValid`
- [ ] Task: Прогон `CI=true bun run check:a u7-bot` — зелёный; при падениях кода чинить причину
- [ ] Task: Conductor - Ручная верификация 'Интеграционные тесты instant-ветки'

## Фаза 3: E2E тесты анкетной ветки (B)

- [ ] Task: Написать `tests/e2e/wish-questionnaire.e2e.test.ts` (каркас: CoursesController + QuestionnaireController + общий eventBus): apply на курс `dddddddd` → пустой ответ стори + проактивный первый вопрос («Вопрос 1 из 3», подсказка /cancel, captureInput) в `transport.api.sentMessages`
- [ ] Task: Тест опасного ответа: text-вопрос с ответом «Да. Конечно - (тест) #1! +2=2» → бот не падает, «Вопрос 2 из 3» без подсказки, markdown-safe
- [ ] Task: Тест abandon/resume: /cancel → `abandoned` в репо (ER); apply → W04 pending → «Продолжить анкету» → resume → тот же вопрос + captureInput; resume без анкеты → контролируемый ответ без ⚠️
- [ ] Task: Тест полного прохождения: все 3 вопроса → completed-экран с completionText из пула, `confirmed` в репо (ER confirm-wish); apply → W04 confirmed → отмена → `cancelled`
- [ ] Task: Прогон полного `CI=true bun run check` — зелёный; при падениях кода чинить причину
- [ ] Task: Conductor - Ручная верификация 'E2E тесты анкетной ветки'

## Фаза 4: Финализация

- [ ] Task: Ревью покрытия: сверить ветки spec.md (A.1–A.7, B.1–B.7) с фактически написанными тестами
- [ ] Task: Контрольная точка: коммит + git note с отчётом
- [ ] Task: Conductor - Ручная верификация 'Финал трека'
