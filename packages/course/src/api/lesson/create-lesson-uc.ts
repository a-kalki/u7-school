import { errAccessDenied } from "@u7/core/domain";
import { CoursePolicy } from "#domain/course/policy";
import { LessonAr } from "#domain/lesson/a-root";
import {
	type CreateLessonCmd,
	type CreateLessonCmdMeta,
	CreateLessonCmdSchema,
} from "#domain/lesson/commands/create-lesson-cmd";
import type { LessonAccessDeniedUcError } from "#domain/lesson/commands/errors";
import type { Lesson } from "#domain/lesson/entity";
import { LessonSchema } from "#domain/lesson/entity";
import { LessonPolicy } from "#domain/lesson/policy";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case создания урока.
 * Требует прав ADMIN/MENTOR + проверка авторства курса через CoursePolicy.
 */
export class CreateLessonUc extends CourseUseCase<CreateLessonCmdMeta> {
	protected readonly commandName = "create-lesson" as const;
	protected readonly description = "Создать урок" as const;
	protected readonly arName = "lesson" as const;
	protected readonly arLabel = "Урок" as const;
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = CreateLessonCmdSchema;
	protected readonly outputSchema = LessonSchema;

	async execute(command: CreateLessonCmd, actorId: string): Promise<Lesson> {
		const actor = await this.resolve.userFacade.getUserByUuid(actorId);
		if (!actor) {
			this.throwError(
				errAccessDenied<LessonAccessDeniedUcError>(
					"LESSON_ACCESS_DENIED",
					"Пользователь не найден",
					undefined,
				),
			);
		}

		// Проверка базовых прав (ADMIN/MENTOR)
		if (!LessonPolicy.canCreate(actor)) {
			this.throwError(
				errAccessDenied<LessonAccessDeniedUcError>(
					"LESSON_ACCESS_DENIED",
					"Недостаточно прав для создания урока",
					undefined,
				),
			);
		}

		// Проверка авторства курса (MENTOR может создавать только в своих курсах)
		const course = await this.getCourse(command.courseId);
		if (!CoursePolicy.canEdit(actor, course)) {
			this.throwError(
				errAccessDenied<LessonAccessDeniedUcError>(
					"LESSON_ACCESS_DENIED",
					"Вы не являетесь автором курса",
					undefined,
				),
			);
		}

		const ar = LessonAr.create(command);
		await this.resolve.lessonRepo.save(ar.state);

		return ar.state;
	}
}
