import { UserUseCase } from "#api/user-uc";
import { UserAr } from "#domain/user/a-root";
import {
	type AddRoleToUserCmd,
	type AddRoleToUserCmdMeta,
	AddRoleToUserCmdSchema,
} from "#domain/user/commands/add-role-to-user-cmd";
import type { User } from "#domain/user/entity";
import { UserSchema } from "#domain/user/entity";
import { UserPolicy } from "#domain/user/policy";

/**
 * Use-case добавления роли пользователю.
 * Требует прав ADMIN.
 */
export class AddRoleToUserUc extends UserUseCase<AddRoleToUserCmdMeta> {
	protected readonly ucName = "add-role-to-user" as const;
	protected readonly ucLabel = "Добавить роль пользователю" as const;
	protected readonly arMeta = {
		arName: UserAr.arName as "User",
		arLabel: UserAr.arLabel as "Пользователь",
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = AddRoleToUserCmdSchema;
	protected readonly outputSchema = UserSchema;

	async execute(command: AddRoleToUserCmd, actorId: string): Promise<User> {
		const repo = this.resolve.userRepo;

		const actor = await this.getActor(actorId);
		if (!UserPolicy.canAddRole(actor)) {
			this.throwAccessDenied("Недостаточно прав для выполнения действия");
		}

		const target = await repo.getByUuid(command.userId);
		if (!target) {
			this.throwNotFound("USER_NOT_FOUND", "Пользователь не найден", {
				uuid: command.userId,
			});
		}

		const ar = new UserAr(target);
		ar.addRole(command.role);
		await repo.save(ar.state);

		return ar.state;
	}
}
