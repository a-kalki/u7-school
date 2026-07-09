import type { ApiModuleMeta, ModuleResolver } from '@u7-scl/core/domain';
import type { AddRoleToUserCmdMeta } from './user/commands/add-role-to-user-cmd';
import type { CreateUserCmdMeta } from './user/commands/create-user-cmd';
import type { GetUserByTelegramIdCmdMeta } from './user/commands/get-user-by-telegram-id-cmd';
import type { GetUserCmdMeta } from './user/commands/get-user-cmd';
import type { ListUsersCmdMeta } from './user/commands/list-users-cmd';
import type { RegisterGuestCmdMeta } from './user/commands/register-guest-cmd';
import type { RemoveRoleToUserCmdMeta } from './user/commands/remove-role-to-user-cmd';
import type { SetNickCmdMeta } from './user/commands/set-nick-cmd';
import type { UserRepo } from './user/repo';

export type UserUcMetas =
  | AddRoleToUserCmdMeta
  | CreateUserCmdMeta
  | GetUserByTelegramIdCmdMeta
  | GetUserCmdMeta
  | ListUsersCmdMeta
  | RegisterGuestCmdMeta
  | RemoveRoleToUserCmdMeta
  | SetNickCmdMeta;

/** Метаданные API-модуля пользователей */
export interface UserApiModuleMeta extends ApiModuleMeta {
  name: 'user';
  url: '/user';
  ucMetas: UserUcMetas;
}

/** Резолвер зависимостей API-модуля пользователей */
export interface UserApiModuleResolver extends ModuleResolver {
  userRepo: UserRepo;
}
