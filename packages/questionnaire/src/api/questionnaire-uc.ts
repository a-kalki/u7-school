import { type UcMeta, UseCase } from '@u7-scl/core/api';
import { errAccessDenied, errNotFound } from '@u7-scl/core/domain';
import type { User, UserFacade } from '@u7-scl/user/domain';
import type { QuestionnaireBotFacade } from '../domain/bot-facade';
import type { QuestionnaireApiModuleResolver } from '../domain/module';
import type { QuestionnaireNotFoundUcError } from '../domain/questionnaire/errors';
import { QuestionnairePolicy } from '../domain/questionnaire/policy';
import type {
  QuestionnaireRepo,
  QuestionnaireState,
} from '../domain/questionnaire/repo';

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

  protected get botFacade(): QuestionnaireBotFacade {
    return this.resolve.botFacade;
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

  /** Получает анкету по UUID (без проверки прав) */
  protected async getQuestionnaire(uuid: string): Promise<QuestionnaireState> {
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

  /**
   * Загружает анкету с проверкой права на чтение.
   */
  protected async getQuestionnaireForRead(
    uuid: string,
    actor: User,
  ): Promise<QuestionnaireState> {
    const q = await this.getQuestionnaire(uuid);
    if (!QuestionnairePolicy.canRead(actor, q)) {
      this.throwError(
        errAccessDenied('ACCESS_DENIED', 'Нет доступа к анкете', undefined),
      );
    }
    return q;
  }

  /**
   * Загружает анкету с проверкой права на редактирование.
   */
  protected async getQuestionnaireForEdit(
    uuid: string,
    actor: User,
  ): Promise<QuestionnaireState> {
    const q = await this.getQuestionnaire(uuid);
    if (!QuestionnairePolicy.canEdit(actor, q)) {
      this.throwError(
        errAccessDenied('ACCESS_DENIED', 'Нет доступа к анкете', undefined),
      );
    }
    return q;
  }

  /**
   * Проверяет, что actor имеет право просматривать анкеты пользователя.
   */
  protected ensureCanListForUser(actor: User, userId: string): void {
    if (!QuestionnairePolicy.canListForUser(actor, userId)) {
      this.throwError(
        errAccessDenied(
          'ACCESS_DENIED',
          'Нет доступа к списку анкет пользователя',
          undefined,
        ),
      );
    }
  }
}
