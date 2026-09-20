import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { PeerReviewFacade } from '@u7-scl/peer-review/domain';
import { Role } from '@u7-scl/user/domain';
import { MyReviewsStory } from './my-reviews.story';

describe('MyReviewsStory — кнопка меню «💬 Отзывы» (S02)', () => {
  const actor: User = {
    uuid: 'user-1',
    name: 'Аня',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  function makeStory(hasLive: boolean) {
    const facade: PeerReviewFacade = {
      hasLiveCampaigns: mock(
        async (userId: string) => hasLive && userId === actor.uuid,
      ),
      hasReviews: mock(async () => false),
      listScopeFacts: mock(async () => ({
        hasReviews: false,
        reviewsCount: 0,
      })),
    };
    const story = new MyReviewsStory();
    story.init({
      appApi: { execute: mock(async () => []) },
      peerReviewFacade: facade,
    } as never);
    return story;
  }

  test('есть живые кампании → одна кнопка «💬 Отзывы» с кодом my-reviews:hub', async () => {
    const story = makeStory(true);

    const buttons = await story.menuButtons(actor);

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toEqual({
      kind: 'callback',
      text: '💬 Отзывы',
      action: 'my-reviews:hub',
      priority: 25,
      description: '💬 Отзывы — о ком можно рассказать после потока',
    });
  });

  test('нет живых кампаний → кнопки нет (пустой список)', async () => {
    const story = makeStory(false);

    const buttons = await story.menuButtons(actor);

    expect(buttons).toEqual([]);
  });

  test('проверка идёт по фасаду hasLiveCampaigns от id актора', async () => {
    const facade: PeerReviewFacade = {
      hasLiveCampaigns: mock(async () => true),
      hasReviews: mock(async () => false),
      listScopeFacts: mock(async () => ({
        hasReviews: false,
        reviewsCount: 0,
      })),
    };
    const story = new MyReviewsStory();
    story.init({
      appApi: { execute: mock(async () => []) },
      peerReviewFacade: facade,
    } as never);

    await story.menuButtons(actor);

    expect(facade.hasLiveCampaigns).toHaveBeenCalledTimes(1);
    expect(facade.hasLiveCampaigns).toHaveBeenCalledWith(actor.uuid);
  });
});
