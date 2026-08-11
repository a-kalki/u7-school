import { errBadRequest } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { BadRequestUcError } from '../../domain/questionnaire/errors';
import { QuestionnaireUseCase } from './questionnaire-uc';
import type { AbandonUcMeta } from './uc-metas';

const AbandonCmdSchema = v.object({
  telegramId: v.pipe(v.number(), v.minValue(1)),
});

export class AbandonUc extends QuestionnaireUseCase<AbandonUcMeta> {
  protected readonly ucName = 'abandon' as const;
  protected readonly ucLabel = 'Прервать анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = AbandonCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: { telegramId: number },
    _actorId: string,
  ): Promise<void> {
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
    ar.abandon();
    await this.repo.save(ar.state);
  }
}
