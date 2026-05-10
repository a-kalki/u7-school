import { errNotFound } from "@u7/core/domain";
import {
  type GetFileMetadataCmd,
  type GetFileMetadataCmdMeta,
  GetFileMetadataCmdSchema,
} from "#domain/file-metadata/commands/get-file-metadata-cmd";
import type { FileMetadataNotFoundUcError } from "#domain/file-metadata/commands/errors";
import type { FileMetadata } from "#domain/file-metadata/entity";
import { FileMetadataSchema } from "#domain/file-metadata/entity";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case получения метаданных файла по UUID.
 * Доступно всем.
 */
export class GetFileMetadataUc extends CourseUseCase<GetFileMetadataCmdMeta> {
  protected readonly commandName = "get-file-metadata" as const;
  protected readonly description = "Получить метаданные файла по UUID" as const;
  protected readonly arName = "file-metadata" as const;
  protected readonly arLabel = "Метаданные файла" as const;
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetFileMetadataCmdSchema;
  protected readonly outputSchema = FileMetadataSchema;

  async execute(command: GetFileMetadataCmd): Promise<FileMetadata> {
    const file = await this.resolve.fileMetadataRepo.getByUuid(command.uuid);
    if (!file) {
      this.throwError(
        errNotFound<FileMetadataNotFoundUcError>(
          "FILE_METADATA_NOT_FOUND",
          "Метаданные файла не найдены",
          { uuid: command.uuid },
        ),
      );
    }
    return file;
  }
}
