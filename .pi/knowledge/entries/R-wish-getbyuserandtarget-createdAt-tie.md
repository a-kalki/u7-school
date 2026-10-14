# u7 домен: getByUserAndTarget при равных createdAt возвращает недетерминированную запись

- **Симптомы:** интеграционный тест wish-флоу: повторный `apply` не возвращает конфликт WISH_ALREADY_EXISTS; cancel по активному желанию возвращает «желание не найдено»; статус в репозитории «не тот». Проявляется только при быстрых последовательных операциях (тесты), в бою — редко.
- **Причина:** `WishJsonRepo.getByUserAndTarget` сортирует совпадения по `createdAt` (лексикографически, точность до минут в isoDateTime → почти всегда равные значения) и возвращает `matches[0]`. При равных `createdAt` порядок сортировки нестабилен, и наверху может оказаться неактивная запись (например, `cancelled`), из-за чего UC «не видит» активное желание.
- **Решение:**
  1. Проверка «не более одного активного» в UC должна идти по **всем** желаниям на цель, а не по «последнему»: добавить в `WishRepo` метод `findAllByUserAndTarget()` и в UC проверять `.find((w) => WishPolicy.isActive(w.status))`.
  2. `getByUserAndTarget` (для потребителей, которым нужно «релевантное» желание: cancel, W04, ER) — сначала сузить выборку до активных (`WishPolicy.isActive`), и только среди них брать последнее по `createdAt`.

```ts
const active = matches.filter((w) => WishPolicy.isActive(w.status));
const pool = active.length > 0 ? active : matches;
pool.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
return pool[0];
```

Смежное: фикстурные `createdAt` писать строго как `2026-06-01T00:00` — valibot `isoDateTime` отклоняет миллисекунды и `Z` (см. `valibot-isoDateTime-format.md`), невалидные записи молча пропускаются при `readAll`.
