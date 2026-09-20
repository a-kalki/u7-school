import * as v from 'valibot';
import { UserUseCase } from '#api/user-uc';
import { UserAr } from '#domain/user/a-root';
import {
  type GetUsersByIdsCmd,
  type GetUsersByIdsCmdMeta,
  GetUsersByIdsCmdSchema,
} from '#domain/user/commands/get-users-by-ids-cmd';
import type { User } from '#domain/user/entity';
import { UserSchema } from '#domain/user/entity';

/**
 * Use-case пакетного получения пользователей по списку UUID.
 * Решает N+1 одиночных запросов из стори: карточки собираются одним
 * обращением к репозиторию. Дубли идентификаторов — дедуп; ненайденные
 * пропускаются с warn-логом (UI рендерит запасной вариант).
 */
export class GetUsersByIdsUc extends UserUseCase<GetUsersByIdsCmdMeta> {
  protected readonly ucName = 'get-users-by-ids' as const;
  protected readonly ucLabel =
    'Пакетное получение пользователей по UUID' as const;
  protected readonly arMeta = {
    arName: UserAr.arName as 'User',
    arLabel: UserAr.arLabel as 'Пользователь',
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = GetUsersByIdsCmdSchema;
  protected readonly outputSchema = v.array(UserSchema);

  async execute(cmd: GetUsersByIdsCmd): Promise<User[]> {
    if (cmd.userIds.length === 0) return [];

    const uniqueIds = [...new Set(cmd.userIds)];
    const users = await this.resolve.userRepo.getByUuids(uniqueIds);

    return this.#collectInRequestOrder(uniqueIds, users);
  }

  /** Собирает результат в порядке запроса; ненайденные пропускает с warn */
  #collectInRequestOrder(uniqueIds: string[], users: User[]): User[] {
    const byUuid = new Map(users.map((u) => [u.uuid, u]));
    const missing: string[] = [];
    const result: User[] = [];

    for (const uuid of uniqueIds) {
      const user = byUuid.get(uuid);
      if (user) {
        result.push(user);
      } else {
        missing.push(uuid);
      }
    }

    if (missing.length > 0) {
      this.resolve.appResolver.logger.warn(
        'user',
        `get-users-by-ids: не найдено пользователей: ${missing.length}`,
        { missing },
      );
    }

    return result;
  }
}
