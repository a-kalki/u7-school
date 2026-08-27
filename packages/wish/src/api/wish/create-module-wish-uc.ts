import { errConflict, errNotFound } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { WishAr } from '#domain/wish/a-root';
import type {
  CreateModuleWishCmd,
  CreateModuleWishCmdMeta,
} from '#domain/wish/commands/create-module-wish-cmd';
import { CreateModuleWishCmdSchema } from '#domain/wish/commands/create-module-wish-cmd';
import type { WishTarget } from '#domain/wish/entity';
import { isWishStatusActive } from '#domain/wish/entity';
import type {
  ModuleNotFoundUcError,
  WishAlreadyExistsUcError,
} from '#domain/wish/errors';
import { WishUseCase } from '../wish-uc';

/**
 * Use-case создания желания пройти модуль («запись на следующий/тот же модуль»).
 *
 * Валидации через фасад курса: модуль существует в опубликованной программе
 * (getModulePlace) и его курс доступен для записи (isCourseEnrollable).
 * Дедуп активного желания на ту же цель. Фиксация мгновенная (expressed),
 * без анкеты — студент уже верифицирован.
 */
export class CreateModuleWishUc extends WishUseCase<CreateModuleWishCmdMeta> {
  protected readonly ucName = 'create-module-wish' as const;
  protected readonly ucLabel = 'Создать желание пройти модуль' as const;
  protected readonly arMeta = {
    arName: WishAr.arName as 'Wish',
    arLabel: WishAr.arLabel as 'Желание',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateModuleWishCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: CreateModuleWishCmd,
    actorId: string,
  ): Promise<undefined> {
    // 1. Модуль существует в программе опубликованного курса.
    const courseFacade = this.resolve.courseFacade;
    const place = await courseFacade.getModulePlace(command.moduleId);
    if (!place) {
      this.throwError(
        errNotFound<ModuleNotFoundUcError>(
          'MODULE_NOT_FOUND',
          'Модуль не найден',
          { moduleId: command.moduleId },
        ),
      );
    }

    // 2. Курс модуля доступен для записи.
    const enrollable = await courseFacade.isCourseEnrollable(place.courseId);
    if (!enrollable) {
      this.throwError(
        errNotFound<ModuleNotFoundUcError>(
          'MODULE_NOT_FOUND',
          'Модуль не найден',
          { moduleId: command.moduleId },
        ),
      );
    }

    // 3. Не более одного активного желания на пару (user, target).
    const target: WishTarget = { kind: 'module', moduleId: command.moduleId };
    const existing = await this.repo.getByUserAndTarget(actorId, target);
    if (existing && isWishStatusActive(existing.status)) {
      this.throwError(
        errConflict<WishAlreadyExistsUcError>(
          'WISH_ALREADY_EXISTS',
          'Желание уже выражено',
          { userId: actorId, moduleId: command.moduleId },
        ),
      );
    }

    // 4. Мгновенная фиксация — без анкеты (студент уже верифицирован).
    const wish = WishAr.express(actorId, target);
    await this.repo.save(wish.state);

    return undefined;
  }
}
