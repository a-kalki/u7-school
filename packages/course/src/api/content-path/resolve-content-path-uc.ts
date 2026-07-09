import type {
  ResolveContentPathCmd,
  ResolveContentPathCmdMeta,
} from '#domain/content-path/commands/resolve-content-path-cmd';
import { ResolveContentPathSchema } from '#domain/content-path/commands/resolve-content-path-cmd';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case разрешения контента по ContentPath.
 * Вход: path + streamId/courseId.
 * Выход: структура контента с ролевым фильтром.
 */
export class ResolveContentPathUc extends CourseUseCase<ResolveContentPathCmdMeta> {
  protected readonly ucName = 'resolve-content-path' as const;
  protected readonly ucLabel = 'Разрешить контент по пути' as const;
  protected readonly arMeta = {
    arName: 'Course' as const,
    arLabel: 'Курс' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = ResolveContentPathSchema;
  protected readonly outputSchema = undefined as never; // будет уточнён

  async execute(
    command: ResolveContentPathCmd,
    actorId?: string,
  ): Promise<unknown> {
    throw new Error('Not implemented');
  }
}
