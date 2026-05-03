import type { CreateCourseCommand } from "../../api/commands/create_course_command";
import { CreateCourseCommandSchema } from "../../api/commands/create_course_command";
import { parseOrThrow } from "../../api/shared/parse_or_throw";
import { isoNow } from "../shared/iso_now";
import { Status } from "../shared/status";
import type { Course, CourseWithModules } from "./course";
import { CourseSchema } from "./course";

/**
 * Проверяет инварианты курса через схему валидации.
 */
function validateInvariants(course: Course): Course {
	return parseOrThrow(
		CourseSchema,
		course,
		"Некорректные данные курса",
		"Ошибка инвариантов объекта Course",
	);
}

/**
 * Агрегат курса.
 */
export class CourseAr {
	#state: Course;

	constructor(course: Course) {
		this.#state = validateInvariants(course);
	}

	get state(): Readonly<Course> {
		return structuredClone(this.#state);
	}

	static create(command: CreateCourseCommand): CourseAr {
		const parsed = parseOrThrow(
			CreateCourseCommandSchema,
			command,
			"Некорректная команда создания курса",
		);

		const candidate: CourseWithModules = {
			uuid: crypto.randomUUID(),
			title: parsed.title,
			description: parsed.description,
			authorId: parsed.authorId,
			kind: "modules",
			modules: [],
			status: Status.DRAFT,
			createdAt: isoNow(),
		};

		const result = validateInvariants(candidate);
		return new CourseAr(result);
	}

	changeTitle(title: string): void {
		const updated = { ...this.#state, title, updatedAt: isoNow() };
		this.#state = validateInvariants(updated);
	}

	changeDescription(description: string): void {
		const updated = { ...this.#state, description, updatedAt: isoNow() };
		this.#state = validateInvariants(updated);
	}
}
