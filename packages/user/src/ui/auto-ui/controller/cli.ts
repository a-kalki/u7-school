import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { AutoUiCliController } from "@u7/core/ui";

/**
 * Контроллер CLI для модуля пользователей.
 *
 * Использует прямой API-вызов usecase'ов через app.callUseCase()
 * вместо парсинга команд, что позволяет применять встроенные фильтры
 * list-users (name, telegramId, limit).
 */
export class UserCliController extends AutoUiCliController {
	// ── CLI-окружение ──

	createReadline(): readline.Interface {
		return readline.createInterface({ input, output });
	}

	writePrompt(): void {
		process.stdout.write("\n> ");
	}

	handleQuit(): void {
		console.log("До свидания!");
	}

	// ── Auth ──

	/**
	 * Обработка /register — показывает prompt для create-user.
	 */
	async handleRegister(): Promise<string> {
		const response = await this.safeHandle("/user/user/create-user");
		return `**Регистрация первого администратора**\n\n${response}`;
	}

	/**
	 * Обработка /login [args].
	 *
	 * Поддерживаемые форматы:
	 * - /login                    — список пользователей
	 * - /login <uuid>             — вход по UUID
	 * - /login uuid: <uuid>       — вход по UUID (явный)
	 * - /login telegramId: <num>  — вход по Telegram ID
	 * - /login name: <часть>      — поиск по имени
	 */
	async handleLogin(args?: string): Promise<string> {
		if (!args) {
			return this.renderLoginList();
		}

		const colonIndex = args.indexOf(":");
		const hasPrefix = colonIndex > 0;

		if (!hasPrefix) {
			return this.loginById(args.trim());
		}

		const prefix = args.slice(0, colonIndex).trim().toLowerCase();
		const value = args.slice(colonIndex + 1).trim();

		switch (prefix) {
			case "uuid":
				return this.loginById(value);
			case "telegramid":
				return this.loginByTelegramId(value);
			case "name":
				return this.loginByName(value);
			default:
				return `**Ошибка:** Неизвестный способ входа \`${prefix}:\`. Используйте \`uuid:\`, \`telegramId:\` или \`name:\`.`;
		}
	}

	/**
	 * Рендеринг меню в зависимости от наличия пользователей и сессии.
	 */
	async renderMenu(): Promise<string> {
		let menu = "\n\n---\n**Меню:**\n- Список модулей: `/modules`\n";

		const actor = this.currentActor;
		if (actor) {
			menu += `- Активный пользователь: ${actor.name} \`${actor.uuid}\`\n`;
			return menu;
		}

		try {
			const result = await this.app.callUseCase("user", "list-users", {
				limit: 1,
			});
			const data = result as { users?: unknown[] };
			const hasUsers = (data.users?.length ?? 0) > 0;

			if (!hasUsers) {
				menu += "- **Регистрация администратора:** `/register`\n";
			} else {
				menu += "- **Вход в систему:** `/login`\n";
			}
		} catch {
			menu += "- **Регистрация администратора:** `/register`\n";
		}

		return menu;
	}

	// ── Хук авто-авторизации ──

	/**
	 * Вызывается после каждой успешно выполненной команды.
	 * Если была выполнена команда create-user — автоматически входит под созданным пользователем.
	 */
	override onCommandExecuted(response: string): void {
		if (this.currentActor) return; // Уже залогинены

		// Ищем JSON с uuid и name в ответе create-user
		const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
		if (!jsonMatch) return;

		try {
			const data = JSON.parse(jsonMatch[1] || "{}") as {
				uuid?: string;
				name?: string;
			};
			if (data.uuid && data.name) {
				this.setActor(data.uuid, data.name);
			}
		} catch {
			// Не JSON или не тот формат — игнорируем
		}
	}

	// ── Приватные хелперы ──

