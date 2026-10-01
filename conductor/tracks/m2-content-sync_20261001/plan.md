# План: Синхронизация контента модуля «Алгоритмика» (m2)

> Читать вместе со `spec.md`. Формат md: `lesson.md` (паспорт) + `steps.md` (шаги) + `summary.md`.
> Процесс каждого батча: генерация md → вычитка Нурболата → укладка в json → коммит (dev).

## ⏸ Текущее состояние (для продолжения после сжатия контекста)

- Ветка: `track/m2-content-sync`; **Фазы 1–2 закрыты** (checkpoint'ы `eeff217`, `61af4e9`); `main` не тронут.
- Инструменты: `scripts/generate-m2-sources.ts` (генератор md), `scripts/deliver-m2.ts` (create/update/check).
- **md П1–П5 вычитаны и закоммичены** (`61af4e9`): 45 уроков / 147 шагов в `data/fullstack-js/m2-algorithm/`.
- Сверка `bun run scripts/deliver-m2.ts --check p1,p2,p3,p4,p5` → 0 расхождений.
- **Следующий шаг:** Фаза 3 — П6 (JSDoc). Адаптировать черновик `/tmp/redesign-m2/redesign-p6` (единый финальный урок, напоминания, термины, ревизия Нурболата) → сгенерировать md П6 (`generate-m2-sources.ts --only p6 --apply`) → уложить в json новыми uuid (`deliver-m2.ts --create p6 --apply`) → коммит.
- Перед `deliver-m2 --apply` — `bun run backup` и остановка бота; прод/снапшот потока 7 — вне трека.
- Источники в `/tmp` (не переживают перезагрузку): `/tmp/redesign-m2` (черновики p1–p8), `/tmp/m2-algorithm-old` (старые p7–p12).
- Тестовые артефакты П6/П9 удалены. `.gitignore` (запись `redesign-m2/`) — предсуществующее изменение, не трогать до Финала.
- Команды: `bun run scripts/generate-m2-sources.ts [--only pN] [--apply]`; `bun run scripts/deliver-m2.ts (--create|--update|--check) pN [--apply]`.

## Фаза 1: Подготовка [checkpoint: eeff217]

- [x] Task: Перенести старое в системный `/tmp` (8e53417b)
    - [x] `data/fullstack-js/m2-algorithm` → `/tmp/m2-algorithm-old/`
    - [x] `redesign-m2/` → `/tmp/redesign-m2/`
    - [x] Убедиться, что в `data/fullstack-js/m2-algorithm` не осталось старых папок
- [x] Task: Разработать генератор md-исходников `scripts/generate-m2-sources.ts` (1e9be96)
    - [x] Источники: json (`data/courses`), черновики (`/tmp/redesign-m2`), старые md (`/tmp/m2-algorithm-old`)
    - [x] Формирование `lesson.md` (паспорт), `steps.md`, `summary.md`
    - [x] Режим dry-run; корректная нумерация `pN-lM` по новому плану
- [x] Task: Разработать инструмент укладки/правки контента (0ec81d2)
    - [x] Создание новых проектов (П6–П8) через UC + публикация (по образцу `deliver-redesign.ts`)
    - [x] Обновление существующих сущностей (П9–П14) прямой правкой JSON по маппингу uuid
    - [x] Обязательный dry-run и отчёт «что изменится»
- [x] Task: Проверить маппинг `list-lessons.ts` на новых папках (позиция ↔ `pN-lM`) — проверено на П1–П5: `2:P:L` находит `pP-lL-…`
- [ ] Task: Conductor - User Manual Verification 'Подготовка' (Protocol in workflow.md)

## Фаза 2: П1–П5 — md-исходники (147 шагов) [checkpoint: 61af4e9]

- [x] Task: Сгенерировать 45 папок П1–П5 (`steps.md` из json, `lesson.md`/`summary.md` из черновиков) — 45 уроков / 147 шагов
- [x] Task: Сверить `steps.md` ↔ json по составу и тексту (автоматическая сверка) — 0 расхождений (`8ae9b51`)
- [x] Task: Ручная вычитка Нурболатом — выполнена
- [x] Task: Conductor - User Manual Verification 'П1–П5' (Protocol in workflow.md)

## Фаза 3: П6 — JSDoc и трансформация строк (12 уроков / 31 шаг) — новые uuid

- [ ] Task: Адаптировать черновик П6 (единый финальный урок, напоминания, термины, ревизия Нурболата)
- [ ] Task: Сгенерировать md П6 в `m2-algorithm`
- [ ] Task: Уложить П6 в json (новые uuid) + публикация
- [ ] Task: Коммит `data/courses` + md
- [ ] Task: Conductor - User Manual Verification 'П6' (Protocol in workflow.md)

## Фаза 4: П7 — Массивы: структура (12 уроков / 34 шага) — новые uuid

- [ ] Task: Адаптировать черновик П7 (единый финал, напоминания, термины)
- [ ] Task: Сгенерировать md П7 в `m2-algorithm`
- [ ] Task: Уложить П7 в json + публикация, коммит
- [ ] Task: Conductor - User Manual Verification 'П7' (Protocol in workflow.md)

## Фаза 5: П8 — Массивы: трансформация (9 уроков / 21 шаг) — новые uuid

- [ ] Task: Адаптировать черновик П8 (единый финал, напоминания, термины)
- [ ] Task: Сгенерировать md П8 в `m2-algorithm`
- [ ] Task: Уложить П8 в json + публикация, коммит
- [ ] Task: Conductor - User Manual Verification 'П8' (Protocol in workflow.md)

## Фаза 6: П9–П10 — Итеративные методы (10 уроков / 28 шагов) — старые uuid, правки

- [ ] Task: Сгенерировать md П9–П10 из `/tmp/m2-algorithm-old` (нумерация/имена по новому плану)
- [ ] Task: Правки: термины, git → напоминания
- [ ] Task: Вычитка Нурболатом → укладка правок в json прямой правкой
- [ ] Task: Коммит
- [ ] Task: Conductor - User Manual Verification 'П9–П10' (Protocol in workflow.md)

## Фаза 7: П11 — Объекты (6 уроков / 24 шага) — старые uuid, правки

- [ ] Task: Сгенерировать md П11, внести правки (термины, напоминания)
- [ ] Task: Вычитка → укладка правок в json, коммит
- [ ] Task: Conductor - User Manual Verification 'П11' (Protocol in workflow.md)

## Фаза 8: П12 — Бизнес-утилиты (6 уроков / 32 шага) — старые uuid, правки

- [ ] Task: Сгенерировать md П12, внести правки (термины, напоминания)
- [ ] Task: Вычитка → укладка правок в json, коммит
- [ ] Task: Conductor - User Manual Verification 'П12' (Protocol in workflow.md)

## Фаза 9: П13 — Сортировка и бинарный поиск (7 уроков / 37 шагов) — старые uuid, правки

- [ ] Task: Сгенерировать md П13, внести правки (термины, напоминания)
- [ ] Task: Вычитка → укладка правок в json, коммит
- [ ] Task: Conductor - User Manual Verification 'П13' (Protocol in workflow.md)

## Фаза 10: П14 — Сложность и структуры данных (4 урока / 30 шагов) — старые uuid, правки

- [ ] Task: Сгенерировать md П14, внести правки (термины, напоминания)
- [ ] Task: Вычитка → укладка правок в json, коммит
- [ ] Task: Conductor - User Manual Verification 'П14' (Protocol in workflow.md)

## Фаза 11: Финал

- [ ] Task: Финальная сверка md ↔ json по всему m2 (14 проектов)
- [ ] Task: Убрать временные `.gitignore`-записи (`redesign-m2/`, `tmp`-хвосты, `redesign-p*/`, `redesign-algorithms-*.md`, `scripts/deliver-redesign.ts`)
- [ ] Task: Написать `summary.md` трека, обновить `tracks.md` (завершён)
- [ ] Task: Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
