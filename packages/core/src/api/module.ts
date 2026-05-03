import { ApiException, DomainException } from "../domain/shared/exceptions";
import { CourseCreatingUc } from "./course/course_creating_uc";
import type { CourseRepository } from "./course/course_repository";
import { UserCreatingUc } from "./user/user_creating_uc";
import type { UserRepository } from "./user/user_repository";

/** Команда модуля */
export type ModuleCommand = {
	name: string;
	user?: string;
	attrs: unknown;
};

/** Зависимости модуля core */
export type CoreResolve = {
	userRepo: UserRepository;
	courseRepo: CourseRepository;
};

/** Entry point модуля core */
export class CoreModule {
	#resolve: CoreResolve;

	constructor(resolve: CoreResolve) {
		this.#resolve = resolve;
	}

	async handle(command: ModuleCommand): Promise<unknown> {
		switch (command.name) {
			case "create-user":
				return new UserCreatingUc(this.#resolve.userRepo).execute(
					command.attrs as never,
					command.user,
				);
			case "create-course": {
				if (command.user === undefined) {
					throw DomainException.validation(
						"Для создания курса требуется actorId",
						"command.user отсутствует",
					);
				}
				return new CourseCreatingUc(
					this.#resolve.courseRepo,
					this.#resolve.userRepo,
				).execute(command.attrs as never, command.user);
			}
			default:
				throw ApiException.badRequest(
					`Неизвестная команда: ${command.name}`,
					`Диспатчер не нашёл обработчик для ${command.name}`,
				);
		}
	}
}
