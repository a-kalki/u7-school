import type { OnboardingApiModule } from "#api/module";
import type { Question } from "#domain/questionnaire/question";
import type { QuestionPoolService } from "#domain/questionnaire/question-pool-service";

/**
 * Описание inline-клавиатуры для вопроса с выбором ответа.
 * Не зависит от Telegram/grammy — чистая структура данных.
 */
export interface KeyboardDescription {
	rows: { text: string; code: string }[][];
	isMultiple: boolean;
}

/**
 * Результат начала анкеты.
 */
export interface StartResult {
	questionnaireUuid: string;
	firstQuestion: Question | null;
}

/**
 * Результат отправки ответа.
 */
export interface SubmitResult {
	nextQuestion: Question | null;
	status: "in_progress" | "completed" | "abandoned";
	isCompleted: boolean;
}

/**
 * Контроллер onboarding для Telegram-бота.
 * Не зависит от grammy/Telegram — только от API-модуля.
 */
export class OnboardingController {
	readonly #api: OnboardingApiModule;
	readonly #poolService: QuestionPoolService;

	constructor(api: OnboardingApiModule, poolService: QuestionPoolService) {
		this.#api = api;
		this.#poolService = poolService;
	}

	/**
	 * Создаёт новую анкету для пользователя.
	 * Возвращает UUID анкеты и первый вопрос.
	 */
	async start(userId: string, actorId: string): Promise<StartResult> {
		const questionnaire = (await this.#api.handle({
			name: "start-questionnaire",
			attrs: { userId },
			actorId,
		})) as { uuid: string; currentQuestionCode: string | null };

		const firstQuestion = questionnaire.currentQuestionCode
			? await this.getCurrentQuestion(questionnaire.uuid, actorId)
			: null;

		return {
			questionnaireUuid: questionnaire.uuid,
			firstQuestion,
		};
	}

	/**
	 * Отправляет ответ на текущий вопрос анкеты.
	 * Возвращает следующий вопрос и статус анкеты.
	 */
	async submitAnswer(
		uuid: string,
		questionCode: string,
		value: string | string[],
		actorId: string,
	): Promise<SubmitResult> {
		const questionnaire = (await this.#api.handle({
			name: "submit-answer",
			attrs: { questionnaireUuid: uuid, questionCode, value },
			actorId,
		})) as {
			status: "in_progress" | "completed" | "abandoned";
			currentQuestionCode: string | null;
		};

		const isCompleted = questionnaire.status === "completed";

		const nextQuestion =
			!isCompleted && questionnaire.currentQuestionCode
				? await this.getCurrentQuestion(uuid, actorId)
				: null;

		return {
			nextQuestion,
			status: questionnaire.status,
			isCompleted,
		};
	}

	/**
	 * Прерывает прохождение анкеты.
	 */
	async abandon(uuid: string, actorId: string): Promise<void> {
		await this.#api.handle({
			name: "abandon-questionnaire",
			attrs: { uuid },
			actorId,
		});
	}

	/**
	 * Получает текущий вопрос анкеты с ответами.
	 */
	async getCurrentQuestion(
		uuid: string,
		actorId: string,
	): Promise<Question | null> {
		const questionnaire = (await this.#api.handle({
			name: "get-questionnaire",
			attrs: { uuid },
			actorId,
		})) as { currentQuestionCode: string | null };

		if (!questionnaire.currentQuestionCode) return null;

		return (
			this.#poolService.getByCode(questionnaire.currentQuestionCode) ?? null
		);
	}

	/**
	 * Возвращает текстовый предпросмотр всех ответов.
	 */
	async getAnswersPreview(uuid: string, actorId: string): Promise<string> {
		const questionnaire = (await this.#api.handle({
			name: "get-questionnaire",
			attrs: { uuid },
			actorId,
		})) as {
			answers: {
				questionCode: string;
				answerCodes: string[];
				textValue?: string;
			}[];
		};

		if (questionnaire.answers.length === 0) {
			return "Пока нет ответов.";
		}

		return questionnaire.answers
			.map((a, i) => {
				const value = a.textValue ?? a.answerCodes.join(", ") ?? "—";
				return `${i + 1}. ${a.questionCode}: ${value}`;
			})
			.join("\n");
	}

	/**
	 * Проверяет, можно ли начать новую анкету.
	 * Новую анкету можно начать, если нет активной (in_progress).
	 */
	async canRestart(userId: string, actorId: string): Promise<boolean> {
		const questionnaires = (await this.#api.handle({
			name: "list-questionnaires-by-user",
			attrs: { userId },
			actorId,
		})) as { status: string }[];

		return !questionnaires.some((q) => q.status === "in_progress");
	}

	/**
	 * Строит описание inline-клавиатуры для вопроса с выбором ответа.
	 */
	getKeyboard(
		question: Question,
		selectedValues?: string[],
	): KeyboardDescription | null {
		if (question.type !== "choice") return null;

		const rows = question.answers.map((a) => [
			{
				text: (selectedValues?.includes(a.answerCode) ? "✅ " : "") + a.answer,
				code: a.answerCode,
			},
		]);

		return {
			rows,
			isMultiple: question.multiple,
		};
	}
}
