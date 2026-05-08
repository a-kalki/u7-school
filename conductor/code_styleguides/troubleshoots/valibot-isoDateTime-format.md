# Valibot: `isoDateTime` принимает только `YYYY-MM-DDTHH:mm`, отклоняет миллисекунды и `Z`

- **Симптомы:** Строка `"2026-05-01T12:00:00.000Z"` (стандартный вывод `new Date().toISOString()`) не проходит валидацию через `v.isoDateTime()`. Тест `entity.test.ts` падает с `expect(true).toBe(false)`.

- **Причина:** Valibot `isoDateTime()` по внутренней реализации ожидает формат `YYYY-MM-DDTHH:mm` (без секунд, без миллисекунд, без `Z`). Это НЕ стандартный ISO 8601. `new Date().toISOString()` выдаёт полный формат с миллисекундами и `Z` — он отклоняется.

- **Решение:**

  В коде приложения используй хелпер `isoNow()` из `@u7/core/shared`, который возвращает строку в правильном формате `YYYY-MM-DDTHH:mm` (через `new Date().toISOString().slice(0, 16)`).

  ```typescript
  // ✅ Правильно — через хелпер isoNow
  import { isoNow } from "@u7/core/shared";
  const user: User = {
    // ...
    createdAt: isoNow(),
  };
  ```

  В тестовых фикстурах (plan-object) пиши дату литералом в том же формате `YYYY-MM-DDTHH:mm`:

  ```typescript
  // ✅ Правильно — литерал в формате YYYY-MM-DDTHH:mm
  const valid = {
    // ...
    createdAt: "2026-05-01T12:00",
  };

  // ❌ Неправильно — с миллисекундами и Z
  createdAt: "2026-05-01T12:00:00.000Z",

  // ❌ Неправильно — только дата без времени
  createdAt: "2026-05-01",
  ```

  Если нужно валидировать полный ISO 8601 с миллисекундами и Z — используй `isoTimestamp()`:

  ```typescript
  import { isoTimestamp } from "valibot";
  // isoTimestamp принимает "2026-05-01T12:00:00.000Z"
  ```
