import { CoursePolicy } from "#domain/course/policy";
import { StepAr } from "#domain/step/a-root";
import {
	type CreateStepCmd,
	type CreateStepCmdMeta,
	CreateStepCmdSchema,
} from "#domain/step/commands/create-step-cmd";
import type { Step } from "#domain/step/entity";
import { StepSchema } from "#domain/step/entity";
import { StepPolicy } from "#domain/step/policy";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case создания шага.
 * Требует прав ADMIN/MENTOR + проверка авторства курса через CoursePolicy.
 */
export class CreateStepUc extends CourseUseCase<CreateStepCmdMeta> {
	protected readonly ucName = "create-step" as const;
	protected readonly ucLabel = "Создать шаг" as const;
	protected readonly arMeta = { arName: StepAr.arName as "Step", arLabel: StepAr.arLabel as "Шаг" };
	protected readonly type = "command" as const;
	protected readonly requiresAuth = true as const;
	protected readonly inputSchema = CreateStepCmdSchema;
	protected readonly outputSchema = StepSchema;

	async execute(command: CreateStepCmd, actorId: string): Promise<Step> {
		const actor = await this.getActor(actorId);

		if (!StepPolicy.canCreate(actor)) {
			this.throwAccessDenied("Недостаточно прав для создания шага");
		}

		const course = await this.getCourse(command.courseId);
		if (!CoursePolicy.canEdit(actor, course)) {
			this.throwAccessDenied("Вы не являетесь автором курса");
		}

		const steps = await this.resolve.stepRepo.getByCourseId(command.courseId);

		const ar = StepAr.create(command);
		await this.resolve.stepRepo.save(ar.state);

		return ar.state;
	}
}
