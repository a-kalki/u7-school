import { ApplicationAr } from "#domain/application/a-root";
import {
	type GetApplicationCmd,
	type GetApplicationCmdMeta,
	GetApplicationCmdSchema,
} from "#domain/application/commands/get-application-cmd";
import type { Application } from "#domain/application/entity";
import { ApplicationSchema } from "#domain/application/entity";
import { OnboardingUseCase } from "../onboarding-uc";

/**
 * Use-case получения заявки по UUID.
 */
export class GetApplicationUc extends OnboardingUseCase<GetApplicationCmdMeta> {
	protected readonly ucName = "get-application" as const;
	protected readonly ucLabel = "Получить заявку по UUID" as const;
	protected readonly arMeta = {
		arName: ApplicationAr.arName as "Application",
		arLabel: ApplicationAr.arLabel as "Заявка",
	};
	protected readonly type = "query" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = GetApplicationCmdSchema;
	protected readonly outputSchema = ApplicationSchema;

	async execute(
		command: GetApplicationCmd,
		actorId?: string,
	): Promise<Application> {
		const application = await this.getApplication(command.uuid);
		const actor = actorId ? await this.getUser(actorId) : undefined;
		return this.getOutApplication(application, actor);
	}
}
