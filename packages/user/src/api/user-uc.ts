import { type UcMeta, UseCase } from '@u7/core/api';
import { errAccessDenied, errNotFound } from '@u7/core/domain';
import type { UserApiModuleResolver } from '#domain/module';
import type {
  AccessDeniedUcError,
  UserNotFoundUcError,
} from '#domain/user/commands/errors';
import type { User } from '#domain/user/entity';

/**
 * Базовый абстрактный класс для всех use-case'ов модуля пользователей.
 * Приватный для пакета @u7/user — не экспортируется наружу.
 */
export abstract class UserUseCase<TMeta extends UcMeta> extends UseCase<
  TMeta,
  UserApiModuleResolver
> {
  /**
   * Получает актора (пользователя) и выбрасывает ошибку, если не найден.
   */
  protected async getActor(actorId: string): Promise<User> {
    const actor = await this.resolve.userRepo.getByUuid(actorId);
    if (!actor) {
      this.throwError(
        errNotFound<UserNotFoundUcError>(
          'USER_NOT_FOUND',
          'Пользователь не найден',
          { uuid: actorId },
        ),
      );
    }
    return actor;
  }

  /**
   * Выбрасывает ошибку "не найдено".
   */
  protected throwNotFound(
    name: UserNotFoundUcError['name'],
    message: string,
    params?: { uuid?: string; telegramId?: number },
  ): never {
    this.throwError(errNotFound<UserNotFoundUcError>(name, message, params));
  }

  /**
   * Выбрасывает ошибку доступа.
   */
  protected throwAccessDenied(
    message = 'Недостаточно прав для выполнения действия',
  ): never {
    this.throwError(
      errAccessDenied<AccessDeniedUcError>('ACCESS_DENIED', message, undefined),
    );
  }
}
