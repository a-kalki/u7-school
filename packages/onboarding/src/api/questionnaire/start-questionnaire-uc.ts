import { QuestionnaireAr } from "#domain/questionnaire/a-root";
import {
	type StartQuestionnaireCmd,
	type StartQuestionnaireCmdMeta,
	StartQuestionnaireCmdSchema,
} from "#domain/questionnaire/commands/start-questionnaire-cmd";
import type { Questionnaire } from "#domain/questionnaire/entity";
import { QuestionnaireSchema } from "#domain/questionnaire/entity";
import { QuestionnairePolicy } from "#domain/questionnaire/policy";
import { OnboardingUseCase } from "../onboarding-uc";

/**
 * Use-case начала анкеты.
 * Создаёт новую анкету для пользователя и возвращает её состояние.
 */
export class StartQuestionnaireUc extends OnboardingUseCase<StartQuestionnaireCmdMeta> {
	protected readonly ucName = "start-questionnaire" as const;
	protected readonly ucLabel = "Начать анкету" as const;
	protected readonly arMeta = {
		arName: "Questionnaire" as const,
		arLabel: "Анкета" as const,
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = StartQuestionnaireCmdSchema;
	protected readonly outputSchema = QuestionnaireSchema;

	async execute(
		command: StartQuestionnaireCmd,
		actorId: string,
	): Promise<Questionnaire> {
		const actor = await this.getActor(actorId);

		if (!QuestionnairePolicy.canCreate(actor, command.userId)) {
			this.throwAccessDenied("Недостаточно прав для создания анкеты");
		}

		const poolService = this.resolve.questionPoolService;
		const questionCodes = poolService.getAll().map((q) => q.questionCode);

		const ar = QuestionnaireAr.start(
			command.userId,
			poolService,
			questionCodes,
		);
		await this.resolve.questionnaireRepo.save(ar.state);

		return ar.state;
	}
}
