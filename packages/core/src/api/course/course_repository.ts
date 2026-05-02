import type { Course } from "../../domain/course/course";
import { DomainException } from "../../domain/shared/exceptions";

export interface CourseRepository {
	save(course: Course): Promise<void>;
	getByUuid(uuid: string): Promise<Course | undefined>;
}

export class InMemoryCourseRepository implements CourseRepository {
	#byUuid = new Map<string, Course>();

	async save(course: Course): Promise<void> {
		if (this.#byUuid.has(course.uuid)) {
			throw DomainException.conflict("Курс уже существует", `uuid=${course.uuid}`);
		}
		this.#byUuid.set(course.uuid, course);
	}

	async getByUuid(uuid: string): Promise<Course | undefined> {
		return this.#byUuid.get(uuid);
	}
}
