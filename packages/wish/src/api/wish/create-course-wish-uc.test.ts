import { describe, expect, mock, test } from 'bun:test';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish, WishStatus } from '#domain/wish/entity';
import coursePools from '../../domain/wish/pools/course.json';
import { CreateCourseWishUc } from './create-course-wish-uc';

const pooledCourseId = Object.keys(coursePools)[0]!;
const pooledCoursePool =
  coursePools[pooledCourseId as keyof typeof coursePools];

function makeWishRepo() {
  const save = mock(async (_wish: Wish): Promise<void> => {});
  const getByUuid = mock(
    async (_uuid: string): Promise<Wish | undefined> => undefined,
  );
  const getByUserAndTarget = mock(
    async (
      _userId: string,
      _target: Wish['target'],
    ): Promise<Wish | undefined> => undefined,
  );
  const getByUser = mock(async (_userId: string): Promise<Wish[]> => []);

  return { save, getByUuid, getByUserAndTarget, getByUser };
}

function setupUc(facadeOverrides: Record<string, unknown> = {}) {
  const wishRepo = makeWishRepo();
  const isCourseEnrollable = mock(
    async (_courseId: string): Promise<boolean> => true,
  );
  const getCourseStartModuleId = mock(
    async (_courseId: string): Promise<string | undefined> =>
      '11111111-1111-4111-8111-111111111111',
  );
  const startStandard = mock(
    async (_actorId: string, _pool: unknown, _ownerInfo: unknown) => {},
  );

  const uc = new CreateCourseWishUc();
  uc.init({
    wishRepo,
    courseFacade: {
      isCourseEnrollable,
      getCourseStartModuleId,
      ...facadeOverrides,
    },
    questionnaireFacade: { startStandard },
    userFacade: {},
  } as unknown as WishApiModuleResolver);

  return {
    wishRepo,
    isCourseEnrollable,
    getCourseStartModuleId,
    startStandard,
    uc,
  };
}

function makeActiveWish(
  userId: string,
  courseId: string,
  status: WishStatus,
): Wish {
  return {
    uuid: crypto.randomUUID(),
    userId,
    target: { kind: 'course', courseId },
    status,
    createdAt: '2026-01-01T10:00',
  };
}

describe('CreateCourseWishUc', () => {
  const actorId = crypto.randomUUID();
  const plainCourseId = crypto.randomUUID();

  describe('курс без пула — мгновенная фиксация', () => {
    test('создаёт expressed-желание и возвращает instant', async () => {
      const { wishRepo, startStandard, uc } = setupUc();

      const result = await uc.handle({ courseId: plainCourseId }, actorId);

      expect(result).toEqual({ outcome: 'instant' });
      expect(wishRepo.save).toHaveBeenCalledTimes(1);
      const saved = (wishRepo.save as ReturnType<typeof mock>).mock
        .calls[0]![0] as Wish;
      expect(saved.status).toBe('expressed');
      expect(saved.target).toEqual({
        kind: 'course',
        courseId: plainCourseId,
      });
      expect(startStandard).toHaveBeenCalledTimes(0);
    });
  });

  describe('курс с пулом — анкетная ветка', () => {
    test('создаёт pending-желание, запускает анкету, возвращает questionnaire', async () => {
      const { wishRepo, startStandard, uc } = setupUc();

      const result = await uc.handle({ courseId: pooledCourseId }, actorId);

      expect(result).toEqual({ outcome: 'questionnaire' });
      expect(wishRepo.save).toHaveBeenCalledTimes(1);
      const saved = (wishRepo.save as ReturnType<typeof mock>).mock
        .calls[0]![0] as Wish;
      expect(saved.status).toBe('pending');
      expect(startStandard).toHaveBeenCalledTimes(1);
      const [calledActor, calledPool, calledOwner] = (
        startStandard as ReturnType<typeof mock>
      ).mock.calls[0]!;
      expect(calledActor).toBe(actorId);
      expect(calledPool).toEqual(pooledCoursePool);
      expect(calledOwner).toEqual({ courseId: pooledCourseId });
    });
  });

  describe('конфликт', () => {
    test.each([
      'expressed',
      'pending',
      'confirmed',
    ] as const)('WISH_ALREADY_EXISTS при активном желании в статусе %s', async (status) => {
      const { wishRepo, uc } = setupUc();
      wishRepo.getByUserAndTarget.mockResolvedValueOnce(
        makeActiveWish(actorId, plainCourseId, status),
      );

      await expect(
        uc.handle({ courseId: plainCourseId }, actorId),
      ).rejects.toThrow('Желание уже выражено');
    });

    test('повторное желание после cancelled разрешено', async () => {
      const { wishRepo, uc } = setupUc();
      wishRepo.getByUserAndTarget.mockResolvedValueOnce(
        makeActiveWish(actorId, plainCourseId, 'cancelled'),
      );

      const result = await uc.handle({ courseId: plainCourseId }, actorId);

      expect(result).toEqual({ outcome: 'instant' });
    });

    test('активное желание на другой курс не блокирует', async () => {
      const { wishRepo, uc } = setupUc();
      wishRepo.getByUserAndTarget.mockImplementationOnce(
        async (_userId: string, target: Wish['target']) =>
          target.kind === 'course' &&
          target.courseId !== plainCourseId &&
          target.courseId !== pooledCourseId
            ? makeActiveWish(actorId, target.courseId, 'confirmed')
            : undefined,
      );

      const result = await uc.handle({ courseId: plainCourseId }, actorId);

      expect(result).toEqual({ outcome: 'instant' });
    });
  });

  describe('курс не найден', () => {
    test('выбрасывает COURSE_NOT_FOUND', async () => {
      const { isCourseEnrollable, uc } = setupUc();
      isCourseEnrollable.mockResolvedValueOnce(false);

      await expect(
        uc.handle({ courseId: plainCourseId }, actorId),
      ).rejects.toThrow('Курс не найден');
    });
  });

  describe('курс не опубликован', () => {
    const cases = [
      ['draft', false],
      ['archived', false],
    ] as const;

    for (const [label, enrollable] of cases) {
      test(`курс в статусе ${label} → COURSE_NOT_FOUND`, async () => {
        const { isCourseEnrollable, uc } = setupUc();
        isCourseEnrollable.mockResolvedValueOnce(enrollable);

        await expect(
          uc.handle({ courseId: plainCourseId }, actorId),
        ).rejects.toThrow('Курс не найден');
      });
    }
  });

  describe('у курса нет стартового модуля', () => {
    test('пустая программа → COURSE_NOT_FOUND', async () => {
      const { getCourseStartModuleId, uc } = setupUc();
      getCourseStartModuleId.mockResolvedValueOnce(undefined);

      await expect(
        uc.handle({ courseId: plainCourseId }, actorId),
      ).rejects.toThrow('Курс не найден');
    });
  });
});
