import * as v from "valibot";
import type { FileMetadata, FileMetadataArMeta } from "../entity";
import { FileMetadataSchema } from "../entity";
import type { FileMetadataAccessDeniedUcError } from "./errors";

/** Схема валидации команды создания метаданных файла */
export const CreateFileMetadataCmdSchema = v.object({
  courseId: FileMetadataSchema.entries.courseId,
  name: FileMetadataSchema.entries.name,
  url: FileMetadataSchema.entries.url,
  mimeType: FileMetadataSchema.entries.mimeType,
  size: FileMetadataSchema.entries.size,
  description: FileMetadataSchema.entries.description,
});

/** Команда создания метаданных файла */
export type CreateFileMetadataCmd = v.InferOutput<typeof CreateFileMetadataCmdSchema>;

/** Мета команды создания метаданных файла */
export interface CreateFileMetadataCmdMeta {
  commandName: "create-file-metadata";
  description: "Создать метаданные файла";
  arMeta: FileMetadataArMeta;
  input: CreateFileMetadataCmd;
  output: FileMetadata;
  errors: CreateFileMetadataCmdError;
  requiresAuth: true;
  type: "command";
}

/** Ошибки команды создания метаданных файла */
export type CreateFileMetadataCmdError = FileMetadataAccessDeniedUcError;
