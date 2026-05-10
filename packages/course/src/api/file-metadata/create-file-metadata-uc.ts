import { errAccessDenied } from "@u7/core/domain";
import { FileMetadataAr } from "#domain/file-metadata/a-root";
import {
  type CreateFileMetadataCmd,
  type CreateFileMetadataCmdMeta,
  CreateFileMetadataCmdSchema,
} from "#domain/file-metadata/commands/create-file-metadata-cmd";
import type { FileMetadataAccessDeniedUcError } from "#domain/file-metadata/commands/errors";
import type { FileMetadata } from "#domain/file-metadata/entity";
import { FileMetadataSchema } from "#domain/file-metadata/entity";
import { FileMetadataPolicy } from "#domain/file-metadata/policy";
import { CoursePolicy } from "#domain/course/policy";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case создания метаданных файла.
 * Требует прав ADMIN/MENTOR + проверка авторства курса через CoursePolicy.
 */
export class CreateFileMetadataUc extends CourseUseCase<CreateFileMetadataCmdMeta> {
  protected readonly commandName = "create-file-metadata" as const;
  protected readonly description = "Создать метаданные файла" as const;
  protected readonly arName = "file-metadata" as const;
  protected readonly arLabel = "Метаданные файла" as const;
  protected readonly type = "command" as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateFileMetadataCmdSchema;
  protected readonly outputSchema = FileMetadataSchema;

  async execute(command: CreateFileMetadataCmd, actorId: string): Promise<FileMetadata> {
    const actor = await this.resolve.userFacade.getUserByUuid(actorId);
    if (!actor) {
      this.throwError(
        errAccessDenied<FileMetadataAccessDeniedUcError>(
          "FILE_METADATA_ACCESS_DENIED",
          "Пользователь не найден",
          undefined,
        ),
      );
    }

    if (!FileMetadataPolicy.canCreate(actor)) {
      this.throwError(
        errAccessDenied<FileMetadataAccessDeniedUcError>(
          "FILE_METADATA_ACCESS_DENIED",
          "Недостаточно прав для создания метаданных файла",
          undefined,
        ),
      );
    }

    const course = await this.getCourse(command.courseId);
    if (!CoursePolicy.canEdit(actor, course)) {
      this.throwError(
        errAccessDenied<FileMetadataAccessDeniedUcError>(
          "FILE_METADATA_ACCESS_DENIED",
          "Вы не являетесь автором курса",
          undefined,
        ),
      );
    }

    const ar = FileMetadataAr.create(command);
    await this.resolve.fileMetadataRepo.save(ar.state);

    return ar.state;
  }
}
