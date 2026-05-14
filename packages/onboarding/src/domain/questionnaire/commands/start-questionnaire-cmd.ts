import * as v from "valibot";
import type { Questionnaire, QuestionnaireArMeta } from "../entity";
import { QuestionnaireSchema } from "../entity";
import type { AccessDeniedUcError } from "../errors";

/** Схема команды начала анкеты */
export const StartQuestionnaireCmdSchema = v.object({
	userId: QuestionnaireSchema.entries.userId,
});

/** Команда начала анкеты */
export type StartQuestionnaireCmd = v.InferOutput<
	typeof StartQuestionnaireCmdSchema
>;

/** Мета команды начала анкеты */
export interface StartQuestionnaireCmdMeta {
	ucName: "start-questionnaire";
	arMeta: QuestionnaireArMeta;
	input: StartQuestionnaireCmd;
	output: Questionnaire;
	errors: StartQuestionnaireCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды начала анкеты */
export type StartQuestionnaireCmdError = AccessDeniedUcError;
