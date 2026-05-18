import type { ApiModuleMeta } from '#domain/types';
import type { ApiModule } from '../module/api-module';

/**
 * Базовое приложение, хранящее модули и предоставляющее единый вход
 */
export abstract class App {
  protected modules = new Map<string, ApiModule<ApiModuleMeta, unknown>>();

  /**
   * @param mods — список API-модулей приложения
   */
  constructor(mods: ApiModule<ApiModuleMeta, unknown>[] = []) {
    for (const m of mods) {
      this.modules.set(m.name, m);
    }
  }

  register(module: ApiModule<ApiModuleMeta, unknown>) {
    this.modules.set(module.name, module);
  }

  getModules(): ApiModule<ApiModuleMeta, unknown>[] {
    return Array.from(this.modules.values());
  }

  getModule(name: string): ApiModule<ApiModuleMeta, unknown> | undefined {
    return this.modules.get(name);
  }
}
