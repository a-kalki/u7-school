# План реализации — Трек: Анкетные стори (bot-ui-dialog-questionnaire_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: Анкетные стори

- [x] Task: **Инвентаризация кнопок/реплик** fill, invite (`render.ts`) из `ui-spec.md` и кода → зафиксировать в падающих тестах с точными keyboard-ассертами (текст + код каждой кнопки); протокол «миграция без потери функциональности» — решение владельца, ревью трека 3 (см. spec) [a3b2b60]
- [x] Task: Написать падающие тесты fill/invite (`render.ts`) на `DialogResponse`: паттерн `finalize` («зафиксируй выбор → следующий вопрос»), resume, `awaitInput`/`release`; валидация ответов — `errorNotify` (переспрос, ввод живёт) [39296f0]
- [x] Task: Перевести стори; удалить `respondInContext`-хелперы `render.ts`; команды — контракт `U7BotUiStory` (`/cancel` активного — подтверждение прерывания по решению владельца 2026-09-10, прочее — pass) [31a551c]
- [x] Conductor - User Manual Verification 'Анкетные стори' (Protocol in workflow.md)

## Фаза 2: Подписки fill-событий и приглашения (вариант A)

- [x] Task: Takeover-подписки fill-событий → notify-текст; подписки на кнопки умирают — кнопочные ветки из инвентаризации фазы 1 переносятся в `invite` (не срезаются); обновить тесты [31a551c]
- [x] Task: Приглашения (`questionnaire:invite` S01, continue-invite, abandon-warning, fill.start из каталога) — временный `ProactiveSender.invite` по варианту A: штамп текущей эпохи получателя, якорь `app/invite` (без диалога), кнопка-мост `fill:resume:<id>`, подсказка /start; тесты на обе ветки (с диалогом и без) [bcee7858, 31a551c]
- [x] Conductor - User Manual Verification 'Подписки' (Protocol in workflow.md)

## Фаза 3: Финал трека 4

- [x] Task: Проверки скоупа зелёные; grep-чистота [d4ad7610]
- [x] Task: Мигрировать e2e домена анкеты (`questionnaire-ux`, `wish-questionnaire`) на `DialogResponse` [61a58820, 58c85f69]
- [~] Task: Обновить блоки `ui-spec.md`; создать `summary.md` (спек — источник истины: расхождения с кодом — вопрос владельцу, не подгонка спека)
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
