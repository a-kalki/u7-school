import type { User } from '@u7-scl/app/domain';
import { AppException } from '@u7-scl/core/domain';
import type { StreamApiModule } from '#api/module';
import type { StreamFacade, StreamMembers } from '#domain/facade';
import type { Stream } from '#domain/stream/entity';
import { StudentAr } from '#domain/student/a-root';
import type { Student } from '#domain/student/entity';

/**
 * In-process реализация фасада потоков.
 * Принимает StreamApiModule и делегирует вызовы его API.
 */
export class StreamInProcFacade implements StreamFacade {
  readonly #streamApi: StreamApiModule;

  constructor(streamApi: StreamApiModule) {
    this.#streamApi = streamApi;
  }

  async getStream(streamId: string, actor?: User): Promise<Stream | undefined> {
    try {
      const result = await this.#streamApi.execute(
        'get-stream',
        { streamId },
        actor,
      );
      return result as Stream;
    } catch (err) {
      if (err instanceof AppException && err.error.kind === 'not-found') {
        return undefined;
      }
      throw err;
    }
  }

  async getMembers(streamId: string): Promise<StreamMembers | undefined> {
    const stream = await this.getStream(streamId);
    if (!stream) return undefined;

    const students = (await this.#streamApi.execute('list-stream-students', {
      streamId,
    })) as Student[];

    return {
      mentorId: stream.mentorId,
      students: students.map((s) => ({
        userId: s.userId,
        status: s.status,
        neverStarted: new StudentAr(s).neverStarted(),
      })),
    };
  }
}
