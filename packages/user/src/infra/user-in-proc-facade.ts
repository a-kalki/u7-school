import type { UserApiModule } from '#api/module';
import type { UserFacade } from '#domain/facade';
import type { User } from '#domain/user/entity';
import type { Role } from '#domain/user/roles';

/**
 * In-process реализация фасада пользователей.
 * Принимает UserApiModule и делегирует вызовы его API.
 */
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
      const result = await this.#userApi.handle({
        name: 'get-user',
        attrs: { uuid },
        actorId,
      });
      return result as User;
    } catch {
      return undefined;
    }
  }

  async userExists(uuid: string, actorId?: string): Promise<boolean> {
    const user = await this.getUserByUuid(uuid, actorId);
    return user !== undefined;
  }

  async addRoleToUser(
    userId: string,
    role: Role,
    actorId?: string,
  ): Promise<User | undefined> {
    try {
      const result = await this.#userApi.handle({
        name: 'add-role-to-user',
        attrs: { userId, role },
        actorId,
      });
      return result as User;
    } catch {
      return undefined;
    }
  }

  async ensureUserWithRole(telegramId: number, role: Role): Promise<void> {
    try {
      await this.#userApi.handle({
        name: 'ensure-user-with-role',
        attrs: { telegramId, role },
      });
    } catch (e) {
      console.error('Failed to ensure user with role:', e);
    }
  }
}
