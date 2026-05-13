import { CourseAr } from "#domain/course/a-root";
import {
	type AddProjectToModuleCmd,
	type AddProjectToModuleCmdMeta,
	AddProjectToModuleCmdSchema,
} from "#domain/course/commands/add-project-to-module-cmd";
import type { Course } from "#domain/course/entity";
import { CourseSchema } from "#domain/course/entity";
import { CoursePolicy } from "#domain/course/policy";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case добавления проекта в модуль курса.
 * Редактировать может автор или ADMIN.
 */
export class AddProjectToModuleUc extends CourseUseCase<AddProjectToModuleCmdMeta> {
	protected readonly ucName = "add-project-to-module" as const;
	protected readonly ucLabel = "Добавить проект в модуль курса" as const;
	protected readonly arMeta = { arName: CourseAr.arName as "Course", arLabel: CourseAr.arLabel as "Курс" };
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = AddProjectToModuleCmdSchema;
	protected readonly outputSchema = CourseSchema;

	async execute(
		command: AddProjectToModuleCmd,
		actorId: string,
	): Promise<Course> {
		const course = await this.getCourse(command.courseId);
		const actor = await this.getActor(actorId);

		if (!CoursePolicy.canEdit(actor, course)) {
			this.throwAccessDenied("Недостаточно прав для редактирования курса");
		}

		const ar = new CourseAr(course);
		ar.addProjectToModule(command.moduleUuid, {
			courseId: command.courseId,
			title: command.title,
			goal: command.goal,
			result: command.result,
			additional: command.additional,
		});
		await this.resolve.courseRepo.save(ar.state);

		return ar.state;
	}
}
