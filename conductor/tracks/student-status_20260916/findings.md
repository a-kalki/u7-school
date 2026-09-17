# Находки Фазы 1: клиенты с собственным разбором статусов студента

> Результат задачи grep-поиска (первая задача Фазы 1 плана). Список мест
> **вне зоны `packages/stream`**, где размазано знание о состоянии студента
> (`status`, `abandonDetails`). Служит чек-листом для Фазы 2.

## A. Лейблы и иконки статусов — прямые кандидаты на словарь меток (ФР-2)

| # | Файл | Строки | Что размазано |
|---|------|--------|---------------|
| A1 | `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts` | 579–584 | карта `statusLabels`: «🟢 Учится / 🚫 Выбыл / ✅ Прошёл / ↩️ Не прошёл» + fallback `?? student.status` |
| A2 | `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts` | 693–699 | `#lagMarker`: иконки ✅/↩️/🚫 по статусу |
| A3 | `apps/u7-bot/src/controllers/mentor/stories/monitor.ts` | 378–384 | карта `statusLabels` (дубликат A1) |
| A4 | `apps/u7-bot/src/controllers/mentor/stories/monitor.ts` | 313–319 | `#lagMarker` (дубликат A2) |
| A5 | `apps/u7-bot/src/controllers/mentor/stories/monitor.ts` | 575–590 | кнопки выбора исхода: «✅ Прошёл / ↩️ Не прошёл / 🔴 Выбыл» |
| A6 | `apps/u7-bot/src/controllers/mentor/stories/monitor.ts` | 626–630 | карта `outcomeLabels`: «прошёл / не прошёл / выбыл» |

## B. Подсчёт статистики по категориям — кандидаты на API категорий (ФР-1)

| # | Файл | Строки | Что размазано |
|---|------|--------|---------------|
| B1 | `view-stream.story.ts` | 411–424 | счётчики active/advanced/notAdvanced/abandoned через if-else |
| B2 | `monitor.ts` | 158–171 | та же статистика (дубликат B1) |

## C. Категориальные проверки (терминальность / активность) — кандидаты на API категорий (ФР-1)

| # | Файл | Строки | Что размазано |
|---|------|--------|---------------|
| C1 | `view-stream.story.ts` | 400–402 | сортировка: терминальные = не `active` и не `enrolled` |
| C2 | `monitor.ts` | 102 | фильтр видимых: `active \|\| enrolled` |
| C3 | `monitor.ts` | 232 | кнопка 🔄 для категории «завершил» (`advanced \|\| not_advanced`) |
| C4 | `monitor.ts` | 259 | сводка: `activeTotal` через `active \|\| enrolled` |
| C5 | `apps/u7-bot/src/controllers/mentor/stories/view-stream-mentor.ts` | 197–210 | `isActive` (`active \|\| enrolled`) + кнопка 🔄 (`advanced \|\| not_advanced`) |
| C6 | `apps/u7-bot/src/controllers/learning/stories/hub.ts` | 127–129 | `isFinished`: терминальность (`advanced \|\| not_advanced \|\| abandoned`) |
| C7 | `apps/u7-bot/src/controllers/learning/stories/step-view.ts` | 67–70 | та же терминальность (дубликат C6) |
| C8 | `apps/u7-bot/src/handlers/group-handler.ts` | 207 | фильтр студентов группы: `active \|\| enrolled` |

## D. Вне миграции (зафиксировано осознанно)

- `hub.ts:61` — ветвление по `outcome` из payload события `student.completed`
  (проактив «повтор модуля» / «следующий модуль»). Разбирает payload события,
  а не состояние студента — API исходов тут не применим.
- `inactivity.story.ts:231`, `monitor.ts:557` — **запись** `cause: 'inactivity'`
  в UC, не чтение для лейблов.
- `my-streams.ts`, `stream-catalog.story.ts` — статусы **потока** (`StreamStatus`),
  не студента.
- `progress.ts`, `nav-tree.ts` — статусы узлов контента (`completed`/`current`).
- `questionnaire`, `wish` — собственные домены со своими `abandoned`, не студент.

## Ключевые выводы

1. **Читателей `abandonDetails` (who/cause) вне зоны stream сейчас нет** —
   признаки «покинул сам» / «снят ментором» нигде не отображаются. Словарь этих
   меток готовится для будущего (снапшоты peer-review, досье).
2. Лейблы статусов дублируются между `view-stream.story.ts` и `monitor.ts`
   (A1≡A3, A2≡A4, B1≡B2) — миграция устраняет дублирование.
3. В зоне stream (домен/UC) есть собственные проверки (`stream-ds.ts`,
   `complete-student-uc.ts`, `get-student-by-user-uc.ts` и др.) — они НЕ мигрируют:
   домен-владелец и есть источник знаний.
