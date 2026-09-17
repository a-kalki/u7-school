import { describe, expect, test } from 'bun:test';
import type { CampaignParticipant } from '../review-campaign/entity';
import { ReviewPolicy } from './policy';

const UUIDS = {
  alice: '33333333-3333-4333-8333-333333333333',
  bob: '44444444-4444-4444-8444-444444444444',
  carol: '66666666-6666-4666-8666-666666666666',
  mentor: '55555555-5555-4555-8555-555555555555',
};

/** Полный состав кампании: три студента с разными исходами + ментор. */
function participants(): CampaignParticipant[] {
  return [
    { userId: UUIDS.alice, role: 'student', outcome: 'completed' },
    { userId: UUIDS.bob, role: 'student', outcome: 'dropped' },
    { userId: UUIDS.carol, role: 'student', outcome: 'never_started' },
    { userId: UUIDS.mentor, role: 'mentor' },
  ];
}

const byUser = (list: CampaignParticipant[]) => list.map((p) => p.userId);

describe('ReviewPolicy.recipientsOf', () => {
  test('автор «завершил» → все студенты кампании + ментор, без себя', () => {
    const author = participants()[0]!; // alice, completed
    const recipients = ReviewPolicy.recipientsOf(author, participants());
    expect(recipients).toHaveLength(3);
    expect(byUser(recipients).sort()).toEqual(
      [UUIDS.bob, UUIDS.carol, UUIDS.mentor].sort(),
    );
  });

  test('автор «завершил» → адресаты-студенты любого исхода (и «забросил»)', () => {
    const author = participants()[0]!;
    const recipients = ReviewPolicy.recipientsOf(author, participants());
    const bob = recipients.find((p) => p.userId === UUIDS.bob);
    expect(bob?.role).toBe('student');
    expect(bob?.outcome).toBe('dropped');
  });

  test('автор «забросил» → только ментор', () => {
    const author = participants()[1]!; // bob, dropped
    const recipients = ReviewPolicy.recipientsOf(author, participants());
    expect(byUser(recipients)).toEqual([UUIDS.mentor]);
  });

  test('автор «не начал» → только ментор', () => {
    const author = participants()[2]!; // carol, never_started
    const recipients = ReviewPolicy.recipientsOf(author, participants());
    expect(byUser(recipients)).toEqual([UUIDS.mentor]);
  });

  test('автор-ментор → все студенты, без менторов', () => {
    const author = participants()[3]!; // mentor
    const recipients = ReviewPolicy.recipientsOf(author, participants());
    expect(byUser(recipients).sort()).toEqual(
      [UUIDS.alice, UUIDS.bob, UUIDS.carol].sort(),
    );
    expect(recipients.every((p) => p.role === 'student')).toBe(true);
  });

  test('никогда — о себе: автора нет ни в одном списке адресатов', () => {
    for (const author of participants()) {
      const recipients = ReviewPolicy.recipientsOf(author, participants());
      expect(recipients.some((p) => p.userId === author.userId)).toBe(false);
    }
  });

  test('посторонний автор (не участник кампании) — список пуст', () => {
    const stranger: CampaignParticipant = {
      userId: '99999999-9999-4999-8999-999999999999',
      role: 'student',
      outcome: 'completed',
    };
    expect(ReviewPolicy.recipientsOf(stranger, participants())).toEqual([]);
  });
});

describe('ReviewPolicy.canReview', () => {
  const alice = participants()[0]!; // completed
  const bob = participants()[1]!; // dropped
  const carol = participants()[2]!;
  const mentor = participants()[3]!;

  test('разрешённый адресат — true', () => {
    expect(ReviewPolicy.canReview(alice, bob, participants())).toBe(true);
    expect(ReviewPolicy.canReview(alice, mentor, participants())).toBe(true);
    expect(ReviewPolicy.canReview(mentor, carol, participants())).toBe(true);
  });

  test('«забросившему» студенту-одногруппнику — false', () => {
    // carol (never_started) может только ментору
    expect(ReviewPolicy.canReview(carol, alice, participants())).toBe(false);
    expect(ReviewPolicy.canReview(carol, bob, participants())).toBe(false);
    expect(ReviewPolicy.canReview(carol, mentor, participants())).toBe(true);
  });

  test('о себе — всегда false', () => {
    expect(ReviewPolicy.canReview(alice, alice, participants())).toBe(false);
    expect(ReviewPolicy.canReview(mentor, mentor, participants())).toBe(false);
  });

  test('посторонний (не участник кампании) — false', () => {
    const stranger: CampaignParticipant = {
      userId: '99999999-9999-4999-8999-999999999999',
      role: 'student',
      outcome: 'completed',
    };
    expect(ReviewPolicy.canReview(alice, stranger, participants())).toBe(false);
    expect(ReviewPolicy.canReview(stranger, bob, participants())).toBe(false);
  });
});
