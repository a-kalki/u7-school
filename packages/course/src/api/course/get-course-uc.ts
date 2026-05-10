import {
	type GetCourseCmd,
	type GetCourseCmdMeta,
	GetCourseCmdSchema,
} from "#domain/course/commands/get-course-cmd";
import type { Course } from "#domain/course/entity";
import { CourseSchema } from "#domain/course/entity";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case получения курса по UUID.
 * Доступно всем.
 */
export class GetCourseUc extends CourseUseCase<GetCourseCmdMeta> {
	protected readonly commandName = "get-course" as const;
	protected readonly description = "Получить курс по UUID" as const;
	protected readonly arName = "course" as const;
	protected readonly arLabel = "Курс" as const;
	protected readonly type = "query" as const;
	protected readonly requiresAuth = false as const;
	protected readonly inputSchema = GetCourseCmdSchema;
	protected readonly outputSchema = CourseSchema;

	async execute(command: GetCourseCmd): Promise<Course> {
		return this.getCourse(command.uuid);
	}
}
