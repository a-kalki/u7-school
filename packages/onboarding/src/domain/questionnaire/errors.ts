import type {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@u7/core/domain';

/** Ошибка валидации ответа анкеты */
export type QuestionnaireValidationUcError = ValidationError<
  'QUESTIONNAIRE_VALIDATION',
  { questionCode: string; issues?: string[] } | undefined
>;

/** Анкета уже завершена */
export type QuestionnaireCompletedUcError = ConflictError<
  'QUESTIONNAIRE_COMPLETED',
  { uuid: string } | undefined
>;

/** Вопрос не найден в пуле */
export type QuestionNotFoundUcError = NotFoundError<
  'QUESTION_NOT_FOUND',
  { questionCode: string } | undefined
>;

/** Анкета не найдена */
export type QuestionnaireNotFoundUcError = NotFoundError<
  'QUESTIONNAIRE_NOT_FOUND',
  { uuid: string } | undefined
>;

/** Доступ запрещён */
export type AccessDeniedUcError = AccessDeniedError<'ACCESS_DENIED', undefined>;

/** Любая известная ошибка модуля questionnaire */
export type QuestionnaireModuleError =
  | QuestionnaireValidationUcError
  | QuestionnaireCompletedUcError
  | QuestionNotFoundUcError
  | QuestionnaireNotFoundUcError
  | AccessDeniedUcError;
