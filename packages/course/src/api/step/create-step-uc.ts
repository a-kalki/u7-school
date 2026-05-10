import { errAccessDenied } from "@u7/core/domain";
import { StepAr } from "#domain/step/a-root";
import {
  type CreateStepCmd,
  type CreateStepCmdMeta,
  CreateStepCmdSchema,
} from "#domain/step/commands/create-step-cmd";
import type { StepAccessDeniedUcError } from "#domain/step/commands/errors";
import type { Step } from "#domain/step/entity";
import { StepSchema } from "#domain/step/entity";
import { StepPolicy } from "#domain/step/policy";
import { CoursePolicy } from "#domain/course/policy";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case создания шага.
 * Требует прав ADMIN/MENTOR + проверка авторства курса через CoursePolicy.
 */
export class CreateStepUc extends CourseUseCase<CreateStepCmdMeta> {
  protected readonly commandName = "create-step" as const;
  protected readonly description = "Создать шаг" as const;
  protected readonly arName = "step" as const;
  protected readonly arLabel = "Шаг" as const;
  protected readonly type = "command" as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateStepCmdSchema;
  protected readonly outputSchema = StepSchema;

  async execute(command: CreateStepCmd, actorId: string): Promise<Step> {
    const actor = await this.resolve.userFacade.getUserByUuid(actorId);
    if (!actor) {
      this.throwError(
        errAccessDenied<StepAccessDeniedUcError>(
          "STEP_ACCESS_DENIED",
          "Пользователь не найден",
          undefined,
        ),
      );
    }

    if (!StepPolicy.canCreate(actor)) {
      this.throwError(
        errAccessDenied<StepAccessDeniedUcError>(
          "STEP_ACCESS_DENIED",
          "Недостаточно прав для создания шага",
          undefined,
        ),
      );
    }

    const course = await this.getCourse(command.courseId);
    if (!CoursePolicy.canEdit(actor, course)) {
      this.throwError(
        errAccessDenied<StepAccessDeniedUcError>(
          "STEP_ACCESS_DENIED",
          "Вы не являетесь автором курса",
          undefined,
        ),
      );
    }

    const ar = StepAr.create(command);
    await this.resolve.stepRepo.save(ar.state);

    return ar.state;
  }
}
