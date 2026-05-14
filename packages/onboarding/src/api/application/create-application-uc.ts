import { errConflict } from "@u7/core/domain";
import { ApplicationAr } from "#domain/application/a-root";
import {
	type CreateApplicationCmd,
	type CreateApplicationCmdMeta,
	CreateApplicationCmdSchema,
} from "#domain/application/commands/create-application-cmd";
import type { ApplicationAlreadyExistsUcError } from "#domain/application/commands/errors";
import type { Application } from "#domain/application/entity";
import { ApplicationSchema } from "#domain/application/entity";
import { ApplicationPolicy } from "#domain/application/policy";
import { OnboardingDs } from "#domain/onboarding-ds";
import { OnboardingUseCase } from "../onboarding-uc";

/**
 * Use-case создания заявки.
 * Атомарно создаёт заявку и добавляет роль CANDIDATE пользователю.
 */
export class CreateApplicationUc extends OnboardingUseCase<CreateApplicationCmdMeta> {
	protected readonly ucName = "create-application" as const;
	protected readonly ucLabel = "Создать заявку" as const;
	protected readonly arMeta = {
		arName: ApplicationAr.arName as "Application",
		arLabel: ApplicationAr.arLabel as "Заявка",
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = CreateApplicationCmdSchema;
	protected readonly outputSchema = ApplicationSchema;

	async execute(
		command: CreateApplicationCmd,
		actorId: string,
	): Promise<Application> {
		const actor = await this.getActor(actorId);

		if (!ApplicationPolicy.canCreate(actor)) {
			this.throwAccessDenied("Недостаточно прав для создания заявки");
		}

		const user = await this.getUser(command.userId);
		if (!user) {
			this.throwAccessDenied("Пользователь не найден");
		}

		const hasApp = await this.resolve.applicationRepo.hasApplicationForUser(
			command.userId,
		);
		if (hasApp) {
			this.throwError(
				errConflict<ApplicationAlreadyExistsUcError>(
					"APPLICATION_ALREADY_EXISTS",
					"Заявка для данного пользователя уже существует",
					{ userId: command.userId },
				),
			);
		}

		const ds = new OnboardingDs();
		const { application, userAr } = ds.createApplication(command, user);

		const db = this.resolve.db;
		db.begin();
		try {
			await this.resolve.applicationRepo.save(application.state);
			await this.resolve.userRepo.save(userAr.state);
			await db.commit();
		} catch (error) {
			db.rollback();
			throw error;
		}

		return application.state;
	}
}
