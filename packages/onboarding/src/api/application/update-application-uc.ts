import { ApplicationAr } from "#domain/application/a-root";
import {
	type UpdateApplicationCmd,
	type UpdateApplicationCmdMeta,
	UpdateApplicationCmdSchema,
} from "#domain/application/commands/update-application-cmd";
import type { Application } from "#domain/application/entity";
import { ApplicationSchema } from "#domain/application/entity";
import { ApplicationPolicy } from "#domain/application/policy";
import { OnboardingUseCase } from "../onboarding-uc";

/**
 * Use-case обновления заявки (частичное изменение ответов).
 */
export class UpdateApplicationUc extends OnboardingUseCase<UpdateApplicationCmdMeta> {
	protected readonly ucName = "update-application" as const;
	protected readonly ucLabel = "Обновить заявку" as const;
	protected readonly arMeta = {
		arName: ApplicationAr.arName as "Application",
		arLabel: ApplicationAr.arLabel as "Заявка",
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = UpdateApplicationCmdSchema;
	protected readonly outputSchema = ApplicationSchema;

	async execute(
		command: UpdateApplicationCmd,
		actorId: string,
	): Promise<Application> {
		const actor = await this.getActor(actorId);
		const application = await this.getApplication(command.uuid);

		if (!ApplicationPolicy.canUpdate(actor, application)) {
			this.throwAccessDenied("Недостаточно прав для обновления заявки");
		}

		const ar = new ApplicationAr(application);
		ar.updateAnswers(command);
		await this.resolve.applicationRepo.save(ar.state);

		return ar.state;
	}
}
