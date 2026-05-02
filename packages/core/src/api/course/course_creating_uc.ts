import type { CreateCourseCommand } from "../commands/create_course_command";
import { CreateCourseCommandSchema } from "../commands/create_course_command";
import { parseOrThrow } from "../shared/parse_or_throw";
import { DomainException } from "../../domain/shared/exceptions";
import type { User } from "../../domain/user/user";
import { CourseAr } from "../../domain/course/course_ar";
import { CoursePolicy } from "../../domain/course/course_policy";
import type { UserRepository } from "../user/user_repository";
import type { CourseRepository } from "./course_repository";
import type { Course } from "../../domain/course/course";

export class CourseCreatingUc {
	#courseRepo: CourseRepository;
	#userRepo: UserRepository;

	constructor(courseRepo: CourseRepository, userRepo: UserRepository) {
		this.#courseRepo = courseRepo;
		this.#userRepo = userRepo;
	}

	async execute(command: CreateCourseCommand, actorId: string): Promise<Course> {
		parseOrThrow(CreateCourseCommandSchema, command, "Некорректная команда создания курса");

		const actor = await this.#userRepo.getByUuid(actorId);
		if (!actor) throw DomainException.notFound("Пользователь", actorId);

		if (!CoursePolicy.canCreate(actor)) {
			throw DomainException.accessDenied(
				"Недостаточно прав для создания курса",
				`Роль ${actor.role} не может создавать курсы`,
			);
		}

		const author = await this.#userRepo.getByUuid(command.authorId);
		if (!author) throw DomainException.notFound("Автор курса", command.authorId);

		const ar = CourseAr.create(command);
		await this.#courseRepo.save(ar.state as Course);
		return ar.state as Course;
	}
}
