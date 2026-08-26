import { describe, expect, mock, test } from 'bun:test';
import type { QuestionnaireCompleteEvent } from '@u7-scl/questionnaire/domain';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish } from '#domain/wish/entity';
import { ConfirmWishEr } from './confirm-wish-er';

type CompleteEvent = QuestionnaireCompleteEvent<{ courseId: string }>;

function makeEvent(): CompleteEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'questionnaire:complete',
    occurredAt: '2026-08-26T12:00',
    aggregateName: 'Questionnaire',
    aggregateId: crypto.randomUUID(),
    ownerInfo: { courseId: crypto.randomUUID() },
    payload: {
      questionnaireId: crypto.randomUUID(),
      respondentId: crypto.randomUUID(),
    },
  };
}

function setupEr(wish?: Wish) {
  const save = mock(async (_wish: Wish): Promise<void> => {});
  const getByUserAndTarget = mock(
    async (
      _userId: string,
      _target: Wish['target'],
    ): Promise<Wish | undefined> => wish,
  );

  const er = new ConfirmWishEr();
  er.init({
    wishRepo: { save, getByUserAndTarget },
  } as unknown as WishApiModuleResolver);

  return { save, getByUserAndTarget, er };
}

function makePendingWish(event: CompleteEvent): Wish {
  return {
    uuid: crypto.randomUUID(),
    userId: event.payload.respondentId,
    target: { kind: 'course', courseId: event.ownerInfo.courseId },
    status: 'pending',
    createdAt: '2026-08-20T10:00',
  };
}

describe('ConfirmWishEr', () => {
  test('подтверждает ожидающее желание (pending → confirmed)', async () => {
    const event = makeEvent();
    const wish = makePendingWish(event);
    const { save, er } = setupEr(wish);

    await er.handle(event);

    expect(save).toHaveBeenCalledTimes(1);
    const saved = (save as ReturnType<typeof mock>).mock.calls[0]![0] as Wish;
    expect(saved.uuid).toBe(wish.uuid);
    expect(saved.status).toBe('confirmed');
  });

  test('идемпотентность: не-pending желание — игнор без сохранения', async () => {
    const event = makeEvent();
    const { save, getByUserAndTarget, er } = setupEr();
    getByUserAndTarget.mockResolvedValueOnce({
      ...makePendingWish(event),
      status: 'confirmed' as const,
    });

    await er.handle(event);

    expect(save).toHaveBeenCalledTimes(0);
  });

  test('желание не найдено — игнор без ошибок', async () => {
    const { save, er } = setupEr();

    await er.handle(makeEvent());

    expect(save).toHaveBeenCalledTimes(0);
  });
});
