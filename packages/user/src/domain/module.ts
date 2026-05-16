import type { ApiModuleMeta } from '@u7/core/domain';
import type { AddRoleToUserCmdMeta } from './user/commands/add-role-to-user-cmd';
import type { CreateUserCmdMeta } from './user/commands/create-user-cmd';
import type { GetUserByTelegramIdCmdMeta } from './user/commands/get-user-by-telegram-id-cmd';
import type { GetUserCmdMeta } from './user/commands/get-user-cmd';
import type { ListUsersCmdMeta } from './user/commands/list-users-cmd';
import type { RegisterGuestCmdMeta } from './user/commands/register-guest-cmd';
import type { UserRepo } from './user/repo';

export type UserUcMetas =
  | AddRoleToUserCmdMeta
  | CreateUserCmdMeta
  | GetUserByTelegramIdCmdMeta
  | GetUserCmdMeta
  | ListUsersCmdMeta
  | RegisterGuestCmdMeta;

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
