import { describe, expect, mock, test } from 'bun:test';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish, WishStatus } from '#domain/wish/entity';
import { CreateModuleWishUc } from './create-module-wish-uc';

const moduleId = '33333333-3333-4333-8333-333333333333';
const courseId = '44444444-4444-4444-8444-444444444444';

function makeWishRepo(existing?: Wish) {
  const save = mock(async (_wish: Wish): Promise<void> => {});
  const getByUuid = mock(
    async (_uuid: string): Promise<Wish | undefined> => undefined,
  );
  const getByUserAndTarget = mock(
    async (
      _userId: string,
      _target: Wish['target'],
    ): Promise<Wish | undefined> => existing,
  );
  const getByUser = mock(async (_userId: string): Promise<Wish[]> => []);
  return { save, getByUuid, getByUserAndTarget, getByUser };
}

function setupUc(
  opts: {
    existing?: Wish;
    place?: { courseId: string } | undefined;
    enrollable?: boolean;
  } = {},
) {
  const wishRepo = makeWishRepo(opts.existing);
  const getModulePlace = mock(
    async (_moduleId: string): Promise<{ courseId: string } | undefined> =>
      opts.place === undefined ? undefined : opts.place,
  );
  const isCourseEnrollable = mock(
    async (_courseId: string): Promise<boolean> => opts.enrollable ?? true,
  );
  const startStandard = mock(
    async (_actorId: string, _pool: unknown, _ownerInfo: unknown) => {},
  );

  const uc = new CreateModuleWishUc();
  uc.init({
    wishRepo,
    courseFacade: { getModulePlace, isCourseEnrollable },
    questionnaireFacade: { startStandard },
    userFacade: {},
  } as unknown as WishApiModuleResolver);

  return { wishRepo, getModulePlace, isCourseEnrollable, startStandard, uc };
}

function makeActiveWish(status: WishStatus): Wish {
  return {
    uuid: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    target: { kind: 'module', moduleId },
    status,
    createdAt: '2026-01-01T10:00',
  };
}

describe('CreateModuleWishUc', () => {
  const actorId = crypto.randomUUID();

  test('создаёт expressed-желание на модуль без анкеты', async () => {
    const { wishRepo, startStandard, uc } = setupUc({
      place: { courseId },
    });

    await uc.handle({ moduleId }, actorId);

    expect(wishRepo.save).toHaveBeenCalledTimes(1);
    const saved = (wishRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0] as Wish;
    expect(saved.status).toBe('expressed');
    expect(saved.target).toEqual({ kind: 'module', moduleId });
    expect(saved.userId).toBe(actorId);
    // Студент уже верифицирован — анкета не запускается
    expect(startStandard).not.toHaveBeenCalled();
  });

  test('валидация: модуль вне опубликованных курсов → MODULE_NOT_FOUND', async () => {
    const { wishRepo, uc } = setupUc({ place: undefined });

    await expect(uc.handle({ moduleId }, actorId)).rejects.toThrow(
      'Модуль не найден',
    );
    expect(wishRepo.save).not.toHaveBeenCalled();
  });

  test('валидация: курс модуля недоступен для записи → MODULE_NOT_FOUND', async () => {
    const { wishRepo, uc } = setupUc({
      place: { courseId },
      enrollable: false,
    });

    await expect(uc.handle({ moduleId }, actorId)).rejects.toThrow(
      'Модуль не найден',
    );
    expect(wishRepo.save).not.toHaveBeenCalled();
  });

  test('дедуп: активное желание на тот же модуль → WISH_ALREADY_EXISTS', async () => {
    const { wishRepo, uc } = setupUc({
      place: { courseId },
      existing: makeActiveWish('expressed'),
    });

    await expect(uc.handle({ moduleId }, actorId)).rejects.toThrow(
      'Желание уже выражено',
    );
    expect(wishRepo.save).not.toHaveBeenCalled();
  });

  test('дедуп: неактивное желание не мешает создать новое', async () => {
    const { wishRepo, uc } = setupUc({
      place: { courseId },
      existing: makeActiveWish('fulfilled'),
    });

    await uc.handle({ moduleId }, actorId);

    expect(wishRepo.save).toHaveBeenCalledTimes(1);
  });
});
