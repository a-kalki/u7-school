import { QuestionnaireAr } from "#domain/questionnaire/a-root";
import {
	type AbandonQuestionnaireCmd,
	type AbandonQuestionnaireCmdMeta,
	AbandonQuestionnaireCmdSchema,
} from "#domain/questionnaire/commands/abandon-questionnaire-cmd";
import type { Questionnaire } from "#domain/questionnaire/entity";
import { QuestionnaireSchema } from "#domain/questionnaire/entity";
import { QuestionnairePolicy } from "#domain/questionnaire/policy";
import { OnboardingUseCase } from "../onboarding-uc";

/**
 * Use-case прерывания анкеты.
 */
export class AbandonQuestionnaireUc extends OnboardingUseCase<AbandonQuestionnaireCmdMeta> {
	protected readonly ucName = "abandon-questionnaire" as const;
	protected readonly ucLabel = "Прервать анкету" as const;
	protected readonly arMeta = {
		arName: "Questionnaire" as const,
		arLabel: "Анкета" as const,
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = AbandonQuestionnaireCmdSchema;
	protected readonly outputSchema = QuestionnaireSchema;

	async execute(
		command: AbandonQuestionnaireCmd,
		actorId: string,
	): Promise<Questionnaire> {
		const actor = await this.getActor(actorId);
		const questionnaire = await this.getQuestionnaire(command.uuid);

		if (!QuestionnairePolicy.canAbandon(actor, questionnaire)) {
			this.throwAccessDenied("Недостаточно прав для прерывания анкеты");
		}

		const poolService = this.resolve.questionPoolService;
		const ar = new QuestionnaireAr(
			questionnaire,
			poolService,
			poolService.getAll().map((q) => q.questionCode),
		);
		ar.abandon();

		await this.resolve.questionnaireRepo.save(ar.state);

		return ar.state;
	}
}
