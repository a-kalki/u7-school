# Реестр треков

Порядок миграции bot-ui: 1 → 1.1 → 2 → (3 ∥ 4) → 5 → 6. Декомпозиция — в [bot-ui-session-architecture.md](./bot-ui-session-architecture.md), §9.


- [ ] **Track: Learning-стори (hub, step-view, nav-tree, progress) на новом контракте**
*Link: [./tracks/bot-ui-dialog-learning_20260905/](./tracks/bot-ui-dialog-learning_20260905/)*

---

- [ ] **Track: Анкетные стори (fill, invite, render.ts) на новом контракте, finalize-паттерн**
*Link: [./tracks/bot-ui-dialog-questionnaire_20260905/](./tracks/bot-ui-dialog-questionnaire_20260905/)*

---

- [ ] **Track: Mentor-стори и демонтаж старых типов, весь репозиторий зелёный**
*Link: [./tracks/bot-ui-dialog-mentor_20260905/](./tracks/bot-ui-dialog-mentor_20260905/)*

---

- [ ] **Track: Персистентность сессий и shortIds — диалоги переживают перезапуск сервиса**
*Link: [./tracks/bot-ui-session-persist_20260905/](./tracks/bot-ui-session-persist_20260905/)*

---

- [ ] **Кандидат: Групповая регистрация — перенос `group-handler` (регистрация при добавлении в группу школы) в зону app-контроллера**
*Источник: решения владельца при ревизии ФР-4 (трек 1.1, сессия 2026-09-06): регистрация пользователей при добавлении в группу школы — ответственность системного контроллера приложения, как и гост-регистрация на `/start` и `/log_level`. Трек ещё не создан: скоуп и декомпозиция — при планировании.*
