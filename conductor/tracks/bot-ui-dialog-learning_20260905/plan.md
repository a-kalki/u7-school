# План реализации — Трек: Learning-стори (bot-ui-dialog-learning_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: Learning-стори

- [x] Task: Написать падающие тесты hub, step-view, nav-tree, progress на `DialogResponse`: «владеешь экраном — edit», ретир чужих с маркером выбора [f8abca11]
- [x] Task: **Восстановить интерактивность, утерянную треком bot-ui-dialog-nav [7034c7e]:** самовыход «🚪 Покинуть учёбу» (FR-4) — кнопка/действие в меню hub с confirm-диалогом (ex-кнопка проактива inactivity: UC `drop-student`, реплика «Ты покинул учёбу…»); приёмка — сценарий самовыхода проходит из меню, студент исключён из TG-группы (FR-6, кик уже работает) [3dde84f0]
- [x] Task: Мигрировать тесты домена: integration `tests/learning/hub.integration.test.ts` и e2e домена learning — на `DialogResponse` (тест-стенд `tests/helpers/test-bot-transport.ts` уже на новом контракте — мигрирован треком bot-ui-dialog-nav [6e1147a4], хелперы нажатий готовы: `pressedCode`/`stampedCode` [94fa7a1e]) [4f6009d7]
- [x] Task: Перевести стори; удалить `editOrSend` из `learning/shared.ts` [ddd196e1]
- [x] Conductor - User Manual Verification 'Learning-стори' (Protocol in workflow.md)

## Фаза 2: Финал трека 3

- [x] Task: Проверки скоупа зелёные; grep-чистота скоупа [db5aca61]
- [ ] Task: Обновить блоки `ui-spec.md`; создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
