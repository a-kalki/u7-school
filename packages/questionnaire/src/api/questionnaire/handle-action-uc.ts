import { errBadRequest } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { BadRequestUcError } from '../../domain/questionnaire/errors';
import { QuestionnaireUseCase } from './questionnaire-uc';
import type { HandleActionUcMeta } from './uc-metas';

const HandleActionCmdSchema = v.object({
  telegramId: v.pipe(v.number(), v.minValue(1)),
  type: v.picklist(['callback', 'text']),
  value: v.string(),
});

export class HandleActionUc extends QuestionnaireUseCase<HandleActionUcMeta> {
  protected readonly ucName = 'handle-action' as const;
  protected readonly ucLabel = 'Обработать действие в анкете' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = HandleActionCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: { telegramId: number; type: 'callback' | 'text'; value: string },
    _actorId: string,
  ): Promise<unknown> {
    const active = await this.getActiveQuestionnaire(command.telegramId);

    if (!active) {
      this.throwError(
        errBadRequest<BadRequestUcError>(
          'BAD_REQUEST',
          'У тебя нет активной анкеты',
          { telegramId: String(command.telegramId) },
        ),
      );
    }

    const ar = new QuestionnaireAr(active);
    const response = ar.handleAction(
      { type: command.type, value: command.value },
      this.resolve.questionnaireEngine,
    );

    await this.repo.save(ar.state);

    return response;
  }
}
