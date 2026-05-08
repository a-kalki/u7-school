import type { ModuleMeta } from "#domain/module/types";
import { UIApp, type UIAppResolver } from "#ui/ui-base/ui-app";
import type { AutoUiModule, AutoUiModuleResolver } from "../module/auto-ui-module";
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
				return this.renderAboutAsync();
			}
			if (intent.command === "modules") {
				return this.renderModulesList();
			}
			if (intent.command === "register") {
				return this.handleRegister();
			}
			if (intent.command === "login") {
				return this.handleLogin((intent as { userId?: string }).userId);
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
		return targetModule.handleIntent(intent, this.currentActor?.uuid ?? null);
	}

	/**
	 * Рендеринг стартового экрана (about) с учётом наличия пользователей.
	 */
	private async renderAboutAsync(): Promise<string> {
		const title = this.about.title ? `**${this.about.title}**\n\n` : "";
		const body = this.about.body;

		// Проверяем, есть ли зарегистрированные пользователи
		const hasUsers = await this.checkHasUsers();

		let menu = "\n\n--- \n**Меню:**\n- Список модулей: `/modules`\n";

		if (this.currentActor) {
			menu += `- Активный пользователь: ${this.currentActor.name} \`${this.currentActor.uuid}\`\n`;
		}

		if (!hasUsers) {
			menu += "- **Регистрация администратора:** `/register`\n";
		} else if (!this.currentActor) {
			menu += "- **Вход в систему:** `/login`\n";
		}

		return `${title}${body}${menu}`;
	}

	/**
	 * Проверяет, есть ли пользователи в системе.
	 */
	private async checkHasUsers(): Promise<boolean> {
		for (const mod of this.autoUiModules) {
			try {
				const result = await mod.resolver.apiModule.handle({
					name: "list-users",
					attrs: {},
					actorId: "system-ui",
				});
				const data = result as { users?: unknown[] };
				return (data.users?.length ?? 0) > 0;
			} catch {
				continue;
			}
		}
		return false;
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

	/**
	 * Обработка команды /register.
	 * Находит первый модуль, поддерживающий create-user, и перенаправляет на него.
	 */
	private async handleRegister(): Promise<string> {
		// Ищем модуль с use-case create-user
		for (const mod of this.autoUiModules) {
			const docTypes = mod.resolver.apiModule.getDocTypes();
			const createUserUc = docTypes.find((u) => u.commandName === "create-user");
			if (createUserUc) {
				// Перенаправляем — показываем prompt для create-user
				return (
					"**Регистрация первого администратора**\n\n" +
					(await mod.handleIntent(
						{
							type: "usecase",
							moduleName: mod.name,
							aggregateName: createUserUc.arName,
							commandName: "create-user",
							action: "prompt",
						},
						null,
					))
				);
			}
		}
		return "Ошибка: Не найден модуль с поддержкой регистрации.";
	}

	/**
	 * Обработка команды /login [userId].
	 * Без аргументов — показывает список пользователей.
	 * С аргументом — устанавливает текущего пользователя.
	 */
	private async handleLogin(userId?: string): Promise<string> {
		// Ищем модуль с list-users
		for (const mod of this.autoUiModules) {
			const docTypes = mod.resolver.apiModule.getDocTypes();
			const listUc = docTypes.find((u) => u.commandName === "list-users");
			if (!listUc) continue;

			if (userId) {
				// Устанавливаем текущего пользователя
				this.currentActor = { uuid: userId, name: userId };
				return `**Вход выполнен.** Активный пользователь: \`${userId}\`\n\nВведите /app для возврата в меню.`;
			}

			// Показываем список пользователей
			try {
				const result = await this.autoUiModules[0].resolver.apiModule.handle({
					name: "list-users",
					attrs: {},
					actorId: "system-ui",
				});

				const data = result as { users?: Array<{ uuid: string; name: string }> };
				if (!data.users || data.users.length === 0) {
					return "Нет зарегистрированных пользователей. Введите /register для создания первого администратора.";
				}

				let response = "**Выберите пользователя:**\n\n";
				for (const user of data.users) {
					response += `- ${user.name}: \`/login ${user.uuid}\`\n`;
				}
				response += "\nВведите `/login <id>` для входа.";
				return response;
			} catch {
				return "Ошибка получения списка пользователей.";
			}
		}

		return "Ошибка: Не найден модуль с поддержкой входа.";
	}
}
