import type { UcDocType, UseCase } from '#api/uc/use-case';
import { errBadRequest, throwError } from '#domain/errors/error-helpers';
import type { NoCommandFoundError } from '#domain/errors/errors';
import type {
  ApiExecutor,
  ApiModuleMeta,
  AppEnvMode,
  ExtractUcMetaFromMeta,
  GetUcNamesFromMeta,
  ModuleResolver,
} from '#domain/types';
import type { Logger } from '#shared/logger';

/**
 * Абстрактный API-модуль.
 *
 * @typeParam TMeta — метаданные модуля (команды, URL, имя)
 * @typeParam TResolve — резолвер зависимостей (расширяет ModuleResolver)
 */
export abstract class ApiModule<
  TMeta extends ApiModuleMeta,
  TResolve extends ModuleResolver,
> implements ApiExecutor<TMeta>
{
  abstract readonly name: TMeta['name'];
  abstract readonly useCases: UseCase<ApiModuleMeta['ucMetas'], TResolve>[];

  protected resolve!: TResolve;

  logger!: Logger;

  mode!: AppEnvMode;

  private useCaseMap = new Map<
    string,
    UseCase<ApiModuleMeta['ucMetas'], TResolve>
  >();

  constructor(resolve: TResolve) {
    this.resolve = resolve;
  }

  /**
   * Инициализация модуля: логгер, режим, use-case'ы.
   * Вызывается из ApiApp.init() каскадно после создания всех модулей.
   * Безопасен для повторных вызовов — сбрасывает useCaseMap и переинициализирует.
   */
  init(): void {
    this.logger = this.resolve.appResolver.logger;
    this.mode = this.resolve.appResolver.mode;

    this.useCaseMap.clear();
    for (const uc of this.useCases) {
      uc.init(this.resolve);
      this.useCaseMap.set(uc.getUcName(), uc);
    }
  }

  hasCommand(commandName: string): boolean {
    return this.useCaseMap.has(commandName);
  }

  /**
   * Выполняет команду с полной типизацией ввода/вывода.
   */
  async execute<N extends GetUcNamesFromMeta<TMeta>>(
    ucName: N,
    attrs: ExtractUcMetaFromMeta<TMeta, N>['input'],
    actorId?: string,
  ): Promise<ExtractUcMetaFromMeta<TMeta, N>['output']> {
    const start = performance.now();

    const uc = this.useCaseMap.get(ucName);

    if (!uc) {
      this.throwNoCommandFound(ucName);
    }

    const result = await uc.handle(attrs, actorId);

    const elapsed = (performance.now() - start).toFixed(1);
    this.logger.info(
      this.constructor.name,
      `Обработан запрос ${String(ucName)} за ${elapsed}ms`,
    );

    return result;
  }

  protected throwNoCommandFound(commandName: string): never {
    throwError(
      errBadRequest<NoCommandFoundError>(
        'NO_COMMAND_FOUND',
        `Команда '${commandName}' не найдена в модуле '${this.name}'`,
        {
          commandName,
          moduleName: this.name,
        },
      ),
    );
  }

  /**
   * Возвращает метаданные команд модуля.
   * Агрегирует getDocType() каждого use-case.
   */
  getDocTypes(): UcDocType[] {
    return this.useCases.map((uc) => uc.getDocType());
  }
}
