# План реализации — Трек: Learning-стори (bot-ui-dialog-learning_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: Learning-стори

- [ ] Task: Написать падающие тесты hub, step-view, nav-tree, progress на `DialogResponse`: «владеешь экраном — edit», ретир чужих с маркером выбора
- [ ] Task: **Восстановить интерактивность, утерянную треком bot-ui-dialog-nav [7034c7e]:** самовыход «🚪 Покинуть учёбу» (FR-4) — кнопка/действие в меню hub с confirm-диалогом (ex-кнопка проактива inactivity: UC `drop-student`, реплика «Ты покинул учёбу…»); приёмка — сценарий самовыхода проходит из меню, студент исключён из TG-группы (FR-6, кик уже работает)
- [ ] Task: Мигрировать тест-инфраструктуру и тесты домена: `tests/helpers/test-bot-transport.ts` на актуальное API ядра (ex-`collectMainMenu` удалён в треке 1), integration `tests/learning/hub.integration.test.ts` и e2e домена learning — на `DialogResponse`
- [ ] Task: Перевести стори; удалить `editOrSend` из `learning/shared.ts`
- [ ] Conductor - User Manual Verification 'Learning-стори' (Protocol in workflow.md)

## Фаза 2: Финал трека 3

- [ ] Task: Проверки скоупа зелёные; grep-чистота скоупа
- [ ] Task: Обновить блоки `ui-spec.md`; создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
