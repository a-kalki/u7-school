import * as v from "valibot";
import { CourseAr } from "#domain/course/a-root";
import type {
	ListCoursesCmd,
	ListCoursesCmdMeta,
} from "#domain/course/commands/list-courses-cmd";
import { ListCoursesCmdSchema } from "#domain/course/commands/list-courses-cmd";
import type { Course } from "#domain/course/entity";
import { CourseSchema } from "#domain/course/entity";
import { CourseUseCase } from "../course-uc";

const CoursesListOutputSchema = v.array(CourseSchema);

/**
 * Use-case получения списка курсов.
 * Без actorId — только PUBLISHED. С actorId — через getOutCourse.
 */
export class ListCoursesUc extends CourseUseCase<ListCoursesCmdMeta> {
	protected readonly ucName = "list-courses" as const;
	protected readonly ucLabel = "Получить список курсов" as const;
	protected readonly arMeta = {
		arName: CourseAr.arName as "Course",
		arLabel: CourseAr.arLabel as "Курс",
	};
	protected readonly type = "query" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = ListCoursesCmdSchema;
	protected readonly outputSchema = CoursesListOutputSchema;

	async execute(command: ListCoursesCmd, actorId?: string): Promise<Course[]> {
		const actor = actorId ? await this.getUser(actorId, actorId) : undefined;

		const courses = await this.resolve.courseRepo.getAll({
			status: command.status,
			authorId: command.authorId,
			title: command.title,
			kind: command.kind,
			tags: command.tags,
			sort: command.sort,
			limit: command.limit,
		});

		// Фильтруем каждый курс через getOutCourse
		const visible: Course[] = [];
		for (const course of courses) {
			try {
				const out = this.getOutCourse(course, actor);
				visible.push(out);
			} catch {
				// Курс не виден — пропускаем
			}
		}
		return visible;
	}
}
