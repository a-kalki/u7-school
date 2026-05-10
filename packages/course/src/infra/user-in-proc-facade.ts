import type { User } from "@u7/user/domain";
import type { UserApiModule } from "@u7/user/api";
import type { UserFacade } from "#domain/facade";

/**
 * In-process реализация фасада пользователей.
 * Принимает UserApiModule и делегирует вызовы его API.
 */
export class UserInProcFacade implements UserFacade {
  readonly #userApi: UserApiModule;

  constructor(userApi: UserApiModule) {
    this.#userApi = userApi;
  }

  async getUserByUuid(uuid: string): Promise<User | undefined> {
    try {
      const result = await this.#userApi.handle({
        name: "get-user",
        attrs: { uuid },
      });
      return result as User;
    } catch {
      return undefined;
    }
  }

  async userExists(uuid: string): Promise<boolean> {
    const user = await this.getUserByUuid(uuid);
    return user !== undefined;
  }
}
