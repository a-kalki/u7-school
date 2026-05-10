import { Aggregate } from "@u7/core/domain";
import { isoNow } from "@u7/core/shared";
import type { CreateFileMetadataCmd } from "./commands/create-file-metadata-cmd";
import type { FileMetadata, FileMetadataArMeta } from "./entity";
import { FileMetadataSchema } from "./entity";

/**
 * Агрегат FileMetadata — метаданные файла.
 * Хранит информацию о файле, но не сам файл.
 * Функционал загрузки/указания файлов будет реализован в будущих треках.
 */
export class FileMetadataAr extends Aggregate<FileMetadataArMeta> {
	constructor(state: FileMetadata) {
		super(state, FileMetadataSchema);
	}

	/**
	 * Фабричный метод создания новых метаданных файла из команды.
	 */
	static create(command: CreateFileMetadataCmd): FileMetadataAr {
		const candidate: FileMetadata = {
			uuid: crypto.randomUUID(),
			courseId: command.courseId,
			name: command.name,
			url: command.url,
			mimeType: command.mimeType,
			size: command.size,
			description: command.description,
			createdAt: isoNow(),
		};

		return new FileMetadataAr(candidate);
	}
}
