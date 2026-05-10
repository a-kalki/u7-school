import { errNotFound } from "@u7/core/domain";
import {
  type GetStepCmd,
  type GetStepCmdMeta,
  GetStepCmdSchema,
} from "#domain/step/commands/get-step-cmd";
import type { StepNotFoundUcError } from "#domain/step/commands/errors";
import type { Step } from "#domain/step/entity";
import { StepSchema } from "#domain/step/entity";
import { CourseUseCase } from "../course-uc";

/**
 * Use-case получения шага по UUID.
 * Доступно всем.
 */
export class GetStepUc extends CourseUseCase<GetStepCmdMeta> {
  protected readonly commandName = "get-step" as const;
  protected readonly description = "Получить шаг по UUID" as const;
  protected readonly arName = "step" as const;
  protected readonly arLabel = "Шаг" as const;
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetStepCmdSchema;
  protected readonly outputSchema = StepSchema;

  async execute(command: GetStepCmd): Promise<Step> {
    const step = await this.resolve.stepRepo.getByUuid(command.uuid);
    if (!step) {
      this.throwError(
        errNotFound<StepNotFoundUcError>(
          "STEP_NOT_FOUND",
          "Шаг не найден",
          { uuid: command.uuid },
        ),
      );
    }
    return step;
  }
}
