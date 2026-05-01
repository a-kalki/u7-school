import * as v from "valibot";

export const FileMetadataSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	name: v.pipe(v.string(), v.nonEmpty("Имя файла не может быть пустым")),
	url: v.pipe(
		v.string(),
		v.nonEmpty("URL не может быть пустым"),
		v.url("Некорректный URL"),
	),
	mimeType: v.pipe(v.string(), v.nonEmpty("MIME-тип не может быть пустым")),
	size: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
	createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	updatedAt: v.optional(
		v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	),
});

export type FileMetadata = v.InferOutput<typeof FileMetadataSchema>;
