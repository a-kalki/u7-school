import { Role } from "@u7/user/domain";
import type { User } from "@u7/user/domain";
import type { FileMetadata } from "./entity";

/**
 * Политика прав доступа для метаданных файлов.
 * Stateless — проверяет права на основе роли пользователя.
 */
export const FileMetadataPolicy = {
  canCreate(actor: User): boolean {
    return actor.roles.includes(Role.ADMIN) || actor.roles.includes(Role.MENTOR);
  },

  canRead(_actor: User, _target: FileMetadata): boolean {
    return true;
  },

  canEdit(actor: User, _target: FileMetadata): boolean {
    return actor.roles.includes(Role.ADMIN);
  },
};
