import * as v from "valibot";
import { ApplicationAr } from "#domain/application/a-root";
import {
	type ListApplicationsCmd,
	type ListApplicationsCmdMeta,
	ListApplicationsCmdSchema,
} from "#domain/application/commands/list-applications-cmd";
import type { Application } from "#domain/application/entity";
import { ApplicationSchema } from "#domain/application/entity";
import { ApplicationPolicy } from "#domain/application/policy";
import { OnboardingUseCase } from "../onboarding-uc";

/**
 * Use-case списка заявок.
 * Требует прав ADMIN или MENTOR.
 */
export class ListApplicationsUc extends OnboardingUseCase<ListApplicationsCmdMeta> {
	protected readonly ucName = "list-applications" as const;
	protected readonly ucLabel = "Список заявок" as const;
	protected readonly arMeta = {
		arName: ApplicationAr.arName as "Application",
		arLabel: ApplicationAr.arLabel as "Заявка",
	};
	protected readonly type = "query" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = ListApplicationsCmdSchema;
	protected readonly outputSchema = v.array(ApplicationSchema);

	async execute(
		command: ListApplicationsCmd,
		actorId: string,
	): Promise<Application[]> {
		const actor = await this.getActor(actorId);

		if (!ApplicationPolicy.canList(actor)) {
			this.throwAccessDenied("Недостаточно прав для просмотра списка заявок");
		}

		return this.resolve.applicationRepo.getAll({
			status: command.status,
			limit: command.limit,
			sort: command.sort,
		});
	}
}
