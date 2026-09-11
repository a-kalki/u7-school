# Итоговый отчёт: Декларативные хелперы ответов стори бота

**Трек:** `bot-story-helpers_20260912`
**Цель:** заменить ~120 ручных литералов `DialogResponse` в 19 сторях шести контроллеров и core/app-слоях на доменный язык ответов (`screen`/`ask`/`notify`/`warn`/`note`/`go`/`kb`/`btn`) — чистые билдеры в core + `protected`-делегаты на `BotUiStory`. Контракт «Диалог и Экран» и транспорт не меняются, UI-поведение идентично.

## Выполненные задачи по фазам

### Фаза 1: Билдеры и делегаты (core)
- `9d3522f` — чистые билдеры `response-builders.ts` (`screen/ask/warn/note/go/kb/btn/btnUrl`) + полные unit-тесты (136 строк: все функции, дефолты `isMultiple: false`, kind-уведомления, чистота вызовов); экспорт из `@u7-scl/core/ui`.
- `0da5d6a` — тонкие `protected`-делегаты на `BotUiStory`; тесты: делегаты возвращают результат билдеров, `btn`+`cb`-композиция.

### Фаза 2: Образцовые стори (courses, streams)
- `6965493` — `course-catalog.story.ts` (эталон каталога, 26 литералов).
- `c4e416e` — `view-stream.story.ts` (эталон wizard/`awaitInput`/`delegate`/`release`).
- `8fdfcd2` — `stream-catalog`, `inactivity`.
- `ec2b1c1` — **новый билдер `notify(text)`** (дефолтный тон транспорта 🔔, без `kind`) по решению владельца: дефолтный тон — самый частый (19 литералов), три тона контракта = три доменных слова.

### Фаза 3: mentor + questionnaire
- `5f507c3` — `create-stream` (крупнейший wizard: 35 полей, 11 `awaitInput`); локальные kb-хелперы mentor удалены.
- `58d0a27` — `monitor`, `my-streams`, `submenu`, `activate-stream`, `view-stream-mentor`.
- `2153442` — `fill.story`, `invite.story`, `render.ts` (wizard + release).

### Фаза 4: learning, app/user + core-литералы
- `800a2bc` — learning: `hub`, `step-view`, `nav-tree`, `progress`.
- `977d2a5` — `community.story`.
- `e435baf` — core: `bot-controller.ts` (`#errorScreen`, `unknownCommand`; убран дубль метода со стори), `core/ui-app.ts`, `bot-ui-story.ts`.
- `4587ca7` — app: `app/core/ui-app.ts`, `learning/shared.ts`.

### Фаза 5: Документация и закрытие
- `208672d` — styleguide `bot-ui-story.md`: раздел 5 «Хелперы ответов» (таблица хелперов, правила хелпер/спред/литерал, живые образцы); актуализировано описание контракта в §4 (`info` → `notify`), перенумерация 5–7 → 6–8.
- Финальный прогон, этот отчёт, обновление `tracks.md`.

## Изменённые файлы

**Новые:**
- `packages/core/src/ui/bot/response-builders.ts` (+78)
- `packages/core/src/ui/bot/response-builders.test.ts` (+136)

**Мигрировано на хелперы (27 файлов, +1209/−1386):**
- core: `bot-controller.ts`, `bot-ui-story.ts`, `ui-app.ts`, `ui/index.ts` (экспорт)
- app: `src/core/ui-app.ts`
- u7-bot стори: courses (1), streams (3), questionnaire (3), mentor (6), learning (4+`shared.ts`), app (1)

**Документация:** `conductor/code_styleguides/skills/bot-ui-story.md`.

## Архитектурные решения

1. **Билдеры — чистые функции в core** (`packages/core/src/ui/bot/response-builders.ts`): детерминированные `аргументы → DialogResponse/KeyboardDescription`, без сессии/транспорта. Тестируемость и переиспользование вне наследников `BotUiStory` (контроллеры, ui-app — импортом из `@u7-scl/core/ui`).
2. **Делегаты `protected` на `BotUiStory`** — тонкая переадресация билдерам; `this.screen(...)` читается как доменная реплика стори.
3. **`isMultiple: false` по умолчанию** в `kb(rows, { multiple: true })`) — служебный шум ушёл из 35+ клавиатур.
4. **`notify(text)` без `kind`** — дефолтный вид транспорта 🔔; `warn`/`note` — тоновые обёртки. Решение владельца (Фаза 2, debrief `325126f`).
5. **Комбинации-редкости — спредом**: `{ ...this.notify(x), release: true }` — хелпер остаётся источником истины, редкие поля контракта добавляются сверху.

## Отклонения от плана

- `notify(text)` добавлен в Фазе 2 (в исходном плане только `screen/ask/warn/note/go/kb/btn`) — решение владельца, отражено в спецификации (ФР-1).
- Иных отклонений нет.

## Гейт качества при закрытии (триаж)

- `CI=true bun run tslint` — чисто.
- `CI=true bun test` — **2086 pass / 0 fail** (206 файлов, 4626 expect). Промежуточных красных состояний нет — миграция не сломала ни одного существующего сценария, все тесты стори прошли **без правки ожиданий** (регрессионная сеть по инварианту спецификации).
- `CI=true bun run lint` — 1 ошибка форматирования в `data/courses/lessons.json` (коммит `74cb4496`, вне трека; автофикс `bun run format`).
- Критерии приёмки: `isMultiple` в контроллерах — только в тестах-проверках; сырых `keyboard: { rows: ... }`-литералов в сторях нет; `grep` чист.

## Известные ограничения / незавершённое

- `finalize`-хелпер не введён (0 использований; за рамками — см. спецификацию).
- Ошибка форматирования `data/courses/lessons.json` — вне скоупа трека, требует одного `bun run format` владельцем.
- `packages/stream/src/ui/bot/ui-spec.md` не обновлялся: трек не менял экраны, кнопки и условия видимости — только способ построения тех же структур.

## Ручная верификация

Чеклисты фаз 1–4 подтверждены владельцем (план, Фазы 1–4). UI-поведение идентично — структурная эквивалентность миграции подтверждена тестами без правки ожиданий.
