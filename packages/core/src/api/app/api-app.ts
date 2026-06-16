import { errBadRequest, throwError } from '#domain/errors/error-helpers';
import type { NoCommandFoundError } from '#domain/errors/errors';
import type {
  ApiExecutor,
  AppMeta,
  ExtractUcMetaFromMeta,
  GetUcNamesFromMeta,
} from '#domain/types';
import { App } from './app';

export class ApiApp<TMeta extends AppMeta>
  extends App
  implements ApiExecutor<TMeta>
{
  /**
   * Каскадная инициализация: вызывает init() у каждого модуля.
   * Должна вызываться после создания ApiApp и всех модулей.
   */
  init(): void {
    for (const module of this.getModules()) {
      module.init();
    }
  }

  async execute<N extends GetUcNamesFromMeta<TMeta>>(
    ucName: N,
    attrs: ExtractUcMetaFromMeta<TMeta, N>['input'],
    actorId?: string,
  ): Promise<ExtractUcMetaFromMeta<TMeta, N>['output']> {
    const module = this.getModules().find((m) => m.hasCommand(ucName));
    if (!module) {
      return throwError(
        errBadRequest<NoCommandFoundError>(
          'NO_COMMAND_FOUND',
          `Команда '${ucName}' не найдена ни в одном зарегистрированном модуле`,
          { commandName: ucName, moduleName: 'ApiApp' },
        ),
      );
    }

    // Делегируем выполнение модулю — логирование происходит внутри module.handle
    return module.execute(ucName, attrs, actorId);
  }
}
