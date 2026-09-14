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
  const publish = mock(async (_event: unknown): Promise<void> => {});
  const getByUserAndTarget = mock(
    async (
      _userId: string,
      _target: Wish['target'],
    ): Promise<Wish | undefined> => wish,
  );

  const er = new ConfirmWishEr();
  er.init({
    wishRepo: { save, getByUserAndTarget },
    userFacade: { getUserByUuid: mock() },
    eventBus: { publish },
    appResolver: { logger: { info: mock(), warn: mock(), error: mock() } },
  } as unknown as WishApiModuleResolver);

  return { save, getByUserAndTarget, publish, er };
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
    const { save, publish, er } = setupEr();

    await er.handle(makeEvent());

    expect(save).toHaveBeenCalledTimes(0);
    expect(publish).toHaveBeenCalledTimes(0);
  });

  test('при подтверждении публикует wish.confirmed с адресацией', async () => {
    const event = makeEvent();
    const wish = makePendingWish(event);
    const { publish, er } = setupEr(wish);

    await er.handle(event);

    expect(publish).toHaveBeenCalledTimes(1);
    const published = (publish as ReturnType<typeof mock>).mock
      .calls[0]![0] as {
      eventName: string;
      aggregateName: string;
      aggregateId: string;
      payload: { userId: string; courseId: string };
    };
    expect(published.eventName).toBe('wish.confirmed');
    expect(published.aggregateName).toBe('Wish');
    expect(published.aggregateId).toBe(wish.uuid);
    expect(published.payload).toEqual({
      userId: wish.userId,
      courseId: event.ownerInfo.courseId,
    });
  });

  test('игнор (не-pending) — событие не публикуется', async () => {
    const event = makeEvent();
    const { publish, getByUserAndTarget, er } = setupEr();
    getByUserAndTarget.mockResolvedValueOnce({
      ...makePendingWish(event),
      status: 'confirmed' as const,
    });

    await er.handle(event);

    expect(publish).toHaveBeenCalledTimes(0);
  });
});
