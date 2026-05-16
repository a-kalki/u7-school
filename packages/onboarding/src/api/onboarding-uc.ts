import { type UcMeta, UseCase } from '@u7/core/api';
import { errNotFound } from '@u7/core/domain';
import type { OnboardingApiModuleResolver } from '#domain/module';
import type { Questionnaire } from '#domain/questionnaire/entity';
import type { QuestionnaireNotFoundUcError } from '#domain/questionnaire/errors';

/**
 * Базовый класс для всех use-case'ов модуля onboarding.
 */
export abstract class OnboardingUseCase<TMeta extends UcMeta> extends UseCase<
  TMeta,
  OnboardingApiModuleResolver
> {
  /**
   * Получает анкету по UUID.
   * Выбрасывает ошибку, если не найдена.
   */
  protected async getQuestionnaire(uuid: string): Promise<Questionnaire> {
    const questionnaire = await this.resolve.questionnaireRepo.getByUuid(uuid);
    if (!questionnaire) {
      this.throwError(
        errNotFound<QuestionnaireNotFoundUcError>(
          'QUESTIONNAIRE_NOT_FOUND',
          'Анкета не найдена',
          { uuid },
        ),
      );
    }
    return questionnaire;
  }
}
