import { type UcMeta, UseCase } from '@u7-scl/core/api';
import type { WishApiModuleResolver } from '#domain/module';
import type { WishRepo } from '#domain/wish/repo';

/**
 * Базовый класс для всех use-case'ов модуля wish.
 */
export abstract class WishUseCase<TMeta extends UcMeta> extends UseCase<
  TMeta,
  WishApiModuleResolver
> {
  protected get repo(): WishRepo {
    return this.resolve.wishRepo;
  }
}
