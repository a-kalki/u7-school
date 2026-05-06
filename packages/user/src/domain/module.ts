import type { UserRepo } from "./user/repo";

/** Метаданные API-модуля пользователей */
export interface UserModuleMeta {
  name: "user";
  url: "/user";
}

/** Резолвер зависимостей API-модуля пользователей */
export interface UserApiModuleResolver {
  userRepo: UserRepo;
}
