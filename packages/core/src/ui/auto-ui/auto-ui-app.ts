import type { ModuleMeta } from "#domain/module/types";
import { UIApp, type UIAppResolver } from "#ui/ui-base/ui-app";
import type { AutoUiModule, AutoUiModuleResolver } from "./auto-ui-module";
import { CommandParser } from "./command-parser";

export class AutoUiApp<
	AR extends UIAppResolver = UIAppResolver,
> extends UIApp<AR> {
	private parser = new CommandParser();

	/**
	 * Приведение типов для модулей AutoUiApp
	 */
	protected get autoUiModules(): AutoUiModule<
		ModuleMeta,
		AR,
		AutoUiModuleResolver<ModuleMeta>
	>[] {
		return this.modules as AutoUiModule<
			ModuleMeta,
			AR,
			AutoUiModuleResolver<ModuleMeta>
		>[];
	}

	/**
	 * Главный входной метод. Принимает текст, парсит команду и маршрутизирует.
	 */
	async handleInput(text: string): Promise<string> {
		const intent = this.parser.parse(text);

		if (intent.type === "error") {
			return intent.message;
		}

		if (intent.type === "app") {
			if (intent.command === "about") {
				return this.renderAbout();
			}
			if (intent.command === "modules") {
				return this.renderModulesList();
			}
			return "Ошибка: Неопознанный ответ на уровне приложения.";
		}

		// Для намерений module и usecase находим соответствующий модуль
		const moduleName = (intent as { moduleName: string }).moduleName;
		const targetModule = this.autoUiModules.find((m) => m.name === moduleName);

		if (!targetModule) {
			return `Ошибка: Модуль '${moduleName}' не найден.\nВведите /app для возврата в главное меню.`;
		}

		// Делегируем обработку модулю
		return targetModule.handleIntent(intent);
	}

	/**
	 * Рендеринг стартового экрана (about)
	 */
	private renderAbout(): string {
		const title = this.about.title ? `**${this.about.title}**\n\n` : "";
		const body = this.about.body;
		const menu = "\n\n--- \n**Меню:**\n- Список модулей: `/modules`";
		return `${title}${body}${menu}`;
	}

	/**
	 * Рендеринг списка доступных модулей
	 */
	private renderModulesList(): string {
		let result = "**Доступные модули:**\n\n";
		for (const mod of this.autoUiModules) {
			const moduleTitle = mod.about?.title || mod.name;
			result += `- ${moduleTitle}: /${mod.name}\n`;
		}
		result += "\n---\n**Назад:** `/app`";
		return result;
	}

	// Заглушка, чтобы удовлетворить абстракцию UIApp
	render(): string {
		return this.renderAbout();
	}
}
