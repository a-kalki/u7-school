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
 */
export class CancelWishUc extends WishUseCase<CancelWishCmdMeta> {
  protected readonly ucName = 'cancel-wish' as const;
  protected readonly ucLabel = 'Отменить желание пройти курс' as const;
  protected readonly arMeta = {
    arName: WishAr.arName as 'Wish',
    arLabel: WishAr.arLabel as 'Желание',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CancelWishCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: CancelWishCmd, actorId: string): Promise<undefined> {
    const target: WishTarget = { kind: 'course', courseId: command.courseId };

    const wish = await this.repo.getByUserAndTarget(actorId, target);
    if (!wish || wish.status !== 'expressed') {
      this.throwError(
        errNotFound<WishNotFoundUcError>(
          'WISH_NOT_FOUND',
          'Желание не найдено',
          { userId: actorId, courseId: command.courseId },
        ),
      );
    }

    const ar = new WishAr(wish);
    ar.cancel();
    await this.repo.save(ar.state);

    return undefined;
  }
}
