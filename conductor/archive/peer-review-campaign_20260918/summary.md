# Summary: Кампании судьбы студента (peer-review v4)

> Трек завершён 2026-09-20. Следующий шаг по концепции v4 — трек
> [UI отзывов](../../tracks.md): экраны S01–S07, приглашения по
> `student-campaign.created`.

## Цель трека

Редизайн peer-review под концепцию v4: персональные кампании судьбы студента
(`subjectId`, триггеры `student.completed`/`student.abandoned`), ментор —
соавтор в кампании субъекта, мультисобытийная подписка ER в core, ER вместо
UC создания, 4-значная проекция исходов, пользовательские UC, фасад,
json-репозитории, сборка приложения. Поглотил фазы 4–6 трека
[peer-review-domain](../../archive/peer-review-domain_20260916/index.md).

## Выполнено по фазам

- **Фаза 1 (core)** — мультисобытийная подписка ER: `ApiModule.init()`
  подписывает реакцию на каждое имя из `eventNames`; `ErMeta.getEventNames()`.
- **Фаза 2 (домен)** — `subjectId` + контекст `stream_ended` в кампании,
  4-значная проекция исходов участника, адресация ментора «только субъект»
  (`ReviewPolicy`), снапшот участников в момент события.
- **Фаза 3 (stream + ER)** — read-API `StreamFacade.getMembers`
  (ментор + студенты с `outcomeCategory`/`neverStarted`); ER
  `create-student-campaign` вместо UC: идемпотентность по
  `findBySubject`, деградация без throw при недоступном составе потока.
- **Фаза 4 (API)** — пользовательские UC: `get-my-campaigns` (роли
  субъект/ментор, прогресс M/K, дни до закрытия), `get-campaign-recipients`
  (адресаты по политике + ✅), `create-review` (перезапись в живом окне),
  `list-scope-reviews`/`list-scope-facts`; фасад `PeerReviewFacade`.
  Домен вместо логики в UC: `ReviewAr.authorshipOf`, `CampaignFactsDs`.
- **Фаза 5 (инфраструктура)** — `ReviewCampaignJsonRepo` (уникальность
  `(scopeId, subjectId)`), `ReviewJsonRepo` (уникальность пары кампания/
  автор/адресат), инлайн-сборка в `create-api-app.ts` + smoke,
  интеграционный тест вертикали. Покрытие `src/infra` — 100%.
- **Фаза 6 (финал)** — полный прогон (2309 pass), обновление концепции §5,
  этот summary.

## Ключевые решения

- ER подписывается в core (`ApiModule.init()`), bootstrap-код не нужен —
  см. отклонения.
- Идемпотентность ER — на репозитории: уникальность ключа окна
  `(scopeId, subjectId)` гарантирует хранилище.
- Фасад stream отдаёт снапшот окружения субъекта; peer-review не лезет в
  инфраструктуру stream (границы: [domain-boundaries](../../code_styleguides/domain-boundaries.md)).
- Тихая деградация ER: нет состава потока — warn в лог, кампания не создаётся.

## Отклонения от плана

- Артефакт `peer-review-bootstrap` не сохранён: по решению владельца фабрика
  растворена в `create-api-app.ts` (инлайн-сборка, как у остальных модулей).
  Причина: это не паттерн кодовой базы, подписку ER делает core, второго
  потребителя нет; перевод всех модулей на фабрики отклонён (переплетённые
  зависимости, вне скоупа). `2d8fac1`.
- UMV Фаз 5–6 не проводился по прямому указанию владельца («закрывай и
  архивируй трек без ручной проверки»); автопрогон и smoke-тесты зелёные.

## Изменённые файлы

- `packages/core/src/api/module/api-module.ts` — мультисобытийная подписка ER
- `packages/peer-review/src/domain/**` — кампания/отзыв v4, политика, DS фактов
- `packages/peer-review/src/api/**` — ER создания, 5 UC, фасад, ошибки
- `packages/peer-review/src/infra/**` — json-репо, in-proc фасад
- `packages/stream/src/**` — read-API состава потока (`getMembers`)
- `apps/u7-bot/src/create-api-app.ts`, `core/u7-bot-app-meta.ts` — сборка
- `conductor/roadmap/metrics/peer-review-system.md` — §5 статусы
