import type { ModuleMeta } from "../../domain/module/types";
import { type AboutData, loadAboutFile } from "../shared/about-parser";
import type { UIAppResolver } from "./ui-app";

/**
 * Зависимости, необходимые для инициализации UI-модуля.
 */
export interface UIModuleResolver {
  aboutPath: string;
}

/**
 * Базовый абстрактный класс для UI-модуля.
 * Оборачивает доменный API-модуль и добавляет логику UI.
 */
export abstract class UIModule<
  TMeta extends ModuleMeta,
  AR extends UIAppResolver,
  MR extends UIModuleResolver,
> {
  /** Данные, загруженные из about.md */
  public about: AboutData | null = null;

  public abstract name: TMeta["name"];

  /** Ссылка на резолвер приложения, передается при инициализации в UIApp */
  public appResolver!: AR;

  constructor(protected readonly resolver: MR) { }

  /**
   * Инициализирует модуль, загружает метаданные и сохраняет appResolver.
   */
  async init(appResolver: AR): Promise<void> {
    this.appResolver = appResolver;
    this.about = await loadAboutFile(this.resolver.aboutPath);
    if (!this.about) {
      throw new Error(`Файл about.md не найден или не может быть загружен для модуля '${this.name}' по пути: ${this.resolver.aboutPath}`);
    }
  }

  /**
   * Основной метод рендеринга модуля (должен быть реализован в наследниках).
   */
  abstract render(...args: unknown[]): unknown;
}
