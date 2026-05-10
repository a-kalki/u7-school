import { Aggregate } from "@u7/core/domain";
import { isoNow } from "@u7/core/shared";
import type { CreateCourseCmd } from "./commands/create-course-cmd";
import type { Course, CourseArMeta } from "./entity";
import { CourseSchema } from "./entity";

/**
 * Агрегат Course — корень образовательного курса.
 * Module и Project являются вложенными объектами-значениями (value objects).
 * Lesson, Step, FileMetadata — независимые агрегаты, связанные через UUID.
 */
export class CourseAr extends Aggregate<CourseArMeta> {
	constructor(state: Course) {
		super(state, CourseSchema);
	}

	/**
	 * Фабричный метод создания нового курса из команды.
	 */
	static create(command: CreateCourseCmd): CourseAr {
		const base = {
			uuid: crypto.randomUUID(),
			title: command.title,
			description: command.description,
			authorId: crypto.randomUUID(), // будет переопределён UC из actorId
			targetAudience: command.targetAudience,
			goal: command.goal,
			result: command.result,
			rules: command.rules,
			additional: command.additional,
			tags: command.tags,
			status: command.status,
			createdAt: isoNow(),
		};

		let candidate: Course;
		if (command.kind === "modules") {
			candidate = {
				...base,
				kind: "modules",
				modules: command.modules ?? [],
			};
		} else {
			candidate = {
				...base,
				kind: "projects",
				projects: command.projects ?? [],
			};
		}

		return new CourseAr(candidate);
	}
}
