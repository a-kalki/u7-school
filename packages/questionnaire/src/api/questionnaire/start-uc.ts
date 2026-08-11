import { errConflict } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { QuestionnaireAr } from '../../domain/questionnaire/a-root';
import type { QuestionnaireActiveUcError } from '../../domain/questionnaire/errors';
import { QuestionnaireUseCase } from './questionnaire-uc';
import type { StartUcMeta } from './uc-metas';

const StartCmdSchema = v.object({
  telegramId: v.pipe(v.number(), v.minValue(1)),
});

export class StartUc extends QuestionnaireUseCase<StartUcMeta> {
  protected readonly ucName = 'start' as const;
  protected readonly ucLabel = 'Запустить анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = StartCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: { telegramId: number },
    _actorId: string,
  ): Promise<unknown> {
    const hasActive = !!(await this.getActiveQuestionnaire(command.telegramId));
    if (hasActive) {
      this.throwError(
        errConflict<QuestionnaireActiveUcError>(
          'QUESTIONNAIRE_ACTIVE',
          'У тебя уже есть активная анкета',
          { userId: String(command.telegramId) },
        ),
      );
    }

    const pool = this.resolve.questionnaireEngine.getAll();
    const ar = QuestionnaireAr.startNew(command.telegramId, pool);
    await this.repo.save(ar.state);

    return ar.getCurrent();
  }
}
