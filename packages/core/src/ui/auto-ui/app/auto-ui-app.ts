import type { ModuleMeta } from "#domain/module/types";
import { UIApp, type UIAppResolver } from "#ui/ui-base/ui-app";
import type {
	AutoUiModule,
	AutoUiModuleResolver,
} from "../module/auto-ui-module";
import { CommandParser } from "../parser/command-parser";

export class AutoUiApp<
	AR extends UIAppResolver = UIAppResolver,
> extends UIApp<AR> {
	private parser = new CommandParser();

	/** Текущий активный пользователь (null = не аутентифицирован) */
	currentActor: { uuid: string; name: string } | null = null;

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
				return this.render();
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

		// Делегируем обработку модулю, передавая текущий actorId
		return targetModule.handleIntent(intent, this.currentActor?.uuid);
	}

	/**
	 * Прямой вызов usecase модуля в обход CommandParser.
	 * Используется контроллерами для выполнения API-запросов
	 * (list-users, get-user-by-telegram-id и т.д.).
	 *
	 * @returns Результат выполнения usecase (сырой объект от API-модуля)
	 */
	async callUseCase(
		moduleName: string,
		commandName: string,
		attrs: Record<string, unknown> = {},
	): Promise<unknown> {
		const mod = this.autoUiModules.find((m) => m.name === moduleName);
		if (!mod) {
			throw new Error(`Модуль '${moduleName}' не найден`);
		}

		return mod.apiModule.handle({
			name: commandName,
			attrs,
			actorId: this.currentActor?.uuid,
		});
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
		const title = this.about.title ? `**${this.about.title}**\n\n` : "";
		const body = this.about.body;
		const menu = "\n\n--- \n**Меню:**\n- Список модулей: `/modules`";
		return `${title}${body}${menu}`;
	}
}
