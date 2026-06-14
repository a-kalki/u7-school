import type { ApiModuleMeta, ModuleResolver } from '#domain/types';
import type { ApiModule } from '../module/api-module';

/**
 * Базовое приложение, хранящее модули и предоставляющее единый вход
 */
export abstract class App {
  protected modules = new Map<
    string,
    ApiModule<ApiModuleMeta, ModuleResolver>
  >();

  /**
   * @param mods — список API-модулей приложения
   */
  constructor(mods: ApiModule<ApiModuleMeta, ModuleResolver>[] = []) {
    for (const m of mods) {
      this.modules.set(m.name, m);
    }
  }

  getModules(): ApiModule<ApiModuleMeta, ModuleResolver>[] {
    return Array.from(this.modules.values());
  }

  getModule(
    name: string,
  ): ApiModule<ApiModuleMeta, ModuleResolver> | undefined {
    return this.modules.get(name);
  }
}
