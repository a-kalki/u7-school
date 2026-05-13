import * as fs from "node:fs";
import { dirname, join } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import type { ApiApp } from "@u7/core/api";
import { formatValibotErrors } from "./controller/format-valibot-errors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// biome-ignore lint/suspicious/noExplicitAny: recursive type resolution
function getTypeString(schemaProp: any): string {
	if (!schemaProp) return "unknown";

	if (schemaProp.type === "optional" && schemaProp.wrapped) {
		return getTypeString(schemaProp.wrapped);
	}

	// handle valibot's pipe type
	if (schemaProp.type === "pipe" && schemaProp.item) {
		return getTypeString(schemaProp.item);
	}

	let typeStr = schemaProp.type || "unknown";

	if (typeStr === "array") {
		if (schemaProp.item) {
			typeStr = `array<${getTypeString(schemaProp.item)}>`;
		} else {
			typeStr = "array";
		}
	} else if (typeStr === "picklist" && schemaProp.options) {
		typeStr = `picklist (${schemaProp.options.join(", ")})`;
	} else if (typeStr === "enum" && schemaProp.enum) {
		typeStr = `enum (${Object.values(schemaProp.enum).join(", ")})`;
	}

	return typeStr;
}

// biome-ignore lint/suspicious/noExplicitAny: any is needed to traverse unknown schema
function printSchemaPrompt(schema: any) {
	if (!schema || !schema.entries) return;
	console.log("\n```");
	for (const [key, prop] of Object.entries(schema.entries)) {
		// biome-ignore lint/suspicious/noExplicitAny: type needed
		const p = prop as any;
		const isOptional = p.type === "optional";
		const reqStr = isOptional ? "" : "*";

		const typeStr = getTypeString(p);
		console.log(`${key}${reqStr}: ${typeStr}`);
	}
	console.log("```");
	console.log("\n---");
	console.log("*: обязательные");
}

// biome-ignore lint/suspicious/noExplicitAny: any is returned
function parseKeyValueLines(payloadStr: string, schema: any): any {
	// biome-ignore lint/suspicious/noExplicitAny: dynamic payload
	const payload: any = {};
	const lines = payloadStr.split("\n");
	for (const line of lines) {
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;
		const key = line.substring(0, colonIdx).trim();
		const valStr = line.substring(colonIdx + 1).trim();

		const propSchema = schema?.entries?.[key];
		const actualProp =
			propSchema?.type === "optional" ? propSchema.wrapped : propSchema;
		const typeStr = actualProp?.type;

		if (typeStr === "array") {
			payload[key] = valStr
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
		} else if (typeStr === "number") {
			payload[key] = Number(valStr);
		} else if (typeStr === "boolean") {
			payload[key] = valStr === "true";
		} else {
			payload[key] = valStr;
		}
	}
	return payload;
}

export class CliController {
	private currentActor: { uuid: string; name: string } | null = null;
	private rl: readline.Interface;

	constructor(private app: ApiApp) {
		this.rl = readline.createInterface({ input, output });
	}

	async run() {
		// Load and check about files
		const appAboutPath = join(__dirname, "../about.md");
		if (!fs.existsSync(appAboutPath)) {
			throw new Error(
				`Файл about.md приложения не найден по пути: ${appAboutPath}`,
			);
		}
		const appAbout = fs.readFileSync(appAboutPath, "utf-8");

		const moduleAbouts = new Map<string, string>();
		for (const mod of this.app.getModules()) {
			const modAboutPath = join(
				__dirname,
				"../../../packages",
				mod.name,
				"about.md",
			);
			if (!fs.existsSync(modAboutPath)) {
				throw new Error(
					`Модуль ${mod.name} не имеет файла about.md по пути: ${modAboutPath}`,
				);
			}
			moduleAbouts.set(mod.name, fs.readFileSync(modAboutPath, "utf-8"));
		}

		console.log(appAbout);
		console.log("\n=== u7 CLI ===");
		console.log("Введите /app для справки\n");

		this.prompt();
		let buffer: string[] = [];
		let isBuffering = false;

		for await (const line of this.rl) {
			const text = line.trim();

			if (text === "/quit" || text === "/exit") {
				console.log("До свидания!");
				break;
			}

			if (!isBuffering) {
				if (!text) {
					this.prompt();
					continue;
				}

				if (text === "/app" || text === "/") {
					this.printHelp();
					this.prompt();
					continue;
				}

				if (text === "/modules") {
					this.printModules();
					this.prompt();
					continue;
				}

				if (text.startsWith("/about")) {
					const args = text.slice(6).trim();
					if (!args) {
						console.log(`\n--- О приложении ---\n`);
						console.log(appAbout);
					} else {
						const modAbout = moduleAbouts.get(args);
						if (modAbout) {
							console.log(`\n--- О модуле: ${args} ---\n`);
							console.log(modAbout);
						} else {
							console.log(
								`Модуль '${args}' не найден. Для списка введите /modules`,
							);
						}
					}
					this.prompt();
					continue;
				}

				if (text.startsWith("/login")) {
					const args = text.slice(6).trim();
					await this.handleLogin(args || undefined);
					this.prompt();
					continue;
				}

				if (text.startsWith("/logout")) {
					this.currentActor = null;
					console.log("Вы вышли из системы.");
					this.prompt();
					continue;
				}

				const parts = text.split("/").filter(Boolean);
				// Формат: /module/usecase (2 части)
				// В старой системе было /module/aggregate/usecase (3 части), но сейчас UC напрямую в модуле
				// Поддержим оба варианта для совместимости: если 2 части - module/uc, если 3 части - module/agg/uc

				let modName = "";
				let ucName = "";

				if (parts.length >= 2 && text.startsWith("/")) {
					modName = parts[0] as string;
					ucName = parts[parts.length - 1] as string;
					buffer.push(text);
					isBuffering = true;

					const mod = this.app.getModule(modName);
					const ucDoc = mod?.getDocTypes().find((d) => d.ucName === ucName);
					if (ucDoc?.inputSchema) {
						printSchemaPrompt(ucDoc.inputSchema);
					}

					process.stdout.write("... ");
					continue;
				}

				console.log("Неизвестная команда. Введите /app для справки.");
				this.prompt();
			} else {
				// Режим буферизации данных
				if (text === "") {
					await this.executeBuffer(buffer);
					buffer = [];
					isBuffering = false;
					this.prompt();
				} else {
					buffer.push(text);
					process.stdout.write("... ");
				}
			}
		}

		this.rl.close();
	}

