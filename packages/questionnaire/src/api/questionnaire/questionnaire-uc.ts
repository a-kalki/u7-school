import { type UcMeta, UseCase } from '@u7-scl/core/api';
import { errNotFound } from '@u7-scl/core/domain';
import type { QuestionnaireApiModuleResolver } from '../../domain/module';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import type { QuestionnaireNotFoundUcError } from '../../domain/questionnaire/errors';
import type { QuestionnaireRepo } from '../../domain/questionnaire/repo';

/**
 * Абстрактный UseCase для модуля questionnaire.
 */
export abstract class QuestionnaireUseCase<
  TMeta extends UcMeta,
> extends UseCase<TMeta, QuestionnaireApiModuleResolver> {
  protected get repo(): QuestionnaireRepo {
    return this.resolve.questionnaireRepo;
  }

  /** Получает анкету по UUID или выбрасывает ошибку */
  protected async getQuestionnaire(uuid: string): Promise<Questionnaire> {
    const q = await this.repo.getByUuid(uuid);
    if (!q) {
      this.throwError(
        errNotFound<QuestionnaireNotFoundUcError>(
          'QUESTIONNAIRE_NOT_FOUND',
          'Анкета не найдена',
          { uuid },
        ),
      );
    }
    return q;
  }

  /** Находит активную анкету пользователя */
  protected async getActiveQuestionnaire(
    telegramId: number,
  ): Promise<Questionnaire | undefined> {
    const all = await this.repo.getByRespondentId(telegramId);
    return all.find(
      (q) => q.status === 'in_progress' || q.status === 'intention',
    );
  }
}
