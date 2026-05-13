import type { ApiModule } from "../module/api-module";

/**
 * Базовое приложение, хранящее модули и предоставляющее единый вход
 */
export abstract class App {
	// biome-ignore lint/suspicious/noExplicitAny: required for abstract matching
	protected modules = new Map<string, ApiModule<any, any>>();

	// biome-ignore lint/suspicious/noExplicitAny: required for abstract matching
	register(module: ApiModule<any, any>) {
		this.modules.set(module.name, module);
	}

	// biome-ignore lint/suspicious/noExplicitAny: required for abstract matching
	getModules(): ApiModule<any, any>[] {
		return Array.from(this.modules.values());
	}

	// biome-ignore lint/suspicious/noExplicitAny: required for abstract matching
	getModule(name: string): ApiModule<any, any> | undefined {
		return this.modules.get(name);
	}

	async execute(
		moduleName: string,
		ucName: string,
		attrs: Record<string, unknown> = {},
		actorId?: string,
	): Promise<unknown> {
		const mod = this.modules.get(moduleName);
		if (!mod) {
			throw new Error(`Модуль '${moduleName}' не найден`);
		}

		return mod.handle({
			name: ucName,
			attrs,
			actorId,
		});
	}
}
