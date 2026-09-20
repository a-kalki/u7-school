import { describe, expect, test } from 'bun:test';
import { AppException } from '@u7-scl/core/domain';
import type { StudentOutcome } from '../review-campaign/entity';
import { ReviewAr } from './a-root';
import type { ReviewDirection } from './entity';
import { REVIEW_TEXT_MIN_LENGTH } from './entity';

const UUIDS = {
  scope: '11111111-1111-4111-8111-111111111111',
  campaign: '22222222-2222-4222-8222-222222222222',
  alice: '33333333-3333-4333-8333-333333333333',
  bob: '44444444-4444-4444-8444-444444444444',
  mentor: '55555555-5555-4555-8555-555555555555',
};

/** 2026-09-21T09:30 UTC */
const NOW = new Date('2026-09-21T09:30Z');

function createReview(
  overrides: Partial<{
    authorId: string;
    direction: ReviewDirection;
    authorOutcome: StudentOutcome | undefined;
    recipientId: string;
    text: string;
  }> = {},
) {
  return ReviewAr.create({
    campaignId: UUIDS.campaign,
    scopeId: UUIDS.scope,
    authorId: overrides.authorId ?? UUIDS.alice,
    direction: overrides.direction ?? 'student_student',
    ...(overrides.authorOutcome !== undefined
      ? { authorOutcome: overrides.authorOutcome }
      : {}),
    recipientId: overrides.recipientId ?? UUIDS.bob,
    text: overrides.text ?? 'Крепкий одногруппник, надёжный в команде.',
    now: NOW,
  });
}

describe('ReviewAr.create', () => {
  test('direction и снапшот исхода автора сохраняются', () => {
    const ar = createReview({ authorOutcome: 'completed_passed' });
    expect(ar.state.campaignId).toBe(UUIDS.campaign);
    expect(ar.state.authorId).toBe(UUIDS.alice);
    expect(ar.state.direction).toBe('student_student');
    expect(ar.state.authorOutcome).toBe('completed_passed');
    expect(ar.state.recipientId).toBe(UUIDS.bob);
  });

  test('автор-ментор — direction mentor_student, без исхода автора', () => {
    const ar = createReview({
      authorId: UUIDS.mentor,
      direction: 'mentor_student',
      authorOutcome: undefined,
      recipientId: UUIDS.bob,
    });
    expect(ar.state.direction).toBe('mentor_student');
    expect(ar.state.authorOutcome).toBeUndefined();
  });

  test('createdAt — из переданного момента (минутная точность)', () => {
    expect(createReview().state.createdAt).toBe('2026-09-21T09:30');
  });

  test('uuid генерируется', () => {
    expect(createReview().state.uuid).not.toBe(createReview().state.uuid);
  });

  test('текст сохраняется', () => {
    const text = 'Спокойный и внимательный, хорошо объясняет.';
    expect(createReview({ text }).state.text).toBe(text);
  });

  test(`текст короче ${REVIEW_TEXT_MIN_LENGTH} — ошибка валидации REVIEW_TEXT_INVALID`, () => {
    try {
      createReview({ text: 'а'.repeat(REVIEW_TEXT_MIN_LENGTH - 1) });
      expect.unreachable('create должен бросить ошибку');
    } catch (e) {
      expect(e).toBeInstanceOf(AppException);
      const error = (e as AppException).error;
      expect(error.name).toBe('REVIEW_TEXT_INVALID');
      expect(error.kind).toBe('validation');
    }
  });

  test('текст длиннее 3500 — ошибка валидации REVIEW_TEXT_INVALID', () => {
    expect(() => createReview({ text: 'а'.repeat(3501) })).toThrow();
  });
});

describe('ReviewAr.overwrite', () => {
  test('заменяет текст и обновляет updatedAt', () => {
    const ar = createReview();
    const newText = 'Дополненный отзыв: вырос в командной работе.';
    ar.overwrite(newText);
    expect(ar.state.text).toBe(newText);
    expect(ar.state.updatedAt).toBeDefined();
  });

  test('перезапись валидна по длине — граница минимума', () => {
    const ar = createReview();
    expect(() =>
      ar.overwrite('б'.repeat(REVIEW_TEXT_MIN_LENGTH)),
    ).not.toThrow();
  });

  test('перезапись коротким текстом — REVIEW_TEXT_INVALID', () => {
    const ar = createReview();
    const before = ar.state.text;
    try {
      ar.overwrite('коротко');
      expect.unreachable('overwrite должен бросить ошибку');
    } catch (e) {
      expect(e).toBeInstanceOf(AppException);
      expect((e as AppException).error.name).toBe('REVIEW_TEXT_INVALID');
    }
    // Состояние не изменилось при отказе
    expect(ar.state.text).toBe(before);
  });

  test('перезапись слишком длинным текстом — ошибка', () => {
    const ar = createReview();
    expect(() => ar.overwrite('б'.repeat(3501))).toThrow();
  });
});
