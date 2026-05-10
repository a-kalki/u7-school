import * as v from "valibot";

/** Схема метаданных файла */
export const FileMetadataSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	courseId: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	name: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty("Имя файла не может быть пустым"),
	),
	url: v.pipe(v.string(), v.nonEmpty("URL не может быть пустым")),
	mimeType: v.pipe(v.string(), v.nonEmpty("MIME-тип не может быть пустым")),
	size: v.optional(
		v.pipe(
			v.number(),
			v.minValue(0, "Размер файла не может быть отрицательным"),
		),
	),
	description: v.optional(v.string()),
	createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	updatedAt: v.optional(
		v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	),
});

export type FileMetadata = v.InferOutput<typeof FileMetadataSchema>;

/** Метаданные агрегата FileMetadata */
export interface FileMetadataArMeta {
	name: "file-metadata";
	label: "Метаданные файла";
	errors: never;
	state: FileMetadata;
}