	private prompt() {
		process.stdout.write("\n> ");
	}

	private printHelp() {
		console.log("\n--- Меню ---");
		console.log("- /modules  - Список модулей");
		console.log("- /about [m] - О приложении или модуле m");
		if (this.currentActor) {
			console.log(
				`- Активный пользователь: ${this.currentActor.name} (${this.currentActor.uuid})`,
			);
			console.log("- /logout   - Выйти");
		} else {
			console.log("- /login    - Войти в систему");
		}
	}

	private printModules() {
		const mods = this.app.getModules();
		console.log("\n--- Доступные модули ---");
		for (const mod of mods) {
			console.log(`\nМодуль /${mod.name} (описание: /about ${mod.name})`);
			for (const uc of mod.getDocTypes()) {
				console.log(
					`  /${mod.name}/${uc.arName ? `${uc.arName}/` : ""}${uc.ucName}`,
				);
			}
		}
	}

	private async executeBuffer(buffer: string[]) {
		const commandPath = buffer[0]?.trim() || "";
		const parts = commandPath.split("/").filter(Boolean);

		const modName = parts[0] as string;
		const ucName = parts[parts.length - 1] as string; // Берем последний кусок как usecase

		const payloadStr = buffer.slice(1).join("\n").trim();
		let payload = {};

		const mod = this.app.getModule(modName);
		const ucDoc = mod?.getDocTypes().find((d) => d.ucName === ucName);
		const inputSchema = ucDoc?.inputSchema;

		if (payloadStr) {
			// Пытаемся распарсить как JSON, иначе как key: value
			if (payloadStr.startsWith("{")) {
				try {
					payload = JSON.parse(payloadStr);
				} catch (e) {
					console.error("Ошибка парсинга JSON payload:", (e as Error).message);
					return;
				}
			} else {
				payload = parseKeyValueLines(payloadStr, inputSchema);
			}
		}

		try {
			const result = await this.app.execute(
				modName,
				ucName,
				payload,
				this.currentActor?.uuid,
			);
			console.log("\nУспех:");
			console.log(JSON.stringify(result, null, 2));
		} catch (e: unknown) {
			console.error("\nОшибка:");
			if (
				e &&
				typeof e === "object" &&
				"name" in e &&
				e.name === "AppException"
			) {
				// biome-ignore lint/suspicious/noExplicitAny: any used for matching
				const ex = e as any;
				if (
					ex.error?.name === "INPUT_VALIDATION_ERROR" &&
					ex.error?.payload?.rawIssues
				) {
					const formatted = formatValibotErrors(ex.error.payload.rawIssues);
					console.log(formatted);
				} else {
					console.log(ex.error?.message || ex.message);
				}
			} else if (
				e &&
				typeof e === "object" &&
				"name" in e &&
				e.name === "ValidationError"
			) {
				// biome-ignore lint/suspicious/noExplicitAny: any used for matching
				const formatted = formatValibotErrors((e as any).issues);
				console.log(formatted);
			} else {
				console.log((e as Error).message || String(e));
			}
		}
	}

	private async handleLogin(args?: string) {
		try {
			// biome-ignore lint/suspicious/noExplicitAny: allow any for dynamic API call
			const result: any = await this.app.execute(
				"user",
				"list-users",
				{},
				this.currentActor?.uuid,
			);
			const users = result.users || result; // Зависит от того, возвращает массив или объект {users}
			const userArray = Array.isArray(users) ? users : users?.users;

			if (!userArray || userArray.length === 0) {
				console.log("Нет пользователей. База пуста.");
				return;
			}

			if (!args) {
				console.log("Доступные пользователи:");
				for (const u of userArray) {
					console.log(`- ${u.name} (uuid: ${u.uuid}, tg: ${u.telegramId})`);
				}
				console.log("Введите /login <uuid> или /login tg: <telegramId>");
				return;
			}

			let targetUser = null;
			if (args.startsWith("tg:")) {
				const tg = Number(args.slice(3).trim());
				// biome-ignore lint/suspicious/noExplicitAny: allow any for dynamic API response
				targetUser = userArray.find((u: any) => u.telegramId === tg);
			} else if (args.startsWith("name:")) {
				const namePart = args.slice(5).trim().toLowerCase();
				// biome-ignore lint/suspicious/noExplicitAny: allow any for dynamic API response
				targetUser = userArray.find((u: any) =>
					u.name.toLowerCase().includes(namePart),
				);
			} else {
				// biome-ignore lint/suspicious/noExplicitAny: allow any for dynamic API response
				targetUser = userArray.find((u: any) => u.uuid === args);
			}

			if (targetUser) {
				this.currentActor = { uuid: targetUser.uuid, name: targetUser.name };
				console.log(
					`Вход выполнен. Активный пользователь: ${this.currentActor.name}`,
				);
			} else {
				console.log(`Пользователь ${args} не найден.`);
			}
		} catch (e: unknown) {
			console.error(
				"Ошибка при получении списка пользователей:",
				(e as Error).message,
			);
		}
	}
}
