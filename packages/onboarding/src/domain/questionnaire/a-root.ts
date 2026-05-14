import {
	Aggregate,
	errConflict,
	errValidation,
	throwError,
} from "@u7/core/domain";
import { isoNow } from "@u7/core/shared";
import * as v from "valibot";
import type { AnswerEntry, Questionnaire, QuestionnaireArMeta } from "./entity";
import { QuestionnaireSchema } from "./entity";
import type {
	QuestionnaireCompletedUcError,
	QuestionnaireValidationUcError,
} from "./errors";
import type { Question } from "./question";
import type { QuestionPoolService } from "./question-pool-service";

/** Агрегат прохождения анкеты */
export class QuestionnaireAr extends Aggregate<QuestionnaireArMeta> {
	readonly #poolService: QuestionPoolService;
	readonly #questionCodes: string[];

	constructor(
		state: Questionnaire,
		poolService: QuestionPoolService,
		questionCodes: string[],
	) {
		super(state, QuestionnaireSchema);
		this.#poolService = poolService;
		this.#questionCodes = questionCodes;
	}

	/** Фабричный метод — создаёт новую анкету и определяет первый вопрос */
	static start(
		userId: string,
		poolService: QuestionPoolService,
		questionCodes: string[],
	): QuestionnaireAr {
		const state: Questionnaire = {
			uuid: crypto.randomUUID(),
			userId,
			status: "in_progress",
			answers: [],
			currentQuestionCode: null,
			createdAt: isoNow(),
		};
		const ar = new QuestionnaireAr(state, poolService, questionCodes);
		ar.getNextQuestion();
		return ar;
	}

	/** Принимает и валидирует ответ, переходит к следующему вопросу */
	submitAnswer(questionCode: string, value: string[] | string): void {
		if (this.state.status !== "in_progress") {
			throwError(
				errConflict<QuestionnaireCompletedUcError>(
					"QUESTIONNAIRE_COMPLETED",
					"Анкета уже завершена",
					{ uuid: this.state.uuid },
				),
			);
		}

		if (this.state.currentQuestionCode !== questionCode) {
			this.throwBadRequest(
				`Ожидался вопрос "${this.state.currentQuestionCode}", получен "${questionCode}"`,
			);
		}

		const schema = this.#poolService.buildValidationSchema(questionCode);
		try {
			v.parse(schema, value);
		} catch (e) {
			if (e instanceof v.ValiError) {
				throwError(
					errValidation<QuestionnaireValidationUcError>(
						"QUESTIONNAIRE_VALIDATION",
						`Некорректный ответ на вопрос "${questionCode}"`,
						{ questionCode, issues: [e.message] },
					),
				);
			}
			throw e;
		}

		const question = this.#poolService.getByCode(questionCode);
		if (!question) {
			this.throwBadRequest(`Вопрос "${questionCode}" не найден в пуле`);
		}

		const entry: AnswerEntry = {
			questionCode,
			answerCodes:
				question.type === "choice"
					? Array.isArray(value)
						? value
						: [value]
					: [],
			textValue:
				question.type === "text"
					? typeof value === "string"
						? value
						: undefined
					: undefined,
			answeredAt: isoNow(),
		};

		this._state.answers.push(entry);
		this.safeUpdate({});

		this.getNextQuestion();
	}

	/** Определяет следующий вопрос с учётом ветвления */
	getNextQuestion(): Question | null {
		let foundCurrent = this.state.currentQuestionCode === null;

		for (const code of this.#questionCodes) {
			if (!foundCurrent) {
				if (code === this.state.currentQuestionCode) {
					foundCurrent = true;
				}
				continue;
			}

			const question = this.#poolService.getByCode(code);
			if (!question) {
				this.throwBadRequest(`Вопрос "${code}" не найден в пуле`);
			}

			const condition = question.condition;
			if (!condition) {
				this._state.currentQuestionCode = question.questionCode;
				this.safeUpdate({});
				return question;
			}

			const conditionAnswer = this._state.answers.find(
				(a: AnswerEntry) => a.questionCode === condition.questionCode,
			);
			if (conditionAnswer) {
				const hasMatch = conditionAnswer.answerCodes.some((ac: string) =>
					condition.answerCodes.includes(ac),
				);
				if (hasMatch) {
					this._state.currentQuestionCode = question.questionCode;
					this.safeUpdate({});
					return question;
				}
			}
		}

		this._state.status = "completed";
		this._state.currentQuestionCode = null;
		this.safeUpdate({});
		return null;
	}

	/** Прерывает анкету */
	abandon(): void {
		if (this.state.status !== "in_progress") return;
		this._state.status = "abandoned";
		this.safeUpdate({});
	}

	/** Текущее состояние для сериализации */
	getCurrentState(): Questionnaire {
		return this.state;
	}

	/** Все ответы */
	getAnswers(): AnswerEntry[] {
		return this.state.answers;
	}
}
