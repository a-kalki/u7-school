import { JsonFileRepo } from '@u7-scl/core/infra';
import type { Stream } from '#domain/stream/entity';
import { StreamSchema } from '#domain/stream/entity';
import type { StreamRepo } from '#domain/stream/repo';

/**
 * JSON-файловая реализация репозитория потоков.
 */
export class StreamJsonRepo implements StreamRepo {
  readonly #repo: JsonFileRepo<Stream>;

  constructor(filePath: string) {
    this.#repo = new JsonFileRepo(StreamSchema, filePath);
  }

  async save(stream: Stream): Promise<void> {
    const all = await this.#repo.readAll();
    const idx = all.findIndex((s) => s.uuid === stream.uuid);

    if (idx !== -1) {
      all[idx] = stream;
    } else {
      all.push(stream);
    }

    await this.#repo.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<Stream | undefined> {
    const all = await this.#repo.readAll();
    return all.find((s) => s.uuid === uuid);
  }

  async getAll(filter?: {
    status?: string;
    mentorId?: string;
  }): Promise<Stream[]> {
    let streams = await this.#repo.readAll();

    if (filter?.status) {
      streams = streams.filter((s) => s.status === filter.status);
    }
    if (filter?.mentorId) {
      streams = streams.filter((s) => s.mentorId === filter.mentorId);
    }

    return streams;
  }
}
