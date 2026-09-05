# План реализации — Трек: Анкетные стори (bot-ui-dialog-questionnaire_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: Анкетные стори

- [ ] Task: Написать падающие тесты fill/invite (`render.ts`) на `DialogResponse`: паттерн `finalize` («зафиксируй выбор → следующий вопрос»), resume, `awaitInput`/`release`
- [ ] Task: Перевести стори; удалить `respondInContext`-хелперы `render.ts`
- [ ] Conductor - User Manual Verification 'Анкетные стори' (Protocol in workflow.md)

## Фаза 2: Подписки fill-событий

- [ ] Task: Takeover-подписки fill-событий → notify-текст; подписки на кнопки умирают; обновить тесты
- [ ] Conductor - User Manual Verification 'Подписки' (Protocol in workflow.md)

## Фаза 3: Финал трека 4

- [ ] Task: Проверки скоупа зелёные; grep-чистота
- [ ] Task: Обновить блоки `ui-spec.md`; создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
