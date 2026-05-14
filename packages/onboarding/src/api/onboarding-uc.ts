import { type UcMeta, UseCase } from "@u7/core/api";
import { errAccessDenied, errNotFound } from "@u7/core/domain";
import type { User } from "@u7/user/domain";
import type {
	AccessDeniedUcError,
	ApplicationNotFoundUcError,
} from "#domain/application/commands/errors";
import type { Application } from "#domain/application/entity";
import { ApplicationPolicy } from "#domain/application/policy";
import type { OnboardingApiModuleResolver } from "#domain/module";

/**
 * Базовый класс для всех use-case'ов модуля onboarding.
 */
export abstract class OnboardingUseCase<TMeta extends UcMeta> extends UseCase<
	TMeta,
	OnboardingApiModuleResolver
> {
	/**
	 * Получает заявку по UUID.
	 * Выбрасывает ошибку, если не найдена.
	 */
	protected async getApplication(uuid: string): Promise<Application> {
		const application = await this.resolve.applicationRepo.getByUuid(uuid);
		if (!application) {
			this.throwError(
				errNotFound<ApplicationNotFoundUcError>(
					"APPLICATION_NOT_FOUND",
					"Заявка не найдена",
					{ uuid },
				),
			);
		}
		return application;
	}

	/**
	 * Получает пользователя по ID.
	 * Возвращает undefined, если не найден.
	 */
	protected async getUser(userId: string): Promise<User | undefined> {
		return this.resolve.userRepo.getByUuid(userId);
	}

	/**
	 * Получает актора (пользователя) и выбрасывает ошибку, если не найден.
	 */
	protected async getActor(actorId: string): Promise<User> {
		const actor = await this.getUser(actorId);
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
	 * Возвращает заявку в читаемом виде.
	 * Бросает ACCESS_DENIED если заявка не видна актору.
	 */
	protected getOutApplication(
		application: Application,
		actor?: User,
	): Application {
		if (!actor) {
			// Без актора никто не может читать (все заявки приватные)
			this.throwAccessDenied("Нет доступа к заявке");
		}
		if (!ApplicationPolicy.canRead(actor, application)) {
			this.throwAccessDenied("Нет доступа к заявке");
		}
		return application;
	}
}
