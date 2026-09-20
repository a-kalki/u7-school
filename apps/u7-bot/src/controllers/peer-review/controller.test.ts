import { describe, expect, test } from 'bun:test';
import { PeerReviewController } from './controller';

describe('PeerReviewController (реестр)', () => {
  test('стори: invite (S01), my-reviews (S02), campaign (S03–S06)', () => {
    const controller = new PeerReviewController();

    const names = controller.getStories().map((s) => s.name);

    expect(names.sort()).toEqual(['campaign', 'invite', 'my-reviews']);
  });

  test('подписка приглашений S01 доставляется через контроллер', () => {
    const controller = new PeerReviewController();

    const events = controller.getEventSubscriptions().map((s) => s.eventName);

    expect(events).toContain('student-campaign.created');
  });
});
