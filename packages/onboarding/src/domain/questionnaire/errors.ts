import type {
  AccessDeniedError,
  BadRequestError,
  ConflictError,
  InternalError,
  NotFoundError,
} from '@u7-scl/core/domain';

/** У пользователя уже есть активная анкета */
export type QuestionnaireActiveUcError = ConflictError<
  'QUESTIONNAIRE_ACTIVE',
  { userId: string } | undefined
>;

/** Анкета не найдена */
export type QuestionnaireNotFoundUcError = NotFoundError<
  'QUESTIONNAIRE_NOT_FOUND',
  { uuid: string } | undefined
>;

/** Доступ запрещён */
export type AccessDeniedUcError = AccessDeniedError<'ACCESS_DENIED', undefined>;

/** Некорректный запрос (не тот вопрос, неверный формат ответа) */
export type BadRequestUcError = BadRequestError<'BAD_REQUEST', unknown>;

/** Внутренняя ошибка (баг, повреждение данных) */
export type InternalUcError = InternalError<'INTERNAL_ERROR', unknown>;

/** Любая известная ошибка модуля questionnaire */
export type QuestionnaireModuleError =
  | QuestionnaireActiveUcError
  | QuestionnaireNotFoundUcError
  | BadRequestUcError
  | InternalUcError
  | AccessDeniedUcError;
