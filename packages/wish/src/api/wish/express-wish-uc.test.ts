import { describe, expect, mock, test } from 'bun:test';
import type { Course } from '@u7-scl/course/domain';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish } from '#domain/wish/entity';
import { registerQuestionnaireCourse } from '#domain/wish/wish-questionnaire';
import { ExpressWishUc } from './express-wish-uc';

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

function setupUc() {
  const wishRepo = makeWishRepo();
  const getCourse = mock(
    async (_courseId: string): Promise<Course | undefined> =>
      ({ uuid: _courseId }) as Course,
  );
  const startStandard = mock(async (_actorId: string) => {});

  const uc = new ExpressWishUc();
  uc.init({
    wishRepo,
    courseFacade: { getCourse },
    questionnaireFacade: { startStandard },
    userFacade: {},
  } as unknown as WishApiModuleResolver);

  return { wishRepo, getCourse, startStandard, uc };
}

describe('ExpressWishUc', () => {
  const actorId = crypto.randomUUID();
  const courseId = crypto.randomUUID();

  describe('курс без анкеты — мгновенно', () => {
    test('создаёт Wish и возвращает instant', async () => {
      const { wishRepo, uc } = setupUc();

      const result = await uc.handle({ courseId }, actorId);

      expect(result).toEqual({ outcome: 'instant' });
      expect(wishRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('курс с анкетой — questionnaire', () => {
    test('запускает анкету, не создаёт Wish, возвращает questionnaire', async () => {
      const { wishRepo, startStandard, uc } = setupUc();
      const qCourseId = crypto.randomUUID();
      registerQuestionnaireCourse(qCourseId);

      const result = await uc.handle({ courseId: qCourseId }, actorId);

      expect(result).toEqual({ outcome: 'questionnaire' });
      expect(startStandard).toHaveBeenCalledTimes(1);
      expect(wishRepo.save).toHaveBeenCalledTimes(0);
    });
  });

  describe('конфликт', () => {
    test('выбрасывает WISH_ALREADY_EXISTS если желание уже выражено', async () => {
      const { wishRepo, uc } = setupUc();
      wishRepo.getByUserAndTarget.mockResolvedValueOnce({
        uuid: crypto.randomUUID(),
        userId: actorId,
        target: { kind: 'course', courseId },
        status: 'expressed',
        createdAt: '2026-01-01T10:00',
      } as Wish);

      await expect(uc.handle({ courseId }, actorId)).rejects.toThrow(
        'Желание уже выражено',
      );
    });
  });

  describe('курс не найден', () => {
    test('выбрасывает COURSE_NOT_FOUND', async () => {
      const { getCourse, uc } = setupUc();
      getCourse.mockResolvedValueOnce(undefined);

      await expect(uc.handle({ courseId }, actorId)).rejects.toThrow(
        'Курс не найден',
      );
    });
  });
});
