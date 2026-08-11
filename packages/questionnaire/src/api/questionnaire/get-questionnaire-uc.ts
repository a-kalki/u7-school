import { errNotFound } from '@u7-scl/core/domain';
import * as v from 'valibot';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import type { QuestionnaireNotFoundUcError } from '../../domain/questionnaire/errors';
import { QuestionnaireUseCase } from './questionnaire-uc';
import type { GetQuestionnaireUcMeta } from './uc-metas';

const GetCmdSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid()),
});

export class GetQuestionnaireUc extends QuestionnaireUseCase<GetQuestionnaireUcMeta> {
  protected readonly ucName = 'get-questionnaire' as const;
  protected readonly ucLabel = 'Получить анкету' as const;
  protected readonly arMeta = {
    arName: 'Questionnaire' as const,
    arLabel: 'Анкета' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: { uuid: string },
    _actorId: string,
  ): Promise<Questionnaire> {
    const q = await this.repo.getByUuid(command.uuid);

    if (!q) {
      this.throwError(
        errNotFound<QuestionnaireNotFoundUcError>(
          'QUESTIONNAIRE_NOT_FOUND',
          `Анкета "${command.uuid}" не найдена`,
          { uuid: command.uuid },
        ),
      );
    }

    return q;
  }
}
