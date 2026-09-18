import { describe, expect, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import { PeerReviewApiModule } from './module';

/** Мок-резолвер модуля: инфраструктура появится в Фазе 5 (json-репо). */
function makeResolve() {
  const eventBus = new InProcEventBus();
  return {
    reviewCampaignRepo: {},
    reviewRepo: {},
    streamFacade: {},
    appResolver: { logger: console, mode: 'test' as const, eventBus },
    eventBus,
  };
}

describe('PeerReviewApiModule (каркас)', () => {
  test('инициализируется пустым каркасом (UC/ER добавляются фазами)', () => {
    const mod = new PeerReviewApiModule(
      makeResolve() as unknown as PeerReviewApiModuleResolver,
    );
    mod.init();

    expect(mod.name).toBe('peer-review');
    expect(mod.useCases).toHaveLength(0);
    expect(mod.reactions).toHaveLength(0);
    expect(mod.jobs).toHaveLength(0);
  });
});
