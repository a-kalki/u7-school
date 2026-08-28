# План реализации — wish: интеграционные и e2e тесты пользовательского пути

## Фаза 1: Инфраструктура — тестовое приложение и фикстуры [checkpoint: d74788e]

- [x] Task: Расширить `tests/helpers/test-app.ts` — d74788e: WishJsonRepo + WishApiModule, QuestionnaireJsonRepo + QuestionnaireApiModule + фасады (зеркально `create-api-app.ts`); экспорт `wishRepo`, `questionnaireModule`, `questionnaireFacade`, общего `eventBus`
    - [x] Проверить, что существующие integration/e2e тесты не сломались (не используют новые модули — им безразлично) — d74788e (полный check 1618 pass)
- [x] Task: Расширить `tests/helpers/test-bot-transport.ts`: общий eventBus (параметр) + вызов `uiApp.subscribeEvents()` — d74788e
- [x] Task: Добавить в шаблон фикстур курс `dddddddd-dddd-4ddd-8ddd-dddddddddddd` с опасным названием (спецсимволы MarkdownV2), published, phases → модуль `a0a0a0a0` — d74788e
- [x] Task: Добавить в `packages/wish/src/domain/wish/pools/course.json` малый пул (3 вопроса: choice → text → choice) для курса `dddddddd`; проверить зелёным `CI=true bun test packages/wish` (валидация схемы пула) — d74788e
- [ ] Task: Conductor - Ручная верификация 'Инфраструктура тестов'

## Фаза 2: Интеграционные тесты instant-ветки (A) [checkpoint: 23d0a65]

- [x] Task: Написать `tests/courses/wish-flow.integration.test.ts`: apply → W03 (`expressed` в репо), повторный apply → W04 expressed с кнопкой отмены — 23d0a65
- [x] Task: Тесты цикла отмены: подтверждение-экран; «❌ Отмена» → phases без изменения статуса; «✅ Да» → сообщение + `cancelled` в репо; apply после отмены → снова W03; двойное «✅ Да» → мягкое «уже нет» — 23d0a65
- [x] Task: Тест W04 confirmed (confirmed-желание через wishRepo напрямую): текст «обучаешься», отмена из confirmed → `cancelled` — 23d0a65
- [x] Task: Тест экранирования: draft-курс с опасным названием (карточка) + published-фикстурный курс `eeeeeeee` (полный цикл apply→W05) — все ответы `assertBotResponseValid` — 23d0a65. Попутно исправлен найденный тестами баг домена (getByUserAndTarget/findAllByUserAndTarget, см. troubleshoot-запись)
- [x] Task: Прогон `CI=true bun run check:a u7-bot` — зелёный; полный `CI=true bun run check`: 1625 pass / 0 fail — 23d0a65
- [ ] Task: Conductor - Ручная верификация 'Интеграционные тесты instant-ветки'

## Фаза 3: E2E тесты анкетной ветки (B) [checkpoint: c6555ab]

- [x] Task: Написать `tests/e2e/wish-questionnaire.e2e.test.ts` (каркас: CoursesController + QuestionnaireController + общий eventBus): apply на курс `dddddddd` → пустой ответ стори + проактивный первый вопрос («Вопрос 1 из 3», подсказка /cancel, captureInput) в `transport.api.sentMessages` — c6555ab
- [x] Task: Тест опасного ответа: text-вопрос с ответом «Да. Конечно - (тест) #1! +2=2» → бот не падает, «Вопрос 2 из 3» без подсказки, markdown-safe — c6555ab
- [x] Task: Тест abandon/resume: /cancel → `abandoned` в репо (ER); apply → W04 pending → «Продолжить анкету» → resume → тот же вопрос + captureInput; resume без анкеты → контролируемый ответ без ⚠️ — c6555ab
- [x] Task: Тест полного прохождения: все 3 вопроса → completed-экран с completionText из пула, `confirmed` в репо (ER confirm-wish); apply → W04 confirmed → отмена → `cancelled` — c6555ab
- [x] Task: Прогон полного `CI=true bun run check` — зелёный; при падениях кода чинить причину — c6555ab (тесты 1632 pass, tsc зелёный; найдено 4 бага и исправлено, см. git note; в чужом коммите f84b6681 остался unused import — сообщено пользователю)
- [ ] Task: Conductor - Ручная верификация 'E2E тесты анкетной ветки'

## Фаза 4: Финализация

- [x] Task: Ревью покрытия: сверить ветки spec.md (A.1–A.7, B.1–B.7) с фактически написанными тестами — af8503cb (полное покрытие; восполнен пробел A.7 — прогон list с опасным названием)
- [ ] Task: Контрольная точка: коммит + git note с отчётом
- [ ] Task: Conductor - Ручная верификация 'Финал трека'
