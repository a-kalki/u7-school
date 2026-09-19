# Итоги трека: Пагинация UI — универсальный пагинатор

**Трек:** `pagination_20260919`
**Дата:** 2026-09-19 – 2026-09-19
**Контракты UX:** [streams/ui-spec.md S03](../../../apps/u7-bot/src/controllers/streams/ui-spec.md),
[courses/ui-spec.md S00](../../../apps/u7-bot/src/controllers/courses/ui-spec.md)

## Цель

Заменить обрезку длинных сообщений (`#truncate` в сторях) на постраничный
просмотр: транспорт-независимое ядро в core, бот-надстройка, системный кеш
эпохи диалога, перенос существующих экранов (streams S03 «Программа курса»,
courses S00 уровни 0–4), e2e и фикстуры. Готовит пагинатор для трека
peer-review-ui (S07 — просмотр отзывов).

## Выполненные задачи

### Фаза 1: Пагинатор (core) — закрыта без отдельного checkpoint (последний коммит eedaa95e)
- **`Paginator`** (`packages/core/src/ui/pagination/paginator.ts`) — объект
  без состояния: `paginate(blocks, opts) → Paged` (страницы из целых блоков,
  курсоры prevStart/nextStart, isEmpty/isSingle/oversized, кастомная measure,
  separator), `page(paged, n)` с clamp. Без импортов bot/домена/MarkdownV2 —
  переиспользуется вне Telegram (20b3547).
- **`BotPaginator`** (`packages/core/src/ui/bot/page-nav.ts`) — `botLimit()`
  (4096 − шапка − резерв), `navRows()` — один ряд `‹ Пред`/`След ›` только при
  соседних страницах, `indicator()` — `Стр. N/M` (undefined на единственной)
  (7d92c8b, правка по замечанию владельца b4c0d9a: опциональная шапка с
  дефолтным HEADER_RESERVE).
- **`DialogCache`** (`packages/core/src/ui/bot/dialog-cache.ts`) — системный
  кеш страниц по (tgId, key) с эпохой path+seq (e5fa1b5).

### Фаза 2: Перенос обрезок — [checkpoint: df008af]
- **streams S03** (e25d390): блок = проект с уроками (`renderTreeBlocks` в
  tree-renderer), кеш `program:<id>`, листание edit на месте, хелпер
  `pagedScreen` в `U7BotUiStory`; `#truncate` удалён.
- **courses S00 уровни 0–4** (30cc936): все уровни на `pagedScreen` с payload
  в кеше (кнопки уровней — чистая функция payload, домен читается только при
  промахе кеша); контракт расширен `emptyScreen(payload)`; not-found семантика
  уровней 3/4 сохранена; `#truncate` удалён полностью.
- **fixtures + E2E** (ad38d70): поток `e6e6` (24 проекта, >10000 символов) и
  курс `f1f1`/модуль `f2f2` (16 проектов × 4 урока × 3 шага) в
  `tests/fixtures/templates` (доступны через `seed:fixtures` для ручного
  тыканья); `pagination.e2e.test.ts` — полный цикл листания ≥3 страниц
  вперёд/назад, edit на месте, валидация MarkdownV2 каждого ответа,
  целостность блоков (24/24 и 16/16 без потерь и дублей).
- **ui-spec ✅-пометки** (dda4cf19): S03 и «Постраничность уровней» S00
  помечены реализованными (ФР-8).

### Фаза 3: Финал
- Полный `CI=true bun run check` — зелёный (2359 pass / 0 fail, 234 файла);
  попутно исправлен дубликат `updated_at` в metadata.json трека.
- `grep truncate` по `apps/u7-bot/src` — пусто: обрезок не осталось.

## Ключевые архитектурные решения

1. **Адресация страниц — числовой сегмент, UUID-сжатие позиционно-независимо.**
   Колбэк навигации — `program:<id>:<page>` (номер страницы отдельным
   числовым сегментом в конце). Разжатие uuid-сегментов в `bot-transport`
   позиционное (сегмент ≠ uuid-словарю → пробуется следующий), поэтому
   добавление числового хвоста не ломает ни сжатие, ни легаси-коды; сегмент
   читается стори (`#pageSeg`, NaN → 0) с clamp внутри `page()`.
2. **Системный кеш `DialogCache`, а не кеш стори.** Ключ (tgId, key) + эпоха
   `path+seq` диалога: hit только в текущей эпохе; `enterDialog` физически
   делает `drop(tgId)` при переходе в новую эпоху — сторям не нужно чистить
   кеш руками, рестарт после рестарта процесса даёт тихий miss → пересборка
   при первом тыке. Стори получают кеш каскадом init (как `proactiveSender`).
3. **Блоки уровня = элемент с inline-детьми.** Страница наполняется целыми
   элементами (проект с уроками, модуль с проектами): блок либо входит
   целиком, либо начинается со следующей страницы — «рваных» заголовков нет.
4. **Кнопки из payload кеша.** `rows(payload)` — чистая функция: листание не
   перечитывает домен (get-module-snapshot вызывается 1 раз при трёх тыках —
   закреплено тестом).

## Изменённые файлы

- `packages/core/src/ui/` — `pagination/paginator.ts`, `bot/page-nav.ts`,
  `bot/dialog-cache.ts`, `bot/bot-ui-story.ts`, `bot/ui-app.ts` (+ тесты)
- `apps/u7-bot/src/` — `core/u7-bot-ui-story.ts` (`pagedScreen`),
  `shared/tree-renderer.ts` (`renderTreeBlocks`),
  `controllers/streams/stories/view-stream.story.ts`,
  `controllers/courses/stories/course-catalog.story.ts` (+ стори-тесты),
  ui-spec streams/courses
- `apps/u7-bot/tests/` — `e2e/pagination.e2e.test.ts`,
  `fixtures/templates/` (поток, курс, модуль, уроки, шаги)

## Тесты

- Итог трека: **2359 pass / 0 fail** (полный `CI=true bun run check`).
- Новые: Paginator — 11, BotPaginator — 13, DialogCache — 11, стори S03 —
  +6, стори S00 — +4, e2e — 4.
- Промежуточные состояния (красные тесты будущих треков): **нет**.
- Существующие 65 e2e не задеты; тест компактности урока переименован с
  сохранением сценария и ассертов.

## Потребители

Трек [peer-review-ui_20260916](../../tracks/peer-review-ui_20260916/index.md) (S07 —
просмотр отзывов) строится на готовом `BotPaginator` + `DialogCache`.
