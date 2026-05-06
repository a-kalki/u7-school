/** Пользователь не найден */
export type UserNotFoundUcError = {
  name: "USER_NOT_FOUND";
  level: "domain";
  kind: "not-found";
  message: string;
  payload?: { uuid?: string; telegramId?: number };
};

/** Telegram ID уже занят */
export type TelegramIdTakenUcError = {
  name: "TELEGRAM_ID_TAKEN";
  level: "domain";
  kind: "conflict";
  message: string;
  payload?: { telegramId: number };
};

/** Bootstrap требует ADMIN роль */
export type BootstrapRequiresAdminUcError = {
  name: "BOOTSTRAP_REQUIRES_ADMIN";
  level: "domain";
  kind: "conflict";
  message: string;
};

/** Любая известная ошибка user-модуля */
export type UserModuleError =
  | UserNotFoundUcError
  | TelegramIdTakenUcError
  | BootstrapRequiresAdminUcError;
