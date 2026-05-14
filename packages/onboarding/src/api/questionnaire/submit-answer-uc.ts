import { Role } from "@u7/user/domain";
import { QuestionnaireAr } from "#domain/questionnaire/a-root";
import {
	type SubmitAnswerCmd,
	type SubmitAnswerCmdMeta,
	SubmitAnswerCmdSchema,
} from "#domain/questionnaire/commands/submit-answer-cmd";
import type { Questionnaire } from "#domain/questionnaire/entity";
import { QuestionnaireSchema } from "#domain/questionnaire/entity";
import { QuestionnairePolicy } from "#domain/questionnaire/policy";
import { OnboardingUseCase } from "../onboarding-uc";

/**
 * Use-case отправки ответа на вопрос анкеты.
 * При завершении анкеты вызывает добавление роли CANDIDATE пользователю.
 *
 * Примечание: сохранение анкеты и обновление роли выполняются
 * НЕ в транзакции. При сбое добавления роли анкета уже будет сохранена
 * как completed, но роль может не обновиться.
 */
export class SubmitAnswerUc extends OnboardingUseCase<SubmitAnswerCmdMeta> {
	protected readonly ucName = "submit-answer" as const;
	protected readonly ucLabel = "Отправить ответ" as const;
	protected readonly arMeta = {
		arName: "Questionnaire" as const,
		arLabel: "Анкета" as const,
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = SubmitAnswerCmdSchema;
	protected readonly outputSchema = QuestionnaireSchema;

	async execute(
		command: SubmitAnswerCmd,
		actorId: string,
	): Promise<Questionnaire> {
		const actor = await this.getActor(actorId);
		const questionnaire = await this.getQuestionnaire(
			command.questionnaireUuid,
		);

		if (!QuestionnairePolicy.canSubmitAnswer(actor, questionnaire)) {
			this.throwAccessDenied("Недостаточно прав для отправки ответа");
		}

		const poolService = this.resolve.questionPoolService;
		const ar = new QuestionnaireAr(
			questionnaire,
			poolService,
			poolService.getAll().map((q) => q.questionCode),
		);

		ar.submitAnswer(command.questionCode, command.value);

		// Если анкета завершена — добавляем роль CANDIDATE
		if (ar.state.status === "completed") {
			await this.resolve.userFacade.addRoleToUser(
				questionnaire.userId,
				Role.CANDIDATE,
				actorId,
			);
		}

		await this.resolve.questionnaireRepo.save(ar.state);

		return ar.state;
	}
}
