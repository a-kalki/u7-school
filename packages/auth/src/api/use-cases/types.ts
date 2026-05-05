import type { AppError } from "@u7/core";

/** Ошибки UseCase модуля auth */
export type AuthUcErrors =
	| {
			name: "USER_NOT_FOUND";
			level: "domain";
			kind: "not-found";
			message: string;
			payload?: { uuid?: string; telegramId?: number };
	  }
	| {
			name: "TELEGRAM_ID_TAKEN";
			level: "domain";
			kind: "conflict";
			message: string;
			payload?: { telegramId: number };
	  }
	| {
			name: "BOOTSTRAP_REQUIRES_ADMIN";
			level: "domain";
			kind: "conflict";
			message: string;
	  }
	| AppError;
