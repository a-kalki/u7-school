import { describe, expect, mock, test } from 'bun:test';
import type { QuestionnaireCompleteEvent } from '@u7-scl/questionnaire/domain';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish } from '#domain/wish/entity';
import { RecordWishEr } from './record-wish-er';

function makeEvent(): QuestionnaireCompleteEvent<{ courseId: string }> {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'questionnaire:complete',
    occurredAt: '2026-08-14T10:00',
    aggregateName: 'Questionnaire',
    aggregateId: crypto.randomUUID(),
    ownerInfo: { courseId: crypto.randomUUID() },
    payload: {
      questionnaireId: crypto.randomUUID(),
      respondentId: crypto.randomUUID(),
    },
  };
}

function setupEr() {
  const save = mock(async (_wish: Wish): Promise<void> => {});
  const getByUserAndCourse = mock(
    async (_userId: string, _courseId: string): Promise<Wish | undefined> =>
      undefined,
  );

  const wishRepo = { save, getByUserAndCourse };

  const er = new RecordWishEr();
  er.init({ wishRepo } as unknown as WishApiModuleResolver);

  return { save, getByUserAndCourse, er };
}

describe('RecordWishEr', () => {
  test('создаёт Wish по событию завершения анкеты', async () => {
    const { save, er } = setupEr();
    const event = makeEvent();

    await er.handle(event);

    expect(save).toHaveBeenCalledTimes(1);
    const saved = (save as ReturnType<typeof mock>).mock.calls[0]![0] as Wish;
    expect(saved.userId).toBe(event.payload.respondentId);
    expect(saved.courseId).toBe(event.ownerInfo.courseId);
    expect(saved.status).toBe('expressed');
  });

  test('идемпотентность: не создаёт Wish если уже выражено', async () => {
    const { save, getByUserAndCourse, er } = setupEr();
    const event = makeEvent();
    getByUserAndCourse.mockResolvedValueOnce({
      uuid: crypto.randomUUID(),
      userId: event.payload.respondentId,
      courseId: event.ownerInfo.courseId,
      status: 'expressed',
      createdAt: '2026-01-01T10:00',
    } as Wish);

    await er.handle(event);

    expect(save).toHaveBeenCalledTimes(0);
  });
});
