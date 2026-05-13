import * as v from "valibot";

/** Метаданные файла — переиспользуемый value-object. */
export const FileMetadataSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	name: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty("Имя файла не может быть пустым"),
	),
	mimeType: v.pipe(v.string(), v.nonEmpty("MIME-тип не может быть пустым")),
	size: v.pipe(
		v.number(),
		v.minValue(0, "Размер файла не может быть отрицательным"),
	),
	description: v.optional(v.string()),
});

export type FileMetadata = v.InferOutput<typeof FileMetadataSchema>;
