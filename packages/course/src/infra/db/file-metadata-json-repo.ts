import { JsonFileRepo } from "@u7/core/infra";
import type { FileMetadata } from "#domain/file-metadata/entity";
import { FileMetadataSchema } from "#domain/file-metadata/entity";
import type { FileMetadataRepo } from "#domain/file-metadata/repo";

/**
 * JSON-файловая реализация репозитория метаданных файлов.
 * Хранит данные в JSON-файле через {@link JsonFileRepo}.
 */
export class FileMetadataJsonRepo implements FileMetadataRepo {
  readonly #repo: JsonFileRepo<FileMetadata>;

  constructor(filePath = "data/courses/files.json") {
    this.#repo = new JsonFileRepo(FileMetadataSchema, filePath);
  }

  async save(file: FileMetadata): Promise<void> {
    const all = await this.#repo.readAll();
    const idx = all.findIndex((f) => f.uuid === file.uuid);
    if (idx !== -1) {
      all[idx] = file;
    } else {
      all.push(file);
    }
    await this.#repo.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<FileMetadata | undefined> {
    const all = await this.#repo.readAll();
    return all.find((f) => f.uuid === uuid);
  }

  async getByIds(ids: string[]): Promise<FileMetadata[]> {
    const all = await this.#repo.readAll();
    return all.filter((f) => ids.includes(f.uuid));
  }
}
