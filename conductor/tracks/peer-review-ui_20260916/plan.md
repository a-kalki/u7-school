# План: UI отзывов (peer-review)

> Спецификация: [spec.md](./spec.md). Тексты и экраны — [ui-spec.md](../../../apps/u7-bot/src/controllers/peer-review/ui-spec.md).
> **Готов к продолжению:** трек-предусловие [peer-review-outcomes_20260920](../peer-review-outcomes_20260920/plan.md)
> завершён (домен-выравнивание под решения 2026-09-20: `direction`, 4-значная проекция
> `subjectOutcome`/`myOutcome`/`authorOutcome`, async-`menuButtons` в core, batch-UC
> `get-users-by-ids`); план обновлён его Фазой 7.
> **Предусловия:** завершён трек [peer-review-campaign_20260918](../../archive/peer-review-campaign_20260918/plan.md);
> пагинатор готов треком [pagination_20260919](../archive/pagination_20260919/plan.md)
> (Фаза 1 старого плана — хелпер пагинации — перенесена туда).

## Фаза 1. Контроллер и стори кампании (S03–S06)

- [x] Task: Каркас контроллера peer-review + стори кампании: S03 список адресатов (`✅`-признаки, шапка с остатком дней, адресация v4: субъекту по исходу, ментору — только субъект) через `get-campaign-recipients`
    - [x] Red: тесты S03 (роли кнопок, ✅, заголовок)
    - [x] Green: реализация
- [x] Task: S05 ввод отзыва — `awaitInput`, тексты-подсказки по направлению/исходу автора (спека S05), валидация 10–3500 (`errorNotify`, контекст не теряется), `⏭️ Пропустить`
    - [x] Red: тесты ввода (все тексты-подсказки, короткий/длинный текст, пропуск)
    - [x] Green: реализация
- [x] Task: S06 сохранение → обновлённый список (create-review-uc, ошибки домена → экран)
    - [x] Red: тесты (сохранение, ✅ появился) — 30a2ac0
    - [x] Green: реализация — 30a2ac0
- [x] Task: S04 перезапись — экран с текущим текстом, ввод заменяет, `❌ Назад`
    - [x] Red: тесты — edcbff0
    - [x] Green: реализация — edcbff0
- [x] Task: Экран-заглушка истёкшего окна (ошибка «возможность закрыта» из UC → экран стори)
    - [x] Red: тест — e291a7d
    - [x] Green: реализация — e291a7d
- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2. Хаб «Мои отзывы» (S02) и меню

- [ ] Task: `menuButtons` «💬 Отзывы» — видимость по фасаду `hasLiveCampaigns` (декларативно, без обработчиков; async-контракт `Promise<MenuButton[]>` уже в core — трек outcomes, Фаза 5)
    - [ ] Red: тесты (есть/нет живых кампаний)
    - [ ] Green: реализация
- [ ] Task: Экран S02 — список живых кампаний с рендером по `myRole` (субъекту: M/K + дни; ментору: «отзыв о {Имя}» + дни; имя субъекта — batch-UC `get-users-by-ids`) через `get-my-campaigns`, выбор кампании → S03
    - [ ] Red: тесты
    - [ ] Green: реализация
- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3. Приглашения (S01)

- [ ] Task: Подписка на `student-campaign.created` → два приглашения: субъекту (текст по `subjectOutcome` из события: 4-значная проекция) и ментору («дайте отзыв о студенте {Имя}»), механика `ProactiveSender.invite` (ФР-6), кнопка `💬 Отзывы` → S03 кампании
    - [ ] Red: тесты подписки (адресация, тексты по ролям, одно приглашение каждому получателю)
    - [ ] Green: реализация
- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4. Просмотр S07 и карточка потока

- [ ] Task: Стори просмотра S07 — `list-scope-reviews`, группировка по адресатам (роль — из `direction`, лейбл исхода — `authorOutcome` у автора-студента), пагинация готовым пагинатором трека pagination (`BotPaginator` + `DialogCache`, блок = отзыв, кнопки одним рядом), имена — batch-UC `get-users-by-ids` (готов, трек outcomes, Фаза 6), `⬅️ Назад к потоку`
    - [ ] Red: тесты (формат, статусы, страницы, кеш)
    - [ ] Green: реализация
- [ ] Task: Кнопка `💬 Отзывы` в карточке потока (streams S02) — видимость по фасаду `hasReviews`, мост в стори просмотра
    - [ ] Red: тесты (видимость, переход)
    - [ ] Green: реализация
- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)

## Фаза 5. Документация и финал

- [ ] Task: Обновить ui-spec peer-review (✅-пометки) и ui-spec streams (кнопка S02); удалить `tactics-draft.md`; обновить §5 концепции при отклонениях
- [ ] Task: Полный прогон `bun run check`, триаж по workflow
- [ ] Task: Создать summary.md трека
- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)
