import type { DomainError } from "@u7/core/domain";

/** Ошибка нарушения инвариантов FileMetadata */
export type FileMetadataArError = DomainError<
  "FILE_METADATA_INVARIANT",
  "domain",
  undefined
>;
