import { U7UseCase } from '@u7-scl/app/domain';
import type { UcMeta } from '@u7-scl/core/api';
import { errAccessDenied, errNotFound } from '@u7-scl/core/domain';
import type { UserApiModuleResolver } from '#domain/module';
import type {
  AccessDeniedUcError,
  UserNotFoundUcError,
} from '#domain/user/commands/errors';

/**
 * Базовый абстрактный класс для всех use-case'ов модуля пользователей.
 * Актор — готовый объект User (резолвится на входе приложения),
 * приходит параметром в execute(command, actor).
 * Приватный для пакета @u7-scl/user — не экспортируется наружу.
 */
export abstract class UserUseCase<TMeta extends UcMeta> extends U7UseCase<
  TMeta,
  UserApiModuleResolver
> {
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
