import type { ModuleMeta } from "../../domain/module/types";
import { type AboutData, loadAboutFile } from "../shared/about-parser";
import type { UIModule, UIModuleResolver } from "./ui-module";

/**
 * Зависимости, необходимые для инициализации приложения.
 */
export interface UIAppResolver {
  aboutPath: string;
}

/**
 * Базовый абстрактный класс для UI-приложения.
 * Управляет списком модулей и глобальным состоянием UI.
 */
export abstract class UIApp<TResolver extends UIAppResolver> {
  public about!: AboutData;

  constructor(
    public readonly modules: UIModule<
      ModuleMeta,
      UIAppResolver,
      UIModuleResolver
    >[],
    public readonly resolver: TResolver,
  ) { }

  /**
   * Инициализирует приложение и все зарегистрированные модули.
   */
  async init(): Promise<void> {
    this.about = await loadAboutFile(this.resolver.aboutPath);
    for (const mod of this.modules) {
      await mod.init(this.resolver);
    }
  }

  /**
   * Основной метод рендеринга приложения (должен быть реализован в наследниках).
   */
  abstract render(...args: unknown[]): unknown;
}
