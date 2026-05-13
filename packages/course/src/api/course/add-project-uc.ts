import { CourseAr } from "#domain/course/a-root";
import {
	type AddProjectCmd,
	type AddProjectCmdMeta,
	AddProjectCmdSchema,
} from "#domain/course/commands/add-project-cmd";
import type { Course } from "#domain/course/entity";
import { CourseSchema } from "#domain/course/entity";
import { CoursePolicy } from "#domain/course/policy";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case добавления проекта в курс (этап 3b).
 * Редактировать может автор или ADMIN.
 */
export class AddProjectUc extends CourseUseCase<AddProjectCmdMeta> {
	protected readonly ucName = "add-project" as const;
	protected readonly ucLabel = "Добавить проект в курс" as const;
	protected readonly arMeta = {
		arName: CourseAr.arName as "Course",
		arLabel: CourseAr.arLabel as "Курс",
	};
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = AddProjectCmdSchema;
	protected readonly outputSchema = CourseSchema;

	async execute(command: AddProjectCmd, actorId: string): Promise<Course> {
		const course = await this.getCourse(command.courseId);
		const actor = await this.getActor(actorId);

		if (!CoursePolicy.canEdit(actor, course)) {
			this.throwAccessDenied("Недостаточно прав для редактирования курса");
		}

		const ar = new CourseAr(course);
		ar.addProject(command);
		await this.resolve.courseRepo.save(ar.state);

		return ar.state;
	}
}
