import type { UserApiModule } from '#api/module';
import type { UserFacade } from '#domain/facade';
import type { User } from '#domain/user/entity';
import type { Role } from '#domain/user/roles';

/**
 * In-process реализация фасада пользователей.
 * Принимает UserApiModule и делегирует вызовы его API.
 */
// TODO: Test edit
export class UserInProcFacade implements UserFacade {
  readonly #userApi: UserApiModule;

  constructor(userApi: UserApiModule) {
    this.#userApi = userApi;
  }

  async getUserByUuid(
    uuid: string,
    actorId?: string,
  ): Promise<User | undefined> {
    try {
      const result = await this.#userApi.execute('get-user', { uuid }, actorId);
      return result as User;
    } catch {
      return undefined;
    }
  }

  async userExists(uuid: string, actorId?: string): Promise<boolean> {
    const user = await this.getUserByUuid(uuid, actorId);
    return user !== undefined;
  }

  async updateUserRole(
    userId: string,
    role: Role,
    actorId?: string,
  ): Promise<User | undefined> {
    try {
      const result = await this.#userApi.execute(
        'add-role-to-user',
        { userId, role },
        actorId,
      );
      return result as User;
    } catch {
      return undefined;
    }
  }

  async addRoleToUser(
    userId: string,
    role: Role,
    actorId?: string,
  ): Promise<User | undefined> {
    try {
      const result = await this.#userApi.execute(
        'add-role-to-user',
        { userId, role },
        actorId,
      );
      return result as User;
    } catch {
      return undefined;
    }
  }

  async removeRoleFromUser(
    userId: string,
    role: Role,
    actorId?: string,
  ): Promise<User | undefined> {
    try {
      const result = await this.#userApi.execute(
        'remove-role-to-user',
        { userId, role },
        actorId,
      );
      return result as User;
    } catch {
      return undefined;
    }
  }

  async getUserByTelegramId(
    telegramId: number,
    actorId?: string,
  ): Promise<User | undefined> {
    try {
      const result = await this.#userApi.execute(
        'get-user-by-telegram-id',
        { telegramId },
        actorId,
      );
      return result as User;
    } catch {
      return undefined;
    }
  }

  async registerGuest(
    telegramId: number,
    name: string,
    actorId?: string,
  ): Promise<User> {
    const result = await this.#userApi.execute(
      'register-guest',
      { telegramId, name },
      actorId,
    );
    return result as User;
  }
}
