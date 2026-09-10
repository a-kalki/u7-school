# План реализации — Трек: Анкетные стори (bot-ui-dialog-questionnaire_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: Анкетные стори

- [x] Task: **Инвентаризация кнопок/реплик** fill, invite (`render.ts`) из `ui-spec.md` и кода → зафиксировать в падающих тестах с точными keyboard-ассертами (текст + код каждой кнопки); протокол «миграция без потери функциональности» — решение владельца, ревью трека 3 (см. spec) [a3b2b60]
- [x] Task: Написать падающие тесты fill/invite (`render.ts`) на `DialogResponse`: паттерн `finalize` («зафиксируй выбор → следующий вопрос»), resume, `awaitInput`/`release`; валидация ответов — `errorNotify` (переспрос, ввод живёт) [39296f0]
- [~] Task: Перевести стори; удалить `respondInContext`-хелперы `render.ts`; команды — контракт `U7BotUiStory` (`/cancel` активного — сброс себя, прочее — pass)
- [ ] Conductor - User Manual Verification 'Анкетные стори' (Protocol in workflow.md)

## Фаза 2: Подписки fill-событий и приглашения (вариант A)

- [ ] Task: Takeover-подписки fill-событий → notify-текст; подписки на кнопки умирают — кнопочные ветки из инвентаризации фазы 1 переносятся в `invite` (не срезаются); обновить тесты
- [ ] Task: Приглашения (`questionnaire:invite` S01, continue-invite, abandon-warning, fill.start из каталога) — временный `ProactiveSender.invite` по варианту A: штамп текущей эпохи получателя, якорь `app/invite` (без диалога), кнопка-мост `fill:resume:<id>`, подсказка /start; тесты на обе ветки (с диалогом и без)
- [ ] Conductor - User Manual Verification 'Подписки' (Protocol in workflow.md)

## Фаза 3: Финал трека 4

- [ ] Task: Проверки скоупа зелёные; grep-чистота
- [ ] Task: Мигрировать e2e домена анкеты (`questionnaire-ux`, `wish-questionnaire`) на `DialogResponse`
- [ ] Task: Обновить блоки `ui-spec.md`; создать `summary.md` (спек — источник истины: расхождения с кодом — вопрос владельцу, не подгонка спека)
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
