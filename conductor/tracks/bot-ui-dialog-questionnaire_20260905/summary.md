# Итоговый отчёт — Трек: Анкетные стори (bot-ui-dialog-questionnaire_20260905)

## Цель трека

Миграция анкетных стори (fill, invite, render.ts) домена questionnaire на
контракт «Диалог и Экран» (bot-ui v4) с протоколом «миграция без потери
функциональности»: инвентаризация кнопок/реплик → падающие тесты → перенос.
Трек 4 декомпозиции §9 материнского документа bot-ui-session-architecture.md.

## Выполненные задачи

### Фаза 1 — Анкетные стори

- **Инвентаризация** [a3b2b606]: все кнопки/реплики fill, invite из ui-spec и
  кода зафиксированы в падающих тестах с точными keyboard-ассертами
  (inventory.test.ts — 20 тестов, S01–S06 + resume/current).
- **Поведенческие тесты** [39296f08, 5f2a1f92]: finalize-паттерн, resume,
  awaitInput/release, errorNotify-переспрос, /cancel-confirm, наблюдаемость
  stale (fill.dialog.test.ts — 30+ тестов).
- **Перевод стори** [31a551cc, ce87e7cc]: fill.story/invite.story/render.ts на
  DialogResponse; `respondInContext`-хелперы удалены; /cancel активного fill —
  подтверждение прерывания (решение владельца 2026-09-10); шапка «Анкета
  завершена» на completed-экране по ui-spec S04.

### Фаза 2 — Подписки fill-событий и приглашения (вариант A)

- **Takeover-подписки → notify/invite** [31a551cc]: fill-события
  (start/abandon-warning/continue-invite/abandon) переведены на новый контракт.
- **Приглашения по варианту A** [bcee7858, 31a551cc]: кнопочный проактив —
  временный `ProactiveSender.invite` (штамп текущей эпохи получателя, якорь
  `app/invite` seq=1, кнопки-мосты `fill:resume:<courseId>`, подсказка /start);
  кнопочные ветки фазы 1 перенесены в invite, не срезаны.

### Фаза 3 — Финал

- **Проверки скоупа** [d4ad7610]: lint/tsc/тесты скоупа зелёные, grep-чистота
  (`BotResponse`/`respondInContext`/takeover-подписок в скоупе нет).
- **Миграция e2e** [61a58820]: questionnaire-ux (5 сценариев) и
  wish-questionnaire (7 сценариев B.1–B.7) на DialogResponse. Вход в анкету —
  честный путь клиента: каталог → apply → приглашение → кнопка-мост.
  Takeover-сценарии переписаны: предупреждения больше нет (вариант A),
  добавлен сценарий якоря app/invite. Все 12 сценариев сохранены (сверка по
  списку). Стенд TestBotTransport дополнен `dialogOf`/`dropSession`.
- **Попутный фикс ядра** [58c85f69]: `BotController.handleMessage` и
  stop-ответы `handleCommand` не префиксовали коды кнопок именем контроллера —
  кнопки экранов из ответов на текстовый ввод и /cancel-confirm были мертвы
  («Неизвестная команда»). Поймано e2e, покрыто юнит-тестами ядра, записано в
  базу troubleshoot (`bot-controller-response-prefix.md`).
- **Сверка ui-spec.md**: блоки анкеты (S01–S10, жизненный цикл, качество)
  соответствуют коду. Единственное расхождение — см. «Открытые вопросы».

## Изменённые файлы

- `apps/u7-bot/src/controllers/questionnaire/stories/` — fill.story.ts,
  invite.story.ts, render.ts (переписаны), + 5 тестовых файлов
- `apps/u7-bot/tests/e2e/questionnaire-ux.e2e.test.ts`,
  `wish-questionnaire.e2e.test.ts` — миграция на DialogResponse
- `apps/u7-bot/tests/helpers/test-bot-transport.ts` — dialogOf/dropSession
- `packages/core/src/ui/bot/bot-controller.ts` + тест — фикс префиксации
- `apps/u7-bot/src/controllers/questionnaire/ui-spec.md` — контракт «Диалог и
  Экран», вариант A (фаза 1)
- `conductor/code_styleguides/troubleshoots/bot-controller-response-prefix.md`
  — новая запись базы известных проблем

## Архитектурные решения

- **Finalize-паттерн** (§5.1): стори пишет финальные маркеры сама (`finalize`),
  маркер ретира «Вы выбрали» транспортом не используется для вопросов анкеты.
- **Вариант A приглашений** (§10.12): сервер только зовёт; открытие диалога —
  действие пользователя (кнопка-мост `fill:resume:<courseId>`, switch seq++);
  получателю без диалога транспорт открывает якорь `app/invite` (seq=1) —
  приглашение не умирает. Метод `invite` и якорь — временные (удаляются с
  tasks-system).
- **/cancel с подтверждением** (решение владельца 2026-09-10): прерывание
  только после confirm-экрана S05a, кнопка «Прервать» из S07/S09 ведёт туда же.
- **Ошибки — errorNotify** (warn-реплика): переспрос без перерисовки экрана,
  awaitInput-контекст живёт.

## Отклонения от плана

- Попутно исправлен баг ядра core (префиксация ответов handleMessage/команд) —
  вне скоупа трека, но блокировал зелёность e2e скоупа. Решение зафиксировано
  тестами ядра и записью в troubleshoot-базе.

## Открытый вопрос владельцу (сверка ui-spec)

«Путь пользователя» в questionnaire/ui-spec.md описывает два входа: приглашение
S01 и «запись на модуль». Код также зовёт анкетой при **записи на курс**
(apply «🎓 Хочу пройти курс» → приглашение «Для вас подготовлена анкета —
заполните, пожалуйста» + кнопка «▶️ Заполнить анкету», fill.story
#handleStartEvent). Спек этот экран не описывает; courses/ui-spec W02 говорит
«запускается анкета» без деталей. Предложение: дополнить «Путь пользователя»
строкой про запись на курс (кнопка apply в каталоге) — жду решения владельца.

## Итог триажа (гейт качества закрытия трека)

Полный прогон `CI=true bun test` по репозиторию: **1975 pass / 59 fail**.

Все 59 падений — mentor-домен (MonitorStory 52, CreateStreamStory 30*,
ViewStreamMentorStory 16*, mentor-management e2e 14*, CreateStream Wizard 6*
— числа с дублированием вывода bun; фактических 59): контроллер, стори и e2e
на старом контракте. Это **промежуточное состояние**, а не регресс: трек-владелец
`bot-ui-dialog-mentor_20260905` (фаза 1 его плана — миграция mentor-стори и
тестов, фаза 2 — демонтаж старых типов и весь репозиторий зелёный).
tsc-ошибки вне скоупа трека 4 — только mentor-файлы и `create-ui-app.ts` /
`curious-showcase` (тип MentorController) — тот же трек 5.

Скоуп трека 4: lint, tsc, тесты — зелёные; e2e анкеты — 12/12.

## Известные ограничения

- `ProactiveSender.invite` и якорь `app/invite` — временные (ФР-6), удаляются
  с приходом модуля tasks-system (спека трека).
- Сессии в памяти процесса: рестарт сервиса теряет диалоги — персистентность
  в треке bot-ui-session-persist.
- Sweep-механика домена questionnaire не менялась (за рамками трека).
