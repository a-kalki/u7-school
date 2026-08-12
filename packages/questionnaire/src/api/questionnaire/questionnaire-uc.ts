import { type UcMeta, UseCase } from '@u7-scl/core/api';
import { errNotFound } from '@u7-scl/core/domain';
import type { User, UserFacade } from '@u7-scl/user/domain';
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

  protected get userFacade(): UserFacade {
    return this.resolve.userFacade;
  }

  /** Получает пользователя по actorId или выбрасывает ошибку */
  protected async getUser(actorId: string): Promise<User> {
    const user = await this.userFacade.getUserByUuid(actorId);
    if (!user) {
      this.throwError(
        errNotFound<QuestionnaireNotFoundUcError>(
          'QUESTIONNAIRE_NOT_FOUND',
          'Пользователь не найден',
          { uuid: actorId },
        ),
      );
    }
    return user;
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
}
