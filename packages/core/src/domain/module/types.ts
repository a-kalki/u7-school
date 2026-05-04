export interface ModuleMeta {
  name: string;
  url: string;
}

export interface ModuleCommand {
  name: string;
  attrs: unknown;
  actorId?: string;
}
