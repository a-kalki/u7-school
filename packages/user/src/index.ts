/**
 * @u7/user — Модуль пользователей
 *
 * Публичный API пакета: домен, API-команды, UI-модуль.
 */
// Domain
export * from "./domain/module";
export * from "./domain/user/entity";
export * from "./domain/user/a-root";
export * from "./domain/user/policy";
export * from "./domain/user/roles";
export * from "./domain/user/repo";
export * from "./domain/user/types";
export * from "./domain/user/errors";
export * from "./domain/user/commands/create-user-cmd";
export * from "./domain/user/commands/get-user-cmd";
export * from "./domain/user/commands/list-users-cmd";
export * from "./domain/user/commands/get-user-by-telegram-id-cmd";
export * from "./domain/user/commands/errors";
// API
export * from "./api/module";
export * from "./api/user/create-user-uc";
export * from "./api/user/get-user-uc";
export * from "./api/user/list-users-uc";
export * from "./api/user/get-user-by-telegram-id-uc";
// Infra
export * from "./infra/db/user-inmemory-repo";
// UI
export * from "./ui/auto-ui/module";
