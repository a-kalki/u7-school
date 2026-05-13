import { CourseAr } from "#domain/course/a-root";
import {
	type PublishCourseCmd,
	type PublishCourseCmdMeta,
	PublishCourseCmdSchema,
} from "#domain/course/commands/publish-course-cmd";
import type { Course } from "#domain/course/entity";
import { CourseSchema } from "#domain/course/entity";
import { CoursePolicy } from "#domain/course/policy";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case публикации курса (этап 4).
 * Публиковать может автор или ADMIN.
 */
export class PublishCourseUc extends CourseUseCase<PublishCourseCmdMeta> {
	protected readonly ucName = "publish-course" as const;
	protected readonly ucLabel = "Опубликовать курс (этап 4)" as const;
	protected readonly arMeta = { arName: CourseAr.arName as "Course", arLabel: CourseAr.arLabel as "Курс" };
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = PublishCourseCmdSchema;
	protected readonly outputSchema = CourseSchema;

	async execute(command: PublishCourseCmd, actorId: string): Promise<Course> {
		const course = await this.getCourse(command.courseId);
		const actor = await this.getActor(actorId);

		if (!CoursePolicy.canEdit(actor, course)) {
			this.throwAccessDenied("Недостаточно прав для редактирования курса");
		}

		const ar = new CourseAr(course);
		ar.publish();
		await this.resolve.courseRepo.save(ar.state);

		return ar.state;
	}
}
