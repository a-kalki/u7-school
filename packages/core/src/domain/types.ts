import type { UcMeta } from '../api/uc/use-case';
import type { Logger } from '../shared/logger';

export interface ApiModuleMeta {
  name: string;
  url: string;
  ucMetas: UcMeta;
}

export interface AppMeta {
  name: string;
  moduleMetas: ApiModuleMeta;
}

export interface ModuleCommand {
  name: string;
  attrs: unknown;
  actorId?: string;
}

// ══ Системные типы ══

/** Режим работы приложения */
export type AppEnvMode = 'test' | 'development' | 'production';

/**
 * Глобальные зависимости уровня приложения.
 * Содержит сквозные сервисы, доступные всем модулям.
 */
export interface AppResolver {
  logger: Logger;
  envMode: AppEnvMode;
}

/**
 * Базовый резолвер модуля.
 * Каждый модуль расширяет его своими специфичными зависимостями.
 */
export interface ModuleResolver {
  appResolver: AppResolver;
}
