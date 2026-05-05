import type { UIApp } from "./ui-app";

/**
 * Базовый роутер для навигации по UI.
 * Парсит пути и вызывает соответствующие методы рендеринга у приложения или модулей.
 */
export class UIRouter<TApp extends UIApp<any>> {
  constructor(public readonly app: TApp) {}

  /**
   * Навигация по пути.
   * 
   * Поддерживаемые пути:
   * - `/` или `/app` -> Вызывает `app.render(...)`
   * - `/<module-name>` -> Вызывает `module.render(...)`
   * - `/<module-name>/<use-case-name>` -> Вызывает `module.renderUseCase(ucName, ...)`
   * 
   * @param path Строка пути
   * @param args Дополнительные аргументы (состояние, контекст), передаваемые в render
   * @returns Результат выполнения метода render
   * @throws Ошибка, если путь некорректен, модуль или UseCase не найдены
   */
  async navigate(path: string, ...args: unknown[]): Promise<unknown> {
    const parts = path.split("/").filter(Boolean);

    if (parts.length === 0 || (parts.length === 1 && parts[0] === "app")) {
      return this.app.render(...args);
    }

    const moduleName = parts[0];
    const uiModule = this.app.modules.find((m) => m.name === moduleName);

    if (!uiModule) {
      throw new Error(`Модуль с именем '${moduleName}' не найден`);
    }

    if (parts.length === 1) {
      return uiModule.render(...args);
    }

    const ucName = parts[1] as string;
    const hasUc = uiModule.getDocTypes().some((uc) => uc.commandName === ucName);
    
    if (!hasUc) {
      throw new Error(`UseCase '${ucName}' не найден в модуле '${moduleName}'`);
    }

    return uiModule.renderUseCase(ucName, ...args);
  }
}
