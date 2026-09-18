import { describe, expect, mock, test } from 'bun:test';
import type { PeerReviewApiModule } from '#api/module';
import type { ScopeFacts } from '#domain/review/commands/list-scope-facts-cmd';
import { PeerReviewInProcFacade } from './peer-review-in-proc-facade';

const USER = '22222222-2222-4222-8222-222222222222';
const SCOPE = '11111111-1111-4111-8111-111111111111';

function makeApi(
  executeImpl: () => Promise<unknown> = () => Promise.resolve([]),
) {
  const execute = mock(executeImpl);
  const api = { execute } as unknown as PeerReviewApiModule;
  return { api, execute };
}

describe('PeerReviewInProcFacade (ФР-8 — только делегирование)', () => {
  test('hasLiveCampaigns: reuse get-my-campaigns(onlyLives) → length > 0', async () => {
    const { api, execute } = makeApi(() => Promise.resolve([{ dummy: true }]));
    const facade = new PeerReviewInProcFacade(api);

    const res = await facade.hasLiveCampaigns(USER);
    expect(res).toBe(true);
    expect(execute).toHaveBeenCalledWith(
      'get-my-campaigns',
      { userId: USER, onlyLives: true },
      undefined,
    );
  });

  test('hasLiveCampaigns: пустой список → false', async () => {
    const { api } = makeApi();
    const facade = new PeerReviewInProcFacade(api);
    expect(await facade.hasLiveCampaigns(USER)).toBe(false);
  });

  test('listScopeFacts делегирует в list-scope-facts', async () => {
    const facts: ScopeFacts = { hasReviews: true, reviewsCount: 3 };
    const { api, execute } = makeApi(() => Promise.resolve(facts));
    const facade = new PeerReviewInProcFacade(api);

    const res = await facade.listScopeFacts(SCOPE);
    expect(res).toEqual(facts);
    expect(execute).toHaveBeenCalledWith(
      'list-scope-facts',
      { scopeId: SCOPE },
      undefined,
    );
  });

  test('hasReviews — проекция фактов', async () => {
    const { api } = makeApi(() =>
      Promise.resolve({ hasReviews: false, reviewsCount: 0 }),
    );
    const facade = new PeerReviewInProcFacade(api);

    expect(await facade.hasReviews(SCOPE)).toBe(false);
  });
});
