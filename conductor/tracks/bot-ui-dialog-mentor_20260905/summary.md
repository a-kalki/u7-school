# Итоговый отчёт — трек bot-ui-dialog-mentor_20260905

**Цель:** финальная миграционная волна bot-ui v4 — перевод mentor-стори на
контракт «Диалог и Экран» и полный демонтаж старого контракта; весь репозиторий
зелёный на `DialogResponse`. Материнский документ: `conductor/bot-ui-session-architecture.md` (§9, трек 5).

---

## Фазы и задачи

### Фаза 1 — Mentor-стори [checkpoint: b7ac1d2b]
- **Инвентаризация кнопок/реплик** всех mentor-стори из ui-spec и кода → падающие
  тесты с точными keyboard-ассертами (протокол «миграция без потери
  функциональности» — решение владельца, ревью трека 3) [e40280d2].
- Падающие тесты submenu / my-streams / view-stream-mentor / create-stream /
  activate-stream / monitor (включая delegate monitor→students) на `DialogResponse` [e40280d2].
- «⚠️ Снять с учёбы» доступен ментору без проактива: точка входа ⛔ в monitor
  с confirm-диалогом; приёмка — сценарий снятия из monitor, студент исключён из
  TG-группы (FR-6), реплика доставлена [7034c7e].
- Миграция доменных тестов: e2e `mentor-management`, integration
  `tests/mentor/mentor.integration.test.ts` (хелперы `pressedCode`/`stampedCode`) [6e1147a4, 94fa7a1e].
- Перевод всех mentor-стори на новый контракт [df4e9892].
- **Восстановление кнопочных проактивов InactivityStory через `invite`** (решение
  владельца, ревью трека 3): «🚪 Покинуть учёбу» студенту (SIN-W), «⚠️ Снять с
  учёбы» ментору (SIN-M) — прежние тексты/переходы из [7034c7e~1] [afc4a63f].
- User Manual Verification подтверждена владельцем без ручного прогона (2026-09-12).

### Исправления ревью [c3263b6e]
Двойное экранирование в create-stream (mdConcat для готовых MdText), формат monitor.ts.

### Фаза 2 — Демонтаж старого мира [e12d3d27]
- Удалены `BotCommand`, `BotResponse`, `SessionData`, `SendMessage/EditMessageDescription`,
  мёртвый `MessageDescription`, старые ассерты (`assertBotResponseValid`,
  `assertResponseMarkdownSafe`), реэкспорты `ui/index.ts`.
- `context.ts` финально на `BotSession` (Grammy-session удалены ранее).
- Именные обработчики, `handleTimeout`, takeover-код, `notifyWithButtons` в коде
  отсутствовали (удалены предыдущими треками). Временные `invite`/`app/invite`
  сохранены — владелец удаления tasks-system.

### Исправления ревью 2 [bd0884fe]
Fail-fast лимит `callback_data ≤ 64 байта` в транспорте (+3 теста), README u7-bot
под контракт «Диалог и Экран», зачистка исторических комментариев по core и u7-bot.

### Фаза 3 — Документация и финал (этот коммит)
- `conductor/code_styleguides/bot-architecture.md` — полная переработка под
  контракт «Диалог и Экран» (слои, владение сессией/диалогом/экраном, рендер-политика
  §5, штампы, pipe команд ФР-4, проактивные каналы, сборка).
- `apps/u7-bot/src/controllers/mentor/ui-spec.md` — сверка S07/S08 с кодом
  (легенды, метрики, «Типичное время», «N шаг(ов)», условия ⛔/✅/🔄, confirm-диалоги).
- `apps/u7-bot/src/controllers/streams/ui-spec.md` — SIN-W/SIN-M под кнопочные
  проактивы `invite`; S09 дополнен фактическими шагами wizard'а (инвайт-ссылка,
  «Принять» на шагах 1–2, дата+время, экраны «Нет модулей»/«Создан» — решение
  владельца); S02m: сводка потока сведена к S07 (решение владельца — в коде её
  никогда не было, карточка ментор-режима наследует текст curious-карточки);
  S10 — экран исчерпания попыток.
- `skills/bot-controller.md`, `skills/bot-ui-story.md` — актуализация под новый
  контракт (pipe команд, `menuButtons`, `contextHelp`; убраны `handleCancel`/
  `handleStart`/несуществующий `OnboardingController`).
- Спеки courses/learning/questionnaire — санитарная проверка: все упомянутые
  callback-коды существуют в коде, экраны треком не менялись.

## Основные файлы

- Код: `packages/core/src/ui/bot/{types,response-assert}.ts`,
  `apps/u7-bot/src/controllers/mentor/stories/*` (6 стори + тесты),
  `streams/stories/inactivity.story.ts`, `infra/bot-transport.ts`, `context.ts`.
- Тесты: `apps/u7-bot/tests/` (mentor e2e/integration), стори-тесты в controllers.
- Док: `bot-architecture.md`, `skills/bot-{controller,ui-story}.md`,
  `controllers/{mentor,streams}/ui-spec.md`, `apps/u7-bot/README.md`.

## Архитектурные решения

1. **Протокол «миграция без потери функциональности»**: инвентаризация → падающие
   keyboard-ассерты → миграция обязана воспроизвести каждую кнопку. ui-spec —
   источник истины, расхождения — вопрос владельцу.
2. **Кнопочные проактивы через `invite`** (временное исключение И3 до tasks-system):
   кнопки штампуются seq диалога получателя, без диалога — якорь `app/invite`.
3. **Результат доменных действий — `notify` + `delegate`**: реплика «✅ …» поверх
   целевого экрана (склейка `#resolveDelegate`).
4. **`errorNotify`** — warn-реплика без захвата экрана: при живом `awaitInput`
   сохраняет переспрос (использовано в S10).
5. `finalize` в mentor-ветке не используется — подтверждения идут отдельными
   screen-экранами (confirm-хелпер).

## Отклонения от плана

- Нет. Спорные расхождения спека с кодом решены владельцем в фазе 3:
  S02m-сводка → S07; S09 дополнен фактическим поведением.

## Гейт качества (триаж закрытия трека)

- `CI=true bun run check`: biome ✓, `tsc --noEmit` ✓, тесты — **2037 pass / 0 fail**
  (205 файлов).
- Красных промежуточных состояний нет (трек закрывал последнюю миграционную
  волну); регрессов нет — все домены зелёные.
- Grep по старым типам (`BotCommand`, `BotResponse`, `SessionData`,
  `SendMessageDescription`, `EditMessageDescription`, `notifyWithButtons`,
  `handleTimeout`) — чисто (выполнено в фазе 2 на HEAD).

## Известные ограничения / дальше

- `ProactiveSender.invite` и якорь `app/invite` — временные, владелец удаления —
  tasks-system.
- Следующий трек реестра: `bot-ui-session-persist_20260905` — персистентность
  сессий и shortIds.
