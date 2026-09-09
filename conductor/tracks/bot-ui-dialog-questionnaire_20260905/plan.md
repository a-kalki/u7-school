# План реализации — Трек: Анкетные стори (bot-ui-dialog-questionnaire_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: Анкетные стори

- [ ] Task: Написать падающие тесты fill/invite (`render.ts`) на `DialogResponse`: паттерн `finalize` («зафиксируй выбор → следующий вопрос»), resume, `awaitInput`/`release`; валидация ответов — `errorNotify` (переспрос, ввод живёт)
- [ ] Task: Перевести стори; удалить `respondInContext`-хелперы `render.ts`; команды — контракт `U7BotUiStory` (`/cancel` активного — сброс себя, прочее — pass)
- [ ] Conductor - User Manual Verification 'Анкетные стори' (Protocol in workflow.md)

## Фаза 2: Подписки fill-событий и приглашения (вариант A)

- [ ] Task: Takeover-подписки fill-событий → notify-текст; подписки на кнопки умирают; обновить тесты
- [ ] Task: Приглашения (`questionnaire:invite` S01, continue-invite, abandon-warning, fill.start из каталога) — временный `ProactiveSender.invite` по варианту A: штамп текущей эпохи получателя, якорь `app/invite` (без диалога), кнопка-мост `fill:resume:<id>`, подсказка /start; тесты на обе ветки (с диалогом и без)
- [ ] Conductor - User Manual Verification 'Подписки' (Protocol in workflow.md)

## Фаза 3: Финал трека 4

- [ ] Task: Проверки скоупа зелёные; grep-чистота
- [ ] Task: Обновить блоки `ui-spec.md`; создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
