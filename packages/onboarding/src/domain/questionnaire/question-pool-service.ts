import * as v from "valibot";
import type { Question } from "./question";
import { QuestionSchema } from "./question";
import questionPool from "./question-pool.json" assert { type: "json" };

/** Сервис управления пулом вопросов анкеты */
export class QuestionPoolService {
	private readonly pool: Question[];
	private readonly index: Map<string, Question>;

	constructor(overridePool?: Question[]) {
		const raw = overridePool ?? (questionPool as unknown as Question[]);
		this.pool = this.validate(raw);
		this.index = new Map(this.pool.map((q) => [q.questionCode, q]));
	}

	/** Все вопросы пула */
	getAll(): Question[] {
		return this.pool;
	}

	/** Вопрос по коду */
	getByCode(code: string): Question | undefined {
		return this.index.get(code);
	}

	/**
	 * Строит Valibot-схему валидации ответа для вопроса.
	 */
	buildValidationSchema(questionCode: string): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> {
		const question = this.getByCode(questionCode);
		if (!question) {
			throw new Error(`Вопрос с кодом "${questionCode}" не найден в пуле`);
		}

		if (question.type === "text") {
			return v.pipe(v.string(), v.nonEmpty("Ответ не может быть пустым"));
		}

		const answerCodes = question.answers.map((a) => a.answerCode);

		if (!question.multiple) {
			return v.picklist(answerCodes, "Выберите один из предложенных вариантов");
		}

		return v.pipe(
			v.array(v.string()),
			v.minLength(1, "Выберите хотя бы один вариант"),
			v.check(
				(items) => items.every((item) => answerCodes.includes(item)),
				"Все выбранные значения должны быть допустимыми вариантами",
			),
		);
	}

	/** Валидация целостности пула */
	private validate(rawItems: unknown[]): Question[] {
		const parsed = rawItems.map((item, idx) => {
			try {
				return v.parse(QuestionSchema, item);
			} catch (e) {
				const msg = e instanceof v.ValiError ? e.message : String(e);
				throw new Error(`Ошибка валидации вопроса #${idx}: ${msg}`);
			}
		});

		const codes = new Set<string>();
		for (const q of parsed) {
			if (codes.has(q.questionCode)) {
				throw new Error(`Дублирующийся questionCode: ${q.questionCode}`);
			}
			codes.add(q.questionCode);
		}

		for (let i = 0; i < parsed.length; i++) {
			const q = parsed[i];
			if (q.type === "choice") {
				const answerCodes = new Set<string>();
				for (const a of q.answers) {
					if (answerCodes.has(a.answerCode)) {
						throw new Error(
							`Дублирующийся answerCode "${a.answerCode}" в вопросе "${q.questionCode}"`,
						);
					}
					answerCodes.add(a.answerCode);
				}
			}
			if (q.type === "text") {
				const raw = rawItems[i];
				if (raw && typeof raw === "object" && "answers" in raw) {
					throw new Error(
						`Текстовый вопрос "${q.questionCode}" не должен содержать answers`,
					);
				}
			}
		}

		for (const q of parsed) {
			if (q.condition) {
				if (!codes.has(q.condition.questionCode)) {
					throw new Error(
						`condition в вопросе "${q.questionCode}" ссылается на несуществующий questionCode: ${q.condition.questionCode}`,
					);
				}
			}
		}

		return parsed;
	}
}
