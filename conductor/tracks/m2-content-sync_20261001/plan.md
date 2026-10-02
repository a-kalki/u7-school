# План: Синхронизация контента модуля «Алгоритмика» (m2)

> Читать вместе со `spec.md`. Формат md: `lesson.md` (паспорт) + `steps.md` (шаги) + `summary.md`.
> Процесс каждого батча: генерация md → вычитка и правки Нурболатом (ручное) → **только после одобрения** укладка в json → коммит (dev).

## ⏸ Текущее состояние (для продолжения после сжатия контекста)

- Ветка: `track/m2-content-sync`; **Фазы 1–4 закрыты** (checkpoint'ы `eeff217`, `61af4e9`, `e0fc36a`, `bbb3960`); `main` не тронут.
- Инструменты: `scripts/generate-m2-sources.ts` (генератор md), `scripts/deliver-m2.ts` (create/update/check).
- **П1–П7 в json и md.** П1–П5 — `61af4e9` (45/147); П6 — `e0fc36a` (12/31, `6cfc4ea0`); П7 — `bbb3960` (проект `ef6c8c4c` published, 12/34). Сверка `--check` → 0 расхождений.
- **Следующий шаг:** Фаза 5 — П8 (массивы: трансформация, 9/21). Черновик `/tmp/redesign-m2/redesign-p8` (папка `array-utils/`) → сгенерировать md → вычитка Нурболата → укладка `--create p8 --apply` → коммит.
- **Важно:** правки Нурболат вносит в **сгенерированные** md; перед любой регенерацией делать снапшот (`cp -r p8-* /tmp/...`) и переносить его правки в черновик, иначе они затираются.
- **Бэкап:** `bun run backup` недоступен вне сервера (нет `~/server-ops/lib/backup-contract.sh`) — ручная копия `data/courses/{modules,lessons,steps}.json` перед `--apply`. Прод-бот локально не запущен (pm2 пуст).
- `--create/--update` нормализуют порядок ключей: первая запись (П6) дала разовый шум.
- Источники в `/tmp` (не переживают перезагрузку): `/tmp/redesign-m2` (черновики p1–p8), `/tmp/m2-algorithm-old` (старые p7–p12).
- Тестовые артефакты П6/П9 удалены. `.gitignore` (запись `redesign-m2/`) — предсуществующее изменение, не трогать до Финала.
- **Конвенция папок (spec §6.1):** `string-utils/` (П1–П6), `array-utils/` (П7–П10), `object-utils/` (П11), `business-utils/` (П12), `sorting/` (П13). Черновики П7/П8 уже переименованы (`arrays/` → `array-utils/`).
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

## Фаза 3: П6 — JSDoc и трансформация строк (12 уроков / 31 шаг) — новые uuid [checkpoint: e0fc36a]

- [x] Task: Адаптировать черновик П6 (единый финальный урок, напоминания, термины)
- [x] Task: Сгенерировать md П6 в `m2-algorithm`
- [x] Task: Вычитка и правки md П6 Нурболатом (ручное)
- [x] Task: Уложить П6 в json (новые uuid) + публикация — только после одобрения вычитки
- [x] Task: Коммит `data/courses` + md
- [x] Task: Conductor - User Manual Verification 'П6' (Protocol in workflow.md)

## Фаза 4: П7 — Массивы: структура (12 уроков / 34 шага) — новые uuid [checkpoint: bbb3960]

- [x] Task: Адаптировать черновик П7 (единый финал, напоминания, термины)
- [x] Task: Сгенерировать md П7 в `m2-algorithm`
- [x] Task: Вычитка и правки md П7 Нурболатом (ручное)
- [x] Task: Уложить П7 в json + публикация — только после одобрения вычитки
- [x] Task: Коммит `data/courses` + md
- [x] Task: Conductor - User Manual Verification 'П7' (Protocol in workflow.md)

## Фаза 5: П8 — Массивы: трансформация (9 уроков / 21 шаг) — новые uuid

- [ ] Task: Адаптировать черновик П8 (единый финал, напоминания, термины)
- [ ] Task: Сгенерировать md П8 в `m2-algorithm`
- [ ] Task: Вычитка и правки md П8 Нурболатом (ручное)
- [ ] Task: Уложить П8 в json + публикация — только после одобрения вычитки
- [ ] Task: Коммит `data/courses` + md
- [ ] Task: Conductor - User Manual Verification 'П8' (Protocol in workflow.md)

## Фаза 6: П9–П10 — Итеративные методы (10 уроков / 28 шагов) — старые uuid, правки

- [ ] Task: Сгенерировать md П9–П10 из `/tmp/m2-algorithm-old` (нумерация/имена по новому плану)
- [ ] Task: Правки: термины, git → напоминания
- [ ] Task: Вычитка и правки md П9–П10 Нурболатом (ручное)
- [ ] Task: Уложить правки в json прямой правкой — только после одобрения вычитки
- [ ] Task: Коммит
- [ ] Task: Conductor - User Manual Verification 'П9–П10' (Protocol in workflow.md)

## Фаза 7: П11 — Объекты (6 уроков / 24 шага) — старые uuid, правки

- [ ] Task: Сгенерировать md П11, внести правки (термины, напоминания)
- [ ] Task: Вычитка и правки md П11 Нурболатом (ручное)
- [ ] Task: Уложить правки в json прямой правкой — только после одобрения вычитки
- [ ] Task: Коммит
- [ ] Task: Conductor - User Manual Verification 'П11' (Protocol in workflow.md)

## Фаза 8: П12 — Бизнес-утилиты (6 уроков / 32 шага) — старые uuid, правки

- [ ] Task: Сгенерировать md П12, внести правки (термины, напоминания)
- [ ] Task: Вычитка и правки md П12 Нурболатом (ручное)
- [ ] Task: Уложить правки в json прямой правкой — только после одобрения вычитки
- [ ] Task: Коммит
- [ ] Task: Conductor - User Manual Verification 'П12' (Protocol in workflow.md)

## Фаза 9: П13 — Сортировка и бинарный поиск (7 уроков / 37 шагов) — старые uuid, правки

- [ ] Task: Сгенерировать md П13, внести правки (термины, напоминания)
- [ ] Task: Вычитка и правки md П13 Нурболатом (ручное)
- [ ] Task: Уложить правки в json прямой правкой — только после одобрения вычитки
- [ ] Task: Коммит
- [ ] Task: Conductor - User Manual Verification 'П13' (Protocol in workflow.md)

## Фаза 10: П14 — Сложность и структуры данных (4 урока / 30 шагов) — старые uuid, правки

- [ ] Task: Сгенерировать md П14, внести правки (термины, напоминания)
- [ ] Task: Вычитка и правки md П14 Нурболатом (ручное)
- [ ] Task: Уложить правки в json прямой правкой — только после одобрения вычитки
- [ ] Task: Коммит
- [ ] Task: Conductor - User Manual Verification 'П14' (Protocol in workflow.md)

## Фаза 11: Финал

- [ ] Task: Финальная сверка md ↔ json по всему m2 (14 проектов)
- [ ] Task: Убрать временные `.gitignore`-записи (`redesign-m2/`, `tmp`-хвосты, `redesign-p*/`, `redesign-algorithms-*.md`, `scripts/deliver-redesign.ts`)
- [ ] Task: Написать `summary.md` трека, обновить `tracks.md` (завершён)
- [ ] Task: Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
