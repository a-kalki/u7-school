import type * as readline from "node:readline/promises";
import { AutoUiController } from "./base";

/**
 * Абстрактный CLI-контроллер для AutoUiApp.
 * Расширяет AutoUiController, добавляя REPL-цикл, управление сессией
 * и каркас для auth (register/login).
 *
 * Конкретные реализации (например, UserCliController) должны определить:
 * - createReadline() — создание readline.Interface
 * - writePrompt(), handleQuit() — CLI-окружение
 * - handleRegister(), handleLogin(), renderMenu() — auth-логика
 */
export abstract class AutoUiCliController extends AutoUiController {
	/** Текущий активный пользователь (делегирует в app) */
	get currentActor(): { uuid: string; name: string } | null {
		return this.app.currentActor;
	}

	/** ID текущего активного пользователя */
	get actorId(): string | null {
		return this.app.currentActor?.uuid ?? null;
	}

	/** Устанавливает активного пользователя */
	setActor(uuid: string, name?: string): void {
		this.app.currentActor = { uuid, name: name || uuid };
	}

	/** Сбрасывает сессию (logout) */
	clearActor(): void {
		this.app.currentActor = null;
	}

	// ── Абстрактные методы для CLI-окружения ──

	/** Создаёт readline.Interface для данного окружения */
	abstract createReadline(): readline.Interface;

	/** Выводит приглашение ввода */
	abstract writePrompt(): void;

	/** Действие при завершении (quit/exit) */
	abstract handleQuit(): void;

	// ── Абстрактные методы auth (реализация в дочерних контроллерах) ──

	/** Обработка команды /register */
	abstract handleRegister(): Promise<string>;

	/**
	 * Обработка команды /login [args].
	 * args — всё, что идёт после `/login` (может быть undefined).
	 * Наследник сам решает, как интерпретировать аргументы:
	 *   /login <uuid>, /login uuid: <uuid>,
	 *   /login telegramId: <num>, /login name: <часть имени>, и т.д.
	 */
	abstract handleLogin(args?: string): Promise<string>;

	/** Рендеринг меню в зависимости от состояния сессии (может быть асинхронным) */
	abstract renderMenu(): Promise<string>;

	// ── REPL-цикл ──

	/**
	 * Хук, вызываемый после каждого успешного выполнения usecase.
	 * По умолчанию — пустая реализация. Наследники могут переопределить
	 * для авто-авторизации после create-user и т.п.
	 */
	protected onCommandExecuted(_response: string): void {
		// пусто
	}


	/**
	 * Запускает интерактивный REPL-цикл.
	 * Обрабатывает построчный ввод, буферизацию для UseCase,
	 * маршрутизацию register/login, навигацию.
	 */
	async run(): Promise<void> {
		const rl = this.createReadline();

		try {
			// 1. При старте — about и меню
			const aboutResponse = await this.safeHandle("/app");
			console.log(`\n${aboutResponse}`);
			console.log(await this.renderMenu());

			this.writePrompt();

			let buffer: string[] = [];
			let isBuffering = false;

			for await (const line of rl) {
				const trimmedLine = line.trim();

				if (trimmedLine === "/quit" || trimmedLine === "/exit") {
					this.handleQuit();
					break;
				}

				if (!isBuffering) {
					if (!trimmedLine) {
						this.writePrompt();
						continue;
					}

					// Маршрутизация register/login
					if (trimmedLine === "/register") {
						const response = await this.handleRegister();
						console.log(`\n${response}`);
						this.writePrompt();
						continue;
					}

					if (trimmedLine.startsWith("/login")) {
						// Передаём всё после "/login" наследнику для гибкого парсинга
						const args = trimmedLine.slice("/login".length).trim() || undefined;
						const response = await this.handleLogin(args);
						console.log(`\n${response}`);
						this.writePrompt();
						continue;
					}

					const pathParts = trimmedLine.split("/").filter(Boolean);
					// Если это путь к UseCase (3 части: /mod/agg/uc), начинаем буферизацию
					if (pathParts.length === 3 && trimmedLine.startsWith("/")) {
						buffer.push(trimmedLine);
						isBuffering = true;
						process.stdout.write("... ");
						continue;
					}

					// Иначе выполняем мгновенно (навигация)
					const response = await this.safeHandle(trimmedLine);
					console.log(`\n${response}`);
					this.writePrompt();
				} else {
					// В режиме буферизации
					if (trimmedLine === "") {
						// Пустая строка — сигнал к выполнению накопленного
						const response = await this.safeHandle(buffer.join("\n"));
						console.log(`\n${response}`);
						buffer = [];
						this.onCommandExecuted(response);
						isBuffering = false;
						this.writePrompt();
					} else {
						buffer.push(trimmedLine);
						process.stdout.write("... ");
					}
				}
			}
		} catch (err) {
			console.error(
				"\nКритическая ошибка CLI интерфейса:",
				(err as Error).message,
			);
		} finally {
			rl.close();
		}
	}
}
