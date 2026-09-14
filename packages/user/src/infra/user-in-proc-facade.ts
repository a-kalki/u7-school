import type { NotifyKind } from '@u7-scl/core/domain';
import { AppException } from '@u7-scl/core/domain';
import type { UserApiModule } from '#api/module';
import type { UserFacade } from '#domain/facade';
import type { User } from '#domain/user/entity';
import type { Role } from '#domain/user/roles';

/**
 * Фасад модуля пользователей.
 */
export class UserInProcFacade implements UserFacade {
  readonly #userApi: UserApiModule;

  constructor(userApi: UserApiModule) {
    this.#userApi = userApi;
  }

  async getUserByUuid(uuid: string, actor?: User): Promise<User | undefined> {
    try {
      const result = await this.#userApi.execute('get-user', { uuid }, actor);
      return result as User;
    } catch (err) {
      if (err instanceof AppException && err.error.kind === 'not-found') {
        return undefined;
      }
      throw err;
    }
  }

  async userExists(uuid: string, actor?: User): Promise<boolean> {
    const user = await this.getUserByUuid(uuid, actor);
    return user !== undefined;
  }

  async updateUserRole(
    userId: string,
    role: Role,
    actor?: User,
  ): Promise<void> {
    await this.#userApi.execute('add-role-to-user', { userId, role }, actor);
  }

  async addRoleToUser(userId: string, role: Role, actor?: User): Promise<void> {
    await this.#userApi.execute('add-role-to-user', { userId, role }, actor);
  }

  async removeRoleFromUser(
    userId: string,
    role: Role,
    actor?: User,
  ): Promise<void> {
    await this.#userApi.execute('remove-role-to-user', { userId, role }, actor);
  }

  async getUserByTelegramId(
    telegramId: number,
    actor?: User,
  ): Promise<User | undefined> {
    try {
      const result = await this.#userApi.execute(
        'get-user-by-telegram-id',
        { telegramId },
        actor,
      );
      return result as User;
    } catch (err) {
      if (err instanceof AppException && err.error.kind === 'not-found') {
        return undefined;
      }
      throw err;
    }
  }

  async registerGuest(
    telegramId: number,
    name: string,
    nick?: string,
    actor?: User,
  ): Promise<User> {
    const result = await this.#userApi.execute(
      'register-guest',
      { telegramId, name, nick },
      actor,
    );
    return result as User;
  }

  async notify(
    userId: string,
    text: string,
    kind?: NotifyKind,
    actor?: User,
  ): Promise<void> {
    await this.#userApi.execute('notify-user', { userId, text, kind }, actor);
  }
}
