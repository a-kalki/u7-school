import type { UcMeta } from '../api/uc/use-case';

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