	/**
	 * Показывает список пользователей для выбора при логине.
	 */
	private async renderLoginList(): Promise<string> {
		try {
			const result = await this.app.callUseCase("user", "list-users", {});
			const data = result as {
				users?: Array<{ uuid: string; name: string }>;
			};

			if (!data.users || data.users.length === 0) {
				return "Нет зарегистрированных пользователей. Введите `/register` для создания первого администратора.";
			}

			let output = "**Выберите пользователя:**\n\n";
			for (const user of data.users) {
				output += `- ${user.name}: \`/login ${user.uuid}\`\n`;
			}
			output +=
				"\nВведите `/login <id>` для входа, или `/login name: <имя>` для поиска.";
			return output;
		} catch {
			return "**Ошибка:** Не удалось получить список пользователей.";
		}
	}

	/**
	 * Вход по ID (UUID) с проверкой существования.
	 */
	private async loginById(id: string): Promise<string> {
		try {
			const result = await this.app.callUseCase("user", "list-users", {});
			const data = result as {
				users?: Array<{ uuid: string; name: string }>;
			};

			const user = data.users?.find((u) => u.uuid === id);
			if (!user) {
				return `**Ошибка:** Пользователь с ID \`${id}\` не найден.`;
			}

			this.setActor(user.uuid, user.name);
			return `**Вход выполнен.** Активный пользователь: ${user.name} \`${user.uuid}\`\n\nВведите /app для возврата в меню.`;
		} catch {
			return `**Ошибка:** Не удалось проверить пользователя \`${id}\`.`;
		}
	}

	/**
	 * Вход по Telegram ID — использует встроенный фильтр list-users.
	 */
	private async loginByTelegramId(telegramId: string): Promise<string> {
		const numId = Number(telegramId);
		if (Number.isNaN(numId)) {
			return `**Ошибка:** Telegram ID должен быть числом, получено \`${telegramId}\`.`;
		}

		try {
			const result = await this.app.callUseCase("user", "list-users", {
				telegramId: numId,
				limit: 1,
			});
			const data = result as {
				users?: Array<{ uuid: string; name: string }>;
			};

			if (!data.users || !data.users[0]) {
				return `**Ошибка:** Пользователь с Telegram ID \`${telegramId}\` не найден.`;
			}

			// biome-ignore lint/style/noNonNullAssertion: проверены выше;
			const user = data.users[0]!;
			this.setActor(user.uuid, user.name);
			return `**Вход выполнен.** Активный пользователь: ${user.name} \`${user.uuid}\`\n\nВведите /app для возврата в меню.`;
		} catch {
			return `**Ошибка:** Пользователь с Telegram ID \`${telegramId}\` не найден.`;
		}
	}

	/**
	 * Поиск по имени — использует встроенный фильтр name (частичное совпадение).
	 */
	private async loginByName(namePart: string): Promise<string> {
		try {
			const result = await this.app.callUseCase("user", "list-users", {
				name: namePart,
			});
			const data = result as {
				users?: Array<{ uuid: string; name: string }>;
			};

			if (!data.users || data.users.length === 0) {
				return `**Ошибка:** Пользователи с именем, содержащим \`${namePart}\`, не найдены.`;
			}

			if (data.users.length === 1) {
				// biome-ignore lint/style/noNonNullAssertion: проверены выше;
				const user = data.users[0]!;
				this.setActor(user.uuid, user.name);
				return `**Вход выполнен.** Активный пользователь: ${user.name} \`${user.uuid}\`\n\nВведите /app для возврата в меню.`;
			}

			// Несколько совпадений — показываем варианты
			let output = `**Найдено несколько пользователей** (по запросу \`${namePart}\`):\n\n`;
			for (const user of data.users) {
				output += `- ${user.name}: \`/login ${user.uuid}\`\n`;
			}
			output += "\nВведите `/login <id>` для входа.";
			return output;
		} catch {
			return `**Ошибка:** Не удалось выполнить поиск по имени \`${namePart}\`.`;
		}
	}
}
