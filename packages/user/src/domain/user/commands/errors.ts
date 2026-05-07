import type {
	NotFoundError,
	ConflictError,
	AccessDeniedError,
} from "@u7/core";

/** Пользователь не найден */
export type UserNotFoundUcError = NotFoundError<
	"USER_NOT_FOUND",
	{ uuid?: string; telegramId?: number } | undefined
>;

/** Telegram ID уже занят */
export type TelegramIdTakenUcError = ConflictError<
	"TELEGRAM_ID_TAKEN",
	{ telegramId: number } | undefined
>;

/** Bootstrap требует ADMIN роль */
export type BootstrapRequiresAdminUcError = ConflictError<
	"BOOTSTRAP_REQUIRES_ADMIN",
	undefined
>;

/** Доступ запрещён */
export type AccessDeniedUcError = AccessDeniedError<
	"ACCESS_DENIED",
	undefined
>;

/** Любая известная ошибка user-модуля */
export type UserModuleError =
	| UserNotFoundUcError
	| TelegramIdTakenUcError
	| BootstrapRequiresAdminUcError
	| AccessDeniedUcError;
