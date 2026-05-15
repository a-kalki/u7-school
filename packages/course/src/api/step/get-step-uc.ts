import { errNotFound } from '@u7/core/domain';
import { StepAr } from '#domain/step/a-root';
import type { StepNotFoundUcError } from '#domain/step/commands/errors';
import {
  type GetStepCmd,
  type GetStepCmdMeta,
  GetStepCmdSchema,
} from '#domain/step/commands/get-step-cmd';
import type { Step } from '#domain/step/entity';
import { StepSchema } from '#domain/step/entity';
import type { StepRepo } from '#domain/step/repo';
import { CourseUseCase } from '../course-uc';

/**
 * Use-case получения шага по UUID.
 * Без actorId — только PUBLISHED. С actorId — через StepPolicy.
 */
export class GetStepUc extends CourseUseCase<GetStepCmdMeta> {
  protected readonly ucName = 'get-step' as const;
  protected readonly ucLabel = 'Получить шаг по UUID' as const;
  protected readonly arMeta = {
    arName: StepAr.arName as 'Step',
    arLabel: StepAr.arLabel as 'Шаг',
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetStepCmdSchema;
  protected readonly outputSchema = StepSchema;

  async execute(command: GetStepCmd, actorId?: string): Promise<Step> {
    const step = await (this.resolve.stepRepo as StepRepo).getByUuid(
      command.uuid,
    );
    if (!step) {
      this.throwError(
        errNotFound<StepNotFoundUcError>('STEP_NOT_FOUND', 'Шаг не найден', {
          uuid: command.uuid,
        }),
      );
    }

    const actor = actorId ? await this.getUser(actorId, actorId) : undefined;

    return this.getOutStep(step, actor);
  }
}
