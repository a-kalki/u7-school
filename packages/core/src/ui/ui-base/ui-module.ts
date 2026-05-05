import type { Module } from "../../api/module/module";
import type { UcDocType } from "../../api/uc/use-case";
import type { ModuleMeta } from "../../domain/module/types";
import { type AboutData, loadAboutFile } from "../shared/about-parser";
import type { UIAppResolver } from "./ui-app";

/**
 * Зависимости, необходимые для инициализации UI-модуля.
 */
export interface UIModuleResolver<TMeta extends ModuleMeta> {
  aboutPath: string;
  apiModule: Module<TMeta, unknown>;
}

/**
 * Базовый абстрактный класс для UI-модуля.
 * Оборачивает доменный API-модуль и добавляет логику UI.
 */
export abstract class UIModule<
  TMeta extends ModuleMeta,
  AR extends UIAppResolver,
  MR extends UIModuleResolver<TMeta>,
> {
  /** Данные, загруженные из about.md */
  public about!: AboutData;

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
  }

  /**
   * Возвращает типы команд, поддерживаемых доменным модулем.
   */
  getDocTypes(): UcDocType[] {
    return this.resolver.apiModule.getDocTypes();
  }

  /**
   * Основной метод рендеринга модуля (должен быть реализован в наследниках).
   */
  abstract render(...args: unknown[]): unknown;

  /**
   * Метод рендеринга конкретного UseCase (сбор данных, запуск).
   * @param ucName Имя UseCase (commandName)
   * @param args Дополнительные аргументы, зависящие от платформы
   */
  abstract renderUseCase(ucName: string, ...args: unknown[]): unknown;
}
