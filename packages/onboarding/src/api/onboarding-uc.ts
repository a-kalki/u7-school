import { type UcMeta, UseCase } from "@u7/core/api";
import { errAccessDenied, errNotFound } from "@u7/core/domain";
import type { User } from "@u7/user/domain";
import type { OnboardingApiModuleResolver } from "#domain/module";
import type { Questionnaire } from "#domain/questionnaire/entity";
import type {
	AccessDeniedUcError,
	QuestionnaireNotFoundUcError,
} from "#domain/questionnaire/errors";
import { QuestionnairePolicy } from "#domain/questionnaire/policy";

/**
 * Базовый класс для всех use-case'ов модуля onboarding.
 */
export abstract class OnboardingUseCase<TMeta extends UcMeta> extends UseCase<
	TMeta,
	OnboardingApiModuleResolver
> {
	/**
	 * Получает анкету по UUID.
	 * Выбрасывает ошибку, если не найдена.
	 */
	protected async getQuestionnaire(uuid: string): Promise<Questionnaire> {
		const questionnaire = await this.resolve.questionnaireRepo.getByUuid(uuid);
		if (!questionnaire) {
			this.throwError(
				errNotFound<QuestionnaireNotFoundUcError>(
					"QUESTIONNAIRE_NOT_FOUND",
					"Анкета не найдена",
					{ uuid },
				),
			);
		}
		return questionnaire;
	}

	/**
	 * Получает пользователя по ID.
	 * Возвращает undefined, если не найден.
	 */
	protected async getUser(userId: string): Promise<User | undefined> {
		return this.resolve.userFacade.getUserByUuid(userId);
	}

	/**
	 * Получает актора (пользователя) и выбрасывает ошибку, если не найден.
	 */
	protected async getActor(actorId: string): Promise<User> {
		const actor = await this.resolve.userFacade.getUserByUuid(actorId);
		if (!actor) {
			this.throwError(
				errAccessDenied<AccessDeniedUcError>(
					"ACCESS_DENIED",
					"Пользователь не найден",
					undefined,
				),
			);
		}
		return actor;
	}

	/**
	 * Выбрасывает ошибку доступа.
	 */
	protected throwAccessDenied(
		message = "Недостаточно прав для выполнения действия",
	): never {
		this.throwError(
			errAccessDenied<AccessDeniedUcError>("ACCESS_DENIED", message, undefined),
		);
	}

	/**
	 * Возвращает анкету в читаемом виде.
	 * Бросает ACCESS_DENIED если анкета не видна актору.
	 */
	protected getOutQuestionnaire(
		questionnaire: Questionnaire,
		actor?: User,
	): Questionnaire {
		if (!actor) {
			// Без актора анкеты не видны (все анкеты приватные)
			this.throwAccessDenied("Нет доступа к анкете");
		}
		if (!QuestionnairePolicy.canRead(actor, questionnaire)) {
			this.throwAccessDenied("Нет доступа к анкете");
		}
		return questionnaire;
	}
}
