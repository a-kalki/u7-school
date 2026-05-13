import { CourseAr } from "#domain/course/a-root";
import {
	type EnrichCourseCmd,
	type EnrichCourseCmdMeta,
	EnrichCourseCmdSchema,
} from "#domain/course/commands/enrich-course-cmd";
import type { Course } from "#domain/course/entity";
import { CourseSchema } from "#domain/course/entity";
import { CoursePolicy } from "#domain/course/policy";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case обогащения курса (этап 2).
 * Устанавливает дополнительные поля: targetAudience, goal, result и т.д.
 * Редактировать может автор или ADMIN.
 */
export class EnrichCourseUc extends CourseUseCase<EnrichCourseCmdMeta> {
	protected readonly ucName = "enrich-course" as const;
	protected readonly ucLabel = "Обогатить курс" as const;
	protected readonly arMeta = {
		arName: CourseAr.arName as "Course",
		arLabel: CourseAr.arLabel as "Курс",
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = EnrichCourseCmdSchema;
	protected readonly outputSchema = CourseSchema;

	async execute(command: EnrichCourseCmd, actorId: string): Promise<Course> {
		const course = await this.getCourse(command.courseId);
		const actor = await this.getActor(actorId);

		if (!CoursePolicy.canEdit(actor, course)) {
			this.throwAccessDenied("Недостаточно прав для редактирования курса");
		}

		const ar = new CourseAr(course);
		ar.enrich(command);
		await this.resolve.courseRepo.save(ar.state);

		return ar.state;
	}
}
