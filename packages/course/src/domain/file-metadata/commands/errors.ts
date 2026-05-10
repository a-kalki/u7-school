import type { AccessDeniedError, NotFoundError, ConflictError } from "@u7/core/domain";

/** Метаданные файла не найдены */
export type FileMetadataNotFoundUcError = NotFoundError<
  "FILE_METADATA_NOT_FOUND",
  { uuid?: string } | undefined
>;

/** Доступ запрещён */
export type FileMetadataAccessDeniedUcError = AccessDeniedError<
  "FILE_METADATA_ACCESS_DENIED",
  undefined
>;

/** Любая известная ошибка file-metadata-модуля */
export type FileMetadataModuleError =
  | FileMetadataNotFoundUcError
  | FileMetadataAccessDeniedUcError;
