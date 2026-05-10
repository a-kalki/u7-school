import * as v from "valibot";
import type { FileMetadata, FileMetadataArMeta } from "../entity";
import { FileMetadataSchema } from "../entity";
import type { FileMetadataNotFoundUcError } from "./errors";

/** Схема валидации команды получения метаданных файла */
export const GetFileMetadataCmdSchema = v.object({
	uuid: FileMetadataSchema.entries.uuid,
});

/** Команда получения метаданных файла */
export type GetFileMetadataCmd = v.InferOutput<typeof GetFileMetadataCmdSchema>;

/** Мета команды получения метаданных файла */
export interface GetFileMetadataCmdMeta {
	commandName: "get-file-metadata";
	description: "Получить метаданные файла по UUID";
	arMeta: FileMetadataArMeta;
	input: GetFileMetadataCmd;
	output: FileMetadata;
	errors: GetFileMetadataCmdError;
	requiresAuth: false;
	type: "query";
}

/** Ошибки команды получения метаданных файла */
export type GetFileMetadataCmdError = FileMetadataNotFoundUcError;
