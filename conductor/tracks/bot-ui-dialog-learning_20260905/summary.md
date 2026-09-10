# Итоговый отчёт — трек bot-ui-dialog-learning_20260905

## Название и цель

**Learning-стори (hub, step-view, nav-tree, progress) на новом контракте** (трек 3 декомпозиции §9 [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)).

Цель: перевести edit-интенсивную навигацию обучения (хаб, просмотр шага, дерево уроков, прогресс) на контракт «Диалог и Экран» (`DialogResponse`): «владеешь экраном — edit» вместо `editOrSend`, кнопки-мосты с валидным штампом, ретир чужих экранов. Без адаптеров совместимости (правило «трек уменьшает»).

## Выполненные задачи

| SHA | Задача |
|-----|--------|
| f8abca11 | Падающие тесты hub, step-view, nav-tree, progress на `DialogResponse` («владеешь экраном — edit», ретир чужих с маркером выбора) |
| 3dde84f0 | Восстановление интерактивности, утерянной треком bot-ui-dialog-nav [7034c7e]: самовыход «🚪 Покинуть учёбу» (FR-4) из меню хаба с confirm-диалогом + e2e кика из TG-группы (FR-6) |
| 4f6009d7 | Миграция тестов домена: integration `tests/learning/hub.integration.test.ts` и e2e домена learning на новый контракт |
| ddd196e1 | Перевод стори hub/step-view/nav-tree/progress на `DialogResponse`; `editOrSend` удалён из `learning/shared.ts` |
| db5aca61 | Проверки скоупа зелёные; grep-чистота скоупа (фикс organizeImports в hub.ts) |
| 3d705474 | Обновлены `ui-spec.md` (learning, courses); создан `summary.md` |
| (этот коммит) | **Восстановлены кнопочные проактивы 7a/7b через канал `invite`** (решение владельца на ревью трека): код + unit-тесты с keyboard-ассертами + ui-spec возвращён к кнопочному описанию |

## Изменённые файлы

**Код стори** (`apps/u7-bot/src/controllers/learning/`):
- `stories/hub.ts` — хаб на `DialogResponse`; самовыход FR-4 (`leave-confirm` → UC `drop-student`); подписка `student.completed` → notify без кнопок
- `stories/step-view.ts` — просмотр/прохождение шага, ◀️/▶️ листание completed, transition-экраны
- `stories/nav-tree.ts` — дерево проекты→уроки→шаги, drill-down без роста seq
- `stories/progress.ts` — экран прогресса по коду (проекты+уроки с иконками ✅▶️🔒)
- `shared.ts` — очищен от `editOrSend`, только DialogResponse-хелперы (formatStepMessage, formatProgressBar, buildTransitionMessage и др.)

**Тесты:**
- `stories/*.test.ts` — юнит-тесты четырёх стори на новый контракт
- `controller.test.ts` — контроллер learning
- `tests/learning/hub.integration.test.ts`, `tests/learning/self-drop.e2e.test.ts` — мигрированы на новый контракт (стенд `tests/helpers/test-bot-transport.ts` уже был готов треком bot-ui-dialog-nav)

**Документация:**
- `src/controllers/learning/ui-spec.md` — синхронизирован с кодом (см. ниже)
- `src/controllers/courses/ui-spec.md` — уточнён источник кнопки `wish` (рендер удалён)

## Архитектурные решения

1. **«Владеешь экраном — edit»:** стори возвращают только `screen`/`notify` (`DialogResponse`); решение edit/send — транспорт по факту владения экраном. Drill-down внутри стори (nav-tree) не растит seq.
2. **Кнопочные проактивы сохранены через канал `invite`:** ветки 7a/7b `student.completed` доставляются `proactiveSender.invite` с кнопками `➡️ Следующий модуль` / `🔁 Пройти модуль снова` (прежние тексты и переходы на UC `create-module-wish`). Первоначально в треке они были ошибочно срезаны в notify без кнопок — восстановлены по решению владельца: invite — предусмотренный каналом для кнопочных проактивов (ФР-6, временное исключение И3 до tasks-system). Безкнопочные 7c/7d — как и раньше, через `userFacade.notify` из UC `complete-student`.
3. **Самовыход (FR-4):** `🚪 Покинуть учёбу` в хабе → confirm («Прогресс сохранится, но ментор больше не будет тебя сопровождать») → UC `drop-student` → студент `abandoned` + мягкий кик из TG-группы по событию `student.abandoned` (FR-6, InactivityStory).
4. **Правило «трек уменьшает» соблюдено:** адаптеров совместимости нет, `editOrSend` в скоупе отсутствует.

## Отклонения от плана

- Единственный доп. фикс в фазе 2: перестановка импорта `MenuButton` в `hub.ts` (biome organizeImports, db5aca61).
- **Ревью владельца (сессия финала):** первоначальная реализация срезала кнопки из проактивов 7a/7b (notify без кнопок) — признано потерей функциональности; восстановлено через `invite` с сохранением прежнего UX. Выводы (протокол «инвентаризация кнопок до миграции») внесены в планы треков 4–5.

## Гейт качества — триаж тестов (по `workflow.md`)

- **Скоуп трека — зелёный:** learning (stories + integration + e2e) — **68 pass / 0 fail**; biome и `tsc` по файлам скоупа — чисто.
- **u7-bot целиком:** `CI=true bun test` — **538 pass / 76 fail**. Все падения — вне скоупа:
  - mentor — 59 fail (MonitorStory, CreateStreamStory, ViewStreamMentorStory, wizard, e2e mentor-management, интеграция) → владелец **трек 5** `bot-ui-dialog-mentor_20260905` («весь репозиторий зелёный»);
  - questionnaire — 17 fail (fill/invite, Wish-ветка, questionnaire-ux) → владелец **трек 4** `bot-ui-dialog-questionnaire_20260905`.
  - `tsc --noEmit`: ошибки только в mentor/questionnaire + точках регистрации `MentorController` (`create-ui-app.ts`, user-notify.e2e, curious-showcase.e2e) — те же треки-владельцы.
- Регрессов нет: потерянная в [7034c7e] интерактивность (самовыход) восстановлена с e2e-покрытием.

## Известные ограничения / передача следующим трекам

- Кнопки `➡️ Следующий модуль` / `🔁 Пройти модуль снова` восстановлены (invite); мост `course-catalog:wish` снова имеет источник.
- Кнопочные проактивы InactivityStory, срезанные треком nav [7034c7e] («🚪 Покинуть учёбу» студенту в предупреждении о бездействии, «⚠️ Снять с учёбы» ментору в уведомлении об отстающем), — восстановить через `invite` в треке 5 (задача внесена в план).
- Красные тесты/tsc mentor и questionnaire — легальное промежуточное состояние до треков 4–5.
- Персистентность сессий и shortIds — трек 6 (`bot-ui-session-persist`).
