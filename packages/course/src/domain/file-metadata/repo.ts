import type { FileMetadata } from "./entity";

/** Интерфейс репозитория метаданных файлов */
export interface FileMetadataRepo {
	save(file: FileMetadata): Promise<void>;
	getByUuid(uuid: string): Promise<FileMetadata | undefined>;
	getByIds(ids: string[]): Promise<FileMetadata[]>;
}
