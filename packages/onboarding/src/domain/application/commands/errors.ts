import type {
	AccessDeniedError,
	ConflictError,
	NotFoundError,
} from "@u7/core/domain";

/** Заявка не найдена */
export type ApplicationNotFoundUcError = NotFoundError<
	"APPLICATION_NOT_FOUND",
	{ uuid?: string; userId?: string } | undefined
>;

/** Заявка для данного пользователя уже существует */
export type ApplicationAlreadyExistsUcError = ConflictError<
	"APPLICATION_ALREADY_EXISTS",
	{ userId: string } | undefined
>;

/** Доступ запрещён */
export type AccessDeniedUcError = AccessDeniedError<"ACCESS_DENIED", undefined>;

/** Любая известная ошибка модуля onboarding */
export type OnboardingModuleError =
	| ApplicationNotFoundUcError
	| ApplicationAlreadyExistsUcError
	| AccessDeniedUcError;
