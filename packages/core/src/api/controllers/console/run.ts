import { DomainException } from "../../../domain/shared/exceptions";
import { InMemoryCourseRepository } from "../../course/course_repository";
import { CoreModule } from "../../module";
import { InMemoryUserRepository } from "../../user/user_repository";

/** Консольный контроллер — парсит CLI-аргументы и выполняет через CoreModule */
export class ConsoleController {
	#module: CoreModule;

	constructor() {
		this.#module = new CoreModule({
			userRepo: new InMemoryUserRepository(),
			courseRepo: new InMemoryCourseRepository(),
		});
	}

	async run(args: string[]): Promise<string> {
		const name = args[0];
		if (!name)
			throw DomainException.validation(
				"Не указана команда",
				"args[0] отсутствует",
			);

		const attrs: Record<string, unknown> = {};
		let user: string | undefined;
		for (let i = 1; i < args.length; i++) {
			const match = args[i].match(/^--([^=]+)=(.+)$/);
			if (!match)
				throw DomainException.validation(
					`Неверный формат аргумента: ${args[i]}`,
					"ожидается --key=value",
				);
			const rawKey = match[1];
			const value = rawKey === "telegram-id" ? Number(match[2]) : match[2];
			// actor-id обрабатывается отдельно, остальные мапятся в camelCase
			if (rawKey === "actor-id") {
				user = value as string;
			} else {
				const key =
					rawKey === "telegram-id"
						? "telegramId"
						: rawKey === "author-id"
							? "authorId"
							: rawKey;
				attrs[key] = value;
			}
		}

		// По умолчанию role = ADMIN (для bootstrap)
		if (name === "create-user" && !attrs.role) {
			attrs.role = "ADMIN";
		}

		try {
			const result = await this.#module.handle({ name, attrs, user });
			return JSON.stringify(result, null, 2);
		} catch (e: unknown) {
			const err = e as { level?: string };
			if (err.level) throw e;
			if (e instanceof Error)
				throw DomainException.validation(e.message, "console error");
			throw e;
		}
	}
}
