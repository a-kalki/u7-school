# Спецификация — Трек: wish — интеграционные и e2e тесты пользовательского пути

## Обзор

Трек wish-ui_20260814 (кнопка и экраны W01–W05) и предшествующие wish-треки (wish-lifecycle, wish-module — архив) реализовали полный жизненный цикл желания пройти курс: создание (instant / через анкету), конфликты (W04), отмену (W05), ER-реакции на события анкеты (confirm-wish, abandon-wish), resume брошенной анкеты.

**Проблема:** весь этот путь покрыт только unit-тестами с моками (`appApi.execute` подменён моком, событийная шина не задействована, FillStory не в контуре). Ни один тест не проверяет сквозную связь:

```
UI (story) → appApi → UC wish → домен wish → событие (eventBus)
  → FillStory (проактивный рендер) → ответы → домен questionnaire
  → ER confirm/abandon-wish → статус в репозитории → UI (W03/W04/W05)
```

**Цель:** покрыть все основные ветки пользовательского пути wish интеграционными тестами (реальный ApiApp с реальными репозиториями на временных файлах + реальный TestBotTransport) и e2e-тестами (полный контур включая QuestionnaireController, событийную шину, проактивный рендер, captureInput).

## Функциональные требования

### 1. Тестовая инфраструктура

- `tests/helpers/test-app.ts`: добавить модули `WishApiModule` (репозиторий `${dbDir}/wish/wishes.json`) и `QuestionnaireApiModule` (репозиторий `${dbDir}/questionnaires/q-questionnaires.json`) — зеркально боевому `create-api-app.ts` (тот же состав резолверов). Наружу экспортировать: `wishRepo`, `questionnaireModule`, `questionnaireFacade`, общий `eventBus`.
- `tests/helpers/test-bot-transport.ts`: принимать общий `eventBus` (тот же экземпляр, что в apiApp) и вызывать `uiApp.subscribeEvents()` — иначе события `questionnaire:start`/`invite` не долетают до `FillStory` и проактивный рендер не работает.
- В e2e-тестах в транспорт добавляется `QuestionnaireController` (получает `questionnaireModule` напрямую, как в боевом `create-ui-app.ts`).

### 2. Фикстуры для e2e (малый пул анкеты)

- 11-вопросный пул курса `29adc3be` избыточен для сквозного теста. Добавить в `packages/wish/src/domain/wish/pools/course.json` **малый пул (3 вопроса)** для нового фикстурного курса: вопрос типа `choice` → вопрос типа `text` (для проверки опасных ответов) → вопрос типа `choice`. Пул обязан проходить валидацию `QuestionnairePoolSchema` (есть тест `course-pool.test.ts`).
- Добавить в шаблон фикстур (`apps/u7-bot/tests/fixtures/templates/courses/courses.json`) курс с UUID `dddddddd-dddd-4ddd-8ddd-dddddddddddd`, **названием со спецсимволами MarkdownV2** (точки, скобки, дефис, решётка, восклицательный знак, плюс/равно), status `published`, phases со ссылкой на существующий фикстурный модуль.

### 3. Интеграционные тесты (ветка A — instant)

Файл `tests/courses/wish-flow.integration.test.ts`. Реальный ApiApp (с wish-модулем) + TestBotTransport + CoursesController. Проверки статусов — **по фактическому содержимому wishRepo**, не только по текстам:

1. apply на instant-курс (`cccccccc`) → W03, в репо `expressed`.
2. Повторный apply → W04 expressed («уже выразил желание») + кнопка «🗑️ Отменить желание».
3. Отмена: `cancel:{courseId}` → экран подтверждения; «❌ Отмена» → карточка курса (phases), статус не изменился; повторный вход → «✅ Да» → сообщение об отмене, в репо `cancelled`.
4. apply после отмены → снова W03 (создание после `cancelled` разрешено).
5. Двойное подтверждение отмены (устаревший экран) → мягкое сообщение «уже нет», статус не меняется повторно.
6. W04 confirmed: confirmed-желание записать в wishRepo напрямую → apply → текст «обучаешься» + кнопка отмены; отмена из confirmed → `cancelled`.
7. **Экранирование названий:** создать курс с опасным названием через UC `create-course` (как в course-catalog.integration) и прогнать list / карточку / apply / W03 / W04 — каждый ответ через `assertBotResponseValid`.

### 4. E2E тесты (ветка B — анкетная)

Файл `tests/e2e/wish-questionnaire.e2e.test.ts`. Полный контур: CoursesController + QuestionnaireController + общий eventBus. Проверки через `transport.api.sentMessages` (проактивные сообщения) и wishRepo:

1. apply на анкетный курс `dddddddd` → пустой ответ стори + **проактивное** сообщение с первым вопросом, «Вопрос 1 из 3», подсказка `/cancel`, `captureInput: fill`.
2. Ответ на text-вопрос со спецсимволами (`Да. Конечно - (тест) #1! +2=2`) → бот не падает, следующий экран рендерится и markdown-safe; «Вопрос 2 из 3» без подсказки `/cancel`.
3. `/cancel` посреди анкеты → в репо желание `abandoned` (ER abandon-wish), анкета `abandoned`.
4. apply → W04 pending → «▶️ Продолжить анкету» → `fill:resume` → тот же вопрос, captureInput.
5. Ответить на все вопросы → экран completed с `completionText` из пула; в репо желание `confirmed` (ER confirm-wish).
6. apply при confirmed → W04 confirmed («обучаешься») → отмена → подтверждение → `cancelled`, сообщение об отмене.
7. resume без активной анкеты → контролируемый ответ без ⚠️.

## Нефункциональные требования

- Все прогоны: `CI=true bun run check` (линтер + tsc + все тесты) — зелёный.
- Новые тесты не зависят от порядка выполнения (изоляция: `transport.reset()`, временные фикстуры per-файл).
- Асинхронность проактивных сообщений: при необходимости — ожидание появления сообщения в `sentMessages` (poll с таймаутом), не «сон наугад».
- Продовый пул `29adc3be` не трогаем; малый пул — отдельная запись.

## Критерии приёмки

- [ ] `createTestApp` поднимает wish + questionnaire модули; TestBotTransport использует общий eventBus и вызывает `subscribeEvents()`.
- [ ] Интеграционные тесты покрывают ветки A.1–A.7; e2e — B.1–B.7; все зелёные.
- [ ] Статусы желаний проверяются по репозиторию (не только по UI-текстам).
- [ ] Опасные символы в названии курса и в текстовых ответах не ломают рендер (markdown-safe), бот не падает.
- [ ] Полный `CI=true bun run check` зелёный (включая существующие 1618+ тестов).

## За рамками

- Продовые сценарии wish-invite (приглашения при открытии набора) — трек wish-invite_20260827.
- Job-scheduler брошенных анкет — трек job-scheduler_20260827.
- Модульные wishes (`create-module-wish`) — уже покрыты unit-тестами UC, отдельный e2e не требуется.
- Утечки/выделенные транспортные тесты Telegram — вне скоупа.
