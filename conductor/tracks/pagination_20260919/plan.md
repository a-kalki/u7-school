# План: Пагинация UI — универсальный пагинатор и перенос обрезок

> Спецификация: [spec.md](./spec.md). Изменения UX согласованы с владельцем
> до старта трека: streams S03 и courses S00 (ui-spec.md) — постраничность,
> peer-review S07 — заметка «пагинатор готов».

## Фаза 1. Пагинатор (core)

- [x] Task: Ядро `Paginator` — `packages/core/src/ui/pagination/` (ФР-1):
      объект без состояния; `paginate(blocks, opts) → Paged` (целые блоки,
      курсоры, isEmpty/isSingle/oversized, measure, separator) и `page(paged, n)`
      с clamp; без импортов bot/домена/MarkdownV2
    - [x] Red: юнит-тесты (целые блоки, малый лимит, одна страница, пустой
          список, oversized-блок, кастомная measure, курсоры prevStart/nextStart,
          clamp номера страницы, isSingle/isEmpty) — 20b3547
    - [x] Green: реализация — 20b3547
- [ ] Task: Бот-наследник `BotPaginator` — `packages/core/src/ui/bot/page-nav.ts`
      (ФР-2): `botLimit(headerLength)` (4096 − шапка − резерв), `navRows(page, cb)`
      — один ряд `‹ Пред`/`След ›` только при соседних страницах, `indicator(page)`
      — `Стр. N/M` (undefined на единственной)
    - [ ] Red: тесты (ряд кнопок, коды с номером страницы — числовой сегмент,
          лимит 64 байта не нарушается, индикатор)
    - [ ] Green: реализация
- [ ] Task: Системный кеш `DialogCache` — `packages/core/src/ui/bot/dialog-cache.ts`
      (ФР-3): set/get по (tgId, key) с эпохой path+seq (miss при чужой);
      инстанс в `BotUiApp`, каскад init в стори (как proactiveSender);
      физический drop(tgId) в `enterDialog` при переходе в новую эпоху
      (сигнатура + tgId, обновить 3 вызова в apps/u7-bot)
    - [ ] Red: тесты (hit/miss по эпохе, drop при смене диалога через
          enterDialog — только текущий пользователь, доставка каскадом в стори)
    - [ ] Green: реализация
- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2. Перенос обрезок (streams S03, courses S00)

- [ ] Task: streams S03 «Программа курса» (ФР-4): блок = проект с уроками
      (tree-renderer отдаёт блоки), `#truncate` удалён, кеш через DialogCache,
      листание edit на месте
    - [ ] Red: стори-тест длинной программы (границы страниц по целым
          проектам, `‹ Пред`/`След ›` одним рядом, `Стр. N/M`, кеш — домен
          не перечитывается при тыке, смена диалога → пересборка)
    - [ ] Green: реализация
- [ ] Task: courses S00 уровни 0–4 (ФР-5): блок = элемент уровня с inline-детьми,
      `#truncate` удалён, тот же паттерн
    - [ ] Red: стори-тест длинного уровня
    - [ ] Green: реализация
- [ ] Task: fixtures + E2E (ФР-6/ФР-7): сид длинной программой курса (>4000
      символов) для `dev:fixtures`; e2e минимум три страницы — полный цикл
      листания (S03 + уровень каталога), edit на месте, `assertBotResponseValid`
- [ ] Task: ✅-пометки ui-spec (streams S03, courses S00) — ФР-8
- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3. Финал

- [ ] Task: Полный прогон `bun run check`, триаж по workflow; `grep truncate`
      по сторям — пусто
- [ ] Task: Создать summary.md трека (включая исследование UUID-сжатия и
      решение о системном кеше DialogCache)
- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)
