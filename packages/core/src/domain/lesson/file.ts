import * as v from "valibot";

/**
 * Метаданные файла, прикреплённого к уроку.
 */
export const FileMetadataSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  /** Отображаемое имя файла */
  name: v.pipe(v.string(), v.nonEmpty("Имя файла не может быть пустым")),
  /** URL для скачивания/открытия файла */
  url: v.pipe(v.string(), v.nonEmpty("URL не может быть пустым"), v.url("Некорректный URL")),
  /** MIME-тип файла (например, application/pdf) */
  mimeType: v.pipe(v.string(), v.nonEmpty("MIME-тип не может быть пустым")),
  /** Размер файла в байтах (опционально) */
  size: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
});

export type FileMetadata = v.InferOutput<typeof FileMetadataSchema>;
