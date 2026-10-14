# Bun test: e2e-тест на фикстурах протухает, когда календарь проходит `expiresAt`

- **Симптомы:** `E2E peer-review: инфраструктура стенда (smoke) > модуль peer-review зарегистрирован — get-my-campaigns отвечает` падает с `expect(received).toBe(expected) — Expected: true, Received: false`. Вчера тест был зелёным, код не менялся. `bun run check` красный на релизном гейте. Кампания из фикстуры (`c1a11111…`) не находится у ментора.

- **Причина:** В шаблонных фикстурах e2e-стенда (`apps/u7-bot/tests/fixtures/templates/peer-review/campaigns.json`) окно кампании зашито абсолютной датой (`expiresAt: "2026-09-28T10:00"`). Репозиторий (`ReviewCampaignJsonRepo.findActiveByMentor`) фильтрует истёкшие кампании через `now()`, а тест работал на реальных часах. Как только системная дата перешла `expiresAt`, фикстура перестала возвращаться. Комментарий в тесте «без фильтра кампания обязана найтись» вводит в заблуждение: репозиторий фильтрует срок до UC, поэтому «без фильтра» до истёкшей кампании не добраться.

- **Решение:** Заморозь время в e2e-тесте через `spyOn(Shared, 'now')` — тот же приём, что в unit-тестах (`get-my-campaigns-uc.test.ts`, `create-review-uc.test.ts`). `now()` — единая точка чтения часов, поэтому заморозка видна и UC, и инфра-репозиторию.

  ```typescript
  import { afterAll, beforeAll, spyOn } from 'bun:test';
  import * as Shared from '@u7-scl/core/shared';

  // Дата внутри окна фикстуры (createdAt < FROZEN_NOW < expiresAt)
  const FROZEN_NOW = new Date('2026-09-22T12:00');

  let nowSpy: ReturnType<typeof spyOn>;

  beforeAll(async () => {
    nowSpy = spyOn(Shared, 'now').mockReturnValue(FROZEN_NOW);
    // ...
  });

  afterAll(async () => {
    // ...
    nowSpy.mockRestore();
  });
  ```

  Альтернативы (менее предпочтительны): сделать даты фикстур относительными (`Date.now() ± N дней`) в `fixture-loader.ts`; либо продлить `expiresAt` в шаблон далеко в будущее (но тогда не проверить истечение окна).

  Проверка: `bun test apps/u7-bot/tests/e2e/peer-review-smoke.e2e.test.ts` — 3 pass, и в логах время фиксировано (`2026-09-22T12:00:00.000Z`).
