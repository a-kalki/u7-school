import { type UcMeta, UseCase } from "@u7/core";
import type { UserApiModuleResolver } from "../domain/module";
import type { User } from "../domain/user/entity";

/**
 * Базовый абстрактный класс для всех use-case'ов модуля пользователей.
 * Приватный для пакета @u7/user — не экспортируется наружу.
 */
export abstract class UserUseCase<TMeta extends UcMeta> extends UseCase<
  TMeta,
  UserApiModuleResolver
> {
  /**
   * Получает пользователя по его ID.
   * Выбрасывает USER_NOT_FOUND, если пользователь не найден.
   */
  protected async getUser(userId: string): Promise<User> {
    const user = await this.resolve.userRepo.getByUuid(userId);
    if (!user) {
      this.throwNotFound("USER_NOT_FOUND", "Пользователь не найден", {
        uuid: userId,
      });
    }
    return user;
  }

  /**
   * Проверяет права доступа.
   * По умолчанию — доступно всем.
   * Переопределяется в конкретных use-case'ах.
   */
  protected async checkPolicy(
    _command: TMeta["input"],
    _actor: User,
  ): Promise<void> {
    // Доступно всем
  }
}
