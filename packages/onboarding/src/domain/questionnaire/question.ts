import * as v from "valibot";

/** Условие показа вопроса */
export const ConditionSchema = v.object({
	questionCode: v.pipe(v.string(), v.nonEmpty("Код вопроса в условии не может быть пустым")),
	answerCodes: v.pipe(
		v.array(v.pipe(v.string(), v.nonEmpty("Код ответа не может быть пустым"))),
		v.minLength(1, "answerCodes должен содержать хотя бы один элемент"),
	),
});

export type Condition = v.InferOutput<typeof ConditionSchema>;

/** Вариант ответа */
export const AnswerOptionSchema = v.object({
	answer: v.pipe(v.string(), v.nonEmpty("Текст ответа не может быть пустым")),
	answerCode: v.pipe(v.string(), v.nonEmpty("Код ответа не может быть пустым")),
});

export type AnswerOption = v.InferOutput<typeof AnswerOptionSchema>;

/** Вопрос с выбором ответа */
export const ChoiceQuestionSchema = v.object({
	question: v.pipe(v.string(), v.nonEmpty("Текст вопроса не может быть пустым")),
	questionCode: v.pipe(v.string(), v.nonEmpty("Код вопроса не может быть пустым")),
	type: v.literal("choice"),
	multiple: v.boolean(),
	condition: v.optional(ConditionSchema),
	answers: v.pipe(
		v.array(AnswerOptionSchema),
		v.minLength(1, "Вопрос с выбором должен иметь хотя бы один вариант ответа"),
	),
});

export type ChoiceQuestion = v.InferOutput<typeof ChoiceQuestionSchema>;

/** Текстовый вопрос */
export const TextQuestionSchema = v.object({
	question: v.pipe(v.string(), v.nonEmpty("Текст вопроса не может быть пустым")),
	questionCode: v.pipe(v.string(), v.nonEmpty("Код вопроса не может быть пустым")),
	type: v.literal("text"),
	condition: v.optional(ConditionSchema),
});

export type TextQuestion = v.InferOutput<typeof TextQuestionSchema>;

/** Объединённая схема вопроса */
export const QuestionSchema = v.variant("type", [ChoiceQuestionSchema, TextQuestionSchema]);

export type Question = v.InferOutput<typeof QuestionSchema>;
