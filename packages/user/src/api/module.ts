import { ApiModule } from '@u7-scl/core/api';
import type { UserApiModuleMeta, UserApiModuleResolver } from '#domain/module';
import { AddRoleToUserUc } from './user/add-role-to-user-uc';
import { CreateUserUc } from './user/create-user-uc';
import { GetUserByTelegramIdUc } from './user/get-user-by-telegram-id-uc';
import { GetUserUc } from './user/get-user-uc';
import { ListUsersUc } from './user/list-users-uc';
import { RegisterGuestUc } from './user/register-guest-uc';
import { RemoveRoleToUserUc } from './user/remove-role-to-user-uc';
import { UpdateUserRoleUc } from './user/update-user-role-uc';

export class UserApiModule extends ApiModule<
  UserApiModuleMeta,
  UserApiModuleResolver
> {
  readonly name = 'user' as const;
  readonly useCases = [
    new CreateUserUc(),
    new GetUserUc(),
    new ListUsersUc(),
    new GetUserByTelegramIdUc(),
    new RegisterGuestUc(),
    new AddRoleToUserUc(),
    new RemoveRoleToUserUc(),
    new UpdateUserRoleUc(),
  ];

  constructor(resolve: UserApiModuleResolver) {
    super(resolve);
    this.init();
  }
}
