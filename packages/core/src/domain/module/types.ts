import type { UcMeta } from "../../api/uc/use-case";

export interface ApiModuleMeta<TUcMetas extends UcMeta = UcMeta> {
	name: string;
	url: string;
}

export interface AppMeta<TModules extends ApiModuleMeta<any>> {
	name: string;
}

export interface ModuleCommand {
	name: string;
	attrs: unknown;
	actorId?: string;
}
