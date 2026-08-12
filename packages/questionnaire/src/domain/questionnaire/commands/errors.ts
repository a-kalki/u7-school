import type {
  AccessDeniedError,
  BadRequestError,
  ConflictError,
  InternalError,
  NotFoundError,
} from '@u7-scl/core/domain';

/** Анкета не найдена */
export type QuestionnaireNotFoundUcError = NotFoundError<
  'QUESTIONNAIRE_NOT_FOUND',
  { uuid: string } | undefined
>;

/** Доступ запрещён */
export type AccessDeniedUcError = AccessDeniedError<'ACCESS_DENIED', undefined>;

/** Некорректный запрос */
export type BadRequestUcError = BadRequestError<'BAD_REQUEST', unknown>;

/** Внутренняя ошибка */
export type InternalUcError = InternalError<'INTERNAL_ERROR', unknown>;

/** У пользователя уже есть активная анкета */
export type QuestionnaireActiveUcError = ConflictError<
  'QUESTIONNAIRE_ACTIVE',
  { userId: string } | undefined
>;

/** Любая известная ошибка модуля questionnaire */
export type QuestionnaireModuleError =
  | QuestionnaireNotFoundUcError
  | QuestionnaireActiveUcError
  | BadRequestUcError
  | InternalUcError
  | AccessDeniedUcError;
