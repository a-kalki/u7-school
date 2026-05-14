import * as v from "valibot";
import type { Questionnaire, QuestionnaireArMeta } from "../entity";
import { QuestionnaireSchema } from "../entity";
import type { AccessDeniedUcError } from "../errors";

/** Схема команды списка анкет пользователя */
export const ListQuestionnairesByUserCmdSchema = v.object({
	userId: QuestionnaireSchema.entries.userId,
});

/** Команда списка анкет пользователя */
export type ListQuestionnairesByUserCmd = v.InferOutput<
	typeof ListQuestionnairesByUserCmdSchema
>;

/** Мета команды списка анкет пользователя */
export interface ListQuestionnairesByUserCmdMeta {
	ucName: "list-questionnaires-by-user";
	arMeta: QuestionnaireArMeta;
	input: ListQuestionnairesByUserCmd;
	output: Questionnaire[];
	errors: ListQuestionnairesByUserCmdError;
	requiresAuth: true;
	type: "query";
}

/** Ошибки команды списка анкет пользователя */
export type ListQuestionnairesByUserCmdError = AccessDeniedUcError;
