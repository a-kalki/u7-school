# План: Статусы и признаки студента — единый API

> Спецификация: [spec.md](./spec.md). Концепция: [peer-review-system](../../roadmap/metrics/peer-review-system.md), §3.
> Порядок фаз обязателен: 1 → 2 → 3. Внутри фазы — сверху вниз.

## Фаза 1. Домен: API исходов и словарь меток

- [x] Task: Найти по grep все места с собственными switch/картами по `student.status` и `abandonDetails` вне зоны stream — список клиентов для Фазы 2 (f915754e)
- [x] Task: Схемы и типы API исходов: категория, признаки завершения/ухода; вход — состояние студента (ФР-1) (a05a0b9)
- [x] Task: Red: тесты API — все ветки: advanced / not_advanced / abandoned × (voluntary, inactivity, by_mentor) × (шаги есть / нет) / enrolled / active; пограничный abandoned без `abandonDetails` (легаси) (819ad2b)
- [ ] Task: Green: реализация read-слоя (место по правилам границ: домен stream, без обращений к репо)
- [ ] Task: Словарь продуктовых меток (ФР-2): «окончил», «окончил, не прошёл», «забросил», «не начал», «покинул сам», «снят ментором»; тест составных лейблов («не начал · покинул сам»)
- [ ] Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2. Миграция клиентов на API

- [ ] Task: Перевести затронутые клиенты из списка Фазы 1 (лейблы стори: view-stream, monitor, learning и пр.) на API/словарь — по одному, с прогоном тестов
- [ ] Task: Убедиться: в скоупе трека не осталось собственных switch по `status`/`cause` вне нового API (grep из Фазы 1 пуст по закрытым позициям)
- [ ] Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3. Финал трека

- [ ] Task: Полный прогон: `CI=true bun test packages/stream`, `bun run lint packages/stream`, `bun run tslint packages/stream`; при правках UI-сторис — их пакетов
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
