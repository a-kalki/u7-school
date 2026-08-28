import { errNotFound } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { WishAr } from '#domain/wish/a-root';
import type {
  CancelWishCmd,
  CancelWishCmdMeta,
} from '#domain/wish/commands/cancel-wish-cmd';
import { CancelWishCmdSchema } from '#domain/wish/commands/cancel-wish-cmd';
import type { WishTarget } from '#domain/wish/entity';
import type { WishNotFoundUcError } from '#domain/wish/errors';
import { WishUseCase } from '../wish-uc';

/**
 * Use-case отмены желания.
 *
 * Цель отмены явна в команде (дискриминированный вариант по kind:
 * course | module) — резолвится в WishTarget без изменения имени UC.
 */
export class CancelWishUc extends WishUseCase<CancelWishCmdMeta> {
  protected readonly ucName = 'cancel-wish' as const;
  protected readonly ucLabel = 'Отменить желание' as const;
  protected readonly arMeta = {
    arName: WishAr.arName as 'Wish',
    arLabel: WishAr.arLabel as 'Желание',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CancelWishCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: CancelWishCmd, actorId: string): Promise<undefined> {
    const target: WishTarget =
      command.kind === 'course'
        ? { kind: 'course', courseId: command.courseId }
        : { kind: 'module', moduleId: command.moduleId };

    const wish = await this.repo.getByUserAndTarget(actorId, target);
    // Отмена разрешена только из expressed|confirmed; для pending — только abandon.
    if (!wish || (wish.status !== 'expressed' && wish.status !== 'confirmed')) {
      this.throwError(
        errNotFound<WishNotFoundUcError>(
          'WISH_NOT_FOUND',
          'Желание не найдено',
          target.kind === 'course'
            ? { userId: actorId, courseId: target.courseId }
            : { userId: actorId, moduleId: target.moduleId },
        ),
      );
    }

    const ar = new WishAr(wish);
    ar.cancel();
    await this.repo.save(ar.state);

    return undefined;
  }
}
