import type { Course } from "../../domain/course/course";
import { CourseAr } from "../../domain/course/course-ar";
import { CoursePolicy } from "../../domain/course/course-policy";
import { DomainException } from "../../domain/shared/exceptions";
import type { CreateCourseCommand } from "../commands/create-course-command";
import { CreateCourseCommandSchema } from "../commands/create-course-command";
import { parseOrThrow } from "../shared/parse-or-throw";
import type { UserRepository } from "../user/user-repository";
import type { CourseRepository } from "./course-repository";

export class CourseCreatingUc {
	#courseRepo: CourseRepository;
	#userRepo: UserRepository;

	constructor(courseRepo: CourseRepository, userRepo: UserRepository) {
		this.#courseRepo = courseRepo;
		this.#userRepo = userRepo;
	}

	async execute(
		command: CreateCourseCommand,
		actorId: string,
	): Promise<Course> {
		parseOrThrow(
			CreateCourseCommandSchema,
			command,
			"Некорректная команда создания курса",
		);

		const actor = await this.#userRepo.getByUuid(actorId);
		if (!actor) throw DomainException.notFound("Пользователь", actorId);

		if (!CoursePolicy.canCreate(actor)) {
			throw DomainException.accessDenied(
				"Недостаточно прав для создания курса",
				`Роль [${actor.roles.join(",")}] не может создавать курсы`,
			);
		}

		const author = await this.#userRepo.getByUuid(command.authorId);
		if (!author)
			throw DomainException.notFound("Автор курса", command.authorId);

		const ar = CourseAr.create(command);
		await this.#courseRepo.save(ar.state as Course);
		return ar.state as Course;
	}
}
