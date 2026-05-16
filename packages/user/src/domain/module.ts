import type { ApiModuleMeta } from '@u7/core/domain';
import type { AddRoleToUserCmdMeta } from './user/commands/add-role-to-user-cmd';
import type { CreateUserCmdMeta } from './user/commands/create-user-cmd';
import type { EnsureUserWithRoleCmdMeta } from './user/commands/ensure-user-with-role-cmd';
import type { GetUserByTelegramIdCmdMeta } from './user/commands/get-user-by-telegram-id-cmd';
import type { GetUserCmdMeta } from './user/commands/get-user-cmd';
import type { ListUsersCmdMeta } from './user/commands/list-users-cmd';
import type { RegisterUserCmdMeta } from './user/commands/register-user-cmd';
import type { UserRepo } from './user/repo';

export type UserUcMetas =
  | AddRoleToUserCmdMeta
  | CreateUserCmdMeta
  | EnsureUserWithRoleCmdMeta
  | GetUserByTelegramIdCmdMeta
  | GetUserCmdMeta
  | ListUsersCmdMeta
  | RegisterUserCmdMeta;

/** Метаданные API-модуля пользователей */
export interface UserApiModuleMeta extends ApiModuleMeta {
  name: 'user';
  url: '/user';
  ucMetas: UserUcMetas;
}

/** Резолвер зависимостей API-модуля пользователей */
export interface UserApiModuleResolver {
  userRepo: UserRepo;
}
