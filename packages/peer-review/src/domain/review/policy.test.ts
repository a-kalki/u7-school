import { describe, expect, test } from 'bun:test';
import type { CampaignParticipant } from '../review-campaign/entity';
import { ReviewPolicy } from './policy';

const UUIDS = {
  alice: '33333333-3333-4333-8333-333333333333',
  bob: '44444444-4444-4444-8444-444444444444',
  carol: '66666666-6666-4666-8666-666666666666',
  dave: '88888888-8888-4888-8888-888888888888',
  mentor: '55555555-5555-4555-8555-555555555555',
};

/**
 * Полный состав кампании: субъект завершает поток, окружение —
 * «ещё учился», «забросил», «не начал» + ментор (ФР-2).
 */
function participants(): CampaignParticipant[] {
  return [
    { userId: UUIDS.alice, role: 'student', outcome: 'completed' },
    { userId: UUIDS.bob, role: 'student', outcome: 'in_progress' },
    { userId: UUIDS.carol, role: 'student', outcome: 'dropped' },
    { userId: UUIDS.dave, role: 'student', outcome: 'never_started' },
    { userId: UUIDS.mentor, role: 'mentor' },
  ];
}

/** Субъект окна — alice (completed). */
const SUBJECT_ID = UUIDS.alice;

const byUser = (list: CampaignParticipant[]) => list.map((p) => p.userId);

describe('ReviewPolicy.recipientsOf', () => {
  test('субъект «завершил» → ментор + соученики completed/in_progress', () => {
    const author = participants()[0]!; // alice, completed
    const recipients = ReviewPolicy.recipientsOf(
      author,
      participants(),
      SUBJECT_ID,
    );
    expect(byUser(recipients).sort()).toEqual([UUIDS.bob, UUIDS.mentor].sort());
  });

  test('субъект «завершил» → «забросившим» и «не начавшим» не пишем', () => {
    const author = participants()[0]!;
    const recipients = ReviewPolicy.recipientsOf(
      author,
      participants(),
      SUBJECT_ID,
    );
    const ids = byUser(recipients);
    expect(ids).not.toContain(UUIDS.carol);
    expect(ids).not.toContain(UUIDS.dave);
  });

  test('субъект «забросил» → только ментор', () => {
    const author = participants()[2]!; // carol, dropped
    const recipients = ReviewPolicy.recipientsOf(
      author,
      participants(),
      SUBJECT_ID,
    );
    expect(byUser(recipients)).toEqual([UUIDS.mentor]);
  });

  test('субъект «не начал» → только ментор', () => {
    const author = participants()[3]!; // dave, never_started
    const recipients = ReviewPolicy.recipientsOf(
      author,
      participants(),
      SUBJECT_ID,
    );
    expect(byUser(recipients)).toEqual([UUIDS.mentor]);
  });

  test('автор-ментор → только субъект окна (ФР-4)', () => {
    const author = participants()[4]!; // mentor
    const recipients = ReviewPolicy.recipientsOf(
      author,
      participants(),
      SUBJECT_ID,
    );
    expect(byUser(recipients)).toEqual([UUIDS.alice]);
  });

  test('никогда — о себе: автора нет ни в одном списке адресатов', () => {
    for (const author of participants()) {
      const recipients = ReviewPolicy.recipientsOf(
        author,
        participants(),
        SUBJECT_ID,
      );
      expect(recipients.some((p) => p.userId === author.userId)).toBe(false);
    }
  });

  test('посторонний автор (не участник кампании) — список пуст', () => {
    const stranger: CampaignParticipant = {
      userId: '99999999-9999-4999-8999-999999999999',
      role: 'student',
      outcome: 'completed',
    };
    expect(
      ReviewPolicy.recipientsOf(stranger, participants(), SUBJECT_ID),
    ).toEqual([]);
  });
});

describe('ReviewPolicy.canReview', () => {
  const alice = participants()[0]!; // completed, субъект
  const bob = participants()[1]!; // in_progress
  const carol = participants()[2]!; // dropped
  const dave = participants()[3]!; // never_started
  const mentor = participants()[4]!;

  test('разрешённый адресат — true', () => {
    expect(ReviewPolicy.canReview(alice, bob, participants(), SUBJECT_ID)).toBe(
      true,
    );
    expect(
      ReviewPolicy.canReview(alice, mentor, participants(), SUBJECT_ID),
    ).toBe(true);
    // Ментор пишет только субъекту
    expect(
      ReviewPolicy.canReview(mentor, alice, participants(), SUBJECT_ID),
    ).toBe(true);
  });

  test('«забросившему» и «не начавшему» соученику — false', () => {
    expect(
      ReviewPolicy.canReview(alice, carol, participants(), SUBJECT_ID),
    ).toBe(false);
    expect(
      ReviewPolicy.canReview(alice, dave, participants(), SUBJECT_ID),
    ).toBe(false);
  });

  test('ментору-автору доступны только субъект, не соученики', () => {
    expect(
      ReviewPolicy.canReview(mentor, bob, participants(), SUBJECT_ID),
    ).toBe(false);
    expect(
      ReviewPolicy.canReview(mentor, carol, participants(), SUBJECT_ID),
    ).toBe(false);
  });

  test('о себе — всегда false', () => {
    expect(
      ReviewPolicy.canReview(alice, alice, participants(), SUBJECT_ID),
    ).toBe(false);
    expect(
      ReviewPolicy.canReview(mentor, mentor, participants(), SUBJECT_ID),
    ).toBe(false);
  });

  test('посторонний (не участник кампании) — false', () => {
    const stranger: CampaignParticipant = {
      userId: '99999999-9999-4999-8999-999999999999',
      role: 'student',
      outcome: 'completed',
    };
    expect(
      ReviewPolicy.canReview(alice, stranger, participants(), SUBJECT_ID),
    ).toBe(false);
    expect(
      ReviewPolicy.canReview(stranger, bob, participants(), SUBJECT_ID),
    ).toBe(false);
  });
});
