# План: Исходы и форма кампании peer-review (+предусловия UI)

> Спецификация: [spec.md](./spec.md). Готовит продолжение трека
> [peer-review-ui_20260916](../peer-review-ui_20260916/plan.md) (экраны — по
> [ui-spec.md](../../../apps/u7-bot/src/controllers/peer-review/ui-spec.md)
> от 2026-09-20).
>
> В рабочем дереве висят незакоммиченные файлы Фазы 1 UI-трека (стори, домен,
> UC, тесты — фидбек-раунд 2026-09-19; точный список — `git status`;
> ui-spec.md уже закоммичен отдельно). Их судьба — Фаза 7: довести до
> целевого состояния под новую форму и закоммитить. До Фазы 1
> обратить внимание: часть правок будет перекрыта работой фаз 1–4.

## Фаза 1. Домен peer-review: форма кампании и отзыв

- [x] Task: Проекция исходов 4 значения + форма кампании: schema/entity/factory
      (participants — uuid[] в ядре; payload { subjectOutcome, mentorId };
      context 'stream_fate'; удалить role/in_progress-исходы) — e6a82a2
    - [x] Red: тесты схемы/фабрики (создание для всех 4 исходов субъекта, пустой participants) — e6a82a2
    - [x] Green: реализация — e6a82a2
- [x] Task: Review — direction + authorOutcome (4-значный); создание/перезапись — dd6b9e7
    - [x] Red: тесты (direction выводится из ролей, authorOutcome снапшот, невозможные пары) — e6a82a2 (схема/ар), dd6b9e7 (UC)
    - [x] Green: реализация — e6a82a2
- [x] Task: ReviewPolicy / assertCanWrite / reviewTargets под новую форму — 5e071ac6
    - [x] Red: тесты адресации (субъект → participants + ментор; ментор → субъект; пустой список — только ментор) — e6a82a2 (базовые), 5e071ac6 (сам-себе)
    - [x] Green: реализация — e6a82a2 (policy удалён, адресация в агрегате)
- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2. Read-API stream

- [ ] Task: StreamFacade.getMembers — статус студента (advanced/not_advanced/
      abandoned/…) + neverStarted вместо outcomeCategory
    - [ ] Red: тесты фасада (различает «прошёл»/«не прошёл», neverStarted)
    - [ ] Green: реализация
- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3. ER и событие

- [ ] Task: ER create-student-campaign — фильтрация участников по событию
      (completed → завершившиеся + учащиеся, без субъекта; abandoned → пусто),
      проекция subjectOutcome из статуса
    - [ ] Red: тесты ER (все исходы, состав списка, идемпотентность)
    - [ ] Green: реализация
- [ ] Task: Событие student-campaign.created — payload + mentorId + subjectOutcome
    - [ ] Red: тесты события
    - [ ] Green: реализация
- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4. UC и данные

- [ ] Task: get-campaign-recipients — вернуть myOutcome; удалить deliverables
    - [ ] Red: тесты UC
    - [ ] Green: реализация
- [ ] Task: create-review / get-my-campaigns / list-scope-reviews /
      get-my-review — адаптация под direction и новую форму
    - [ ] Red: тесты
    - [ ] Green: реализация
- [ ] Task: Фикстуры/dev-данные кампаний и отзывов — миграция под новую форму
- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)

## Фаза 5. Core: асинхронные menuButtons

- [ ] Task: Promise<MenuButton[]> в сигнатурах (U7BotUiStory, U7BotController,
      u7-menu), параллельный сбор в ui-app, политика ошибок (упавшая проверка
      скрывает кнопку + warn)
    - [ ] Red: тесты (async-видимость, ошибка → скрыта, меню цело)
    - [ ] Green: реализация
- [ ] Task: Обновить все реализации menuButtons (streams, learning, app,
      mentor, courses) и их тесты
- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)

## Фаза 6. User: batch-UC get-users-by-ids

- [ ] Task: UC get-users-by-ids (uuid[], лимит ~100, дедуп, пропуск ненайденных)
    - [ ] Red: тесты (норм/пусто/лимит/дубли/частично не найдены)
    - [ ] Green: реализация
- [ ] Task: Conductor - User Manual Verification 'Фаза 6' (Protocol in workflow.md)

## Фаза 7. Синхронизация с UI-треком и чистота репозитория

- [ ] Task: Стори кампании бота — тексты S05 (4 варианта «о менторе»),
      использование myOutcome; довести висящие файлы Фазы 1 до целевого
      состояния и закоммитить
    - [ ] Red: тесты стори
    - [ ] Green: реализация
- [ ] Task: Обновить conductor-документы: spec/plan трека peer-review-ui_20260916
      (новые знания: direction/subjectOutcome/async-меню/batch-имена), концепцию
      peer-review-system.md (§2/§5), ✅-пометки ui-spec
- [ ] Task: Удалить временные файлы сессий (заметки, черновики — если
      появлялись); убедиться, что они не попали в git (чистый `git status`
      по скоупу трека, незакоммиченных файлов нет)
- [ ] Task: Полный прогон bun run check, триаж по workflow
- [ ] Task: Conductor - User Manual Verification 'Фаза 7' (Protocol in workflow.md)
