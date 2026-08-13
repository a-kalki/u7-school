import * as v from 'valibot';
import type { BaseQuestionnaireArMeta } from '../entity';
import type {
  AccessDeniedUcError,
  BadRequestUcError,
  InternalUcError,
  QuestionnaireNotFoundUcError,
} from './errors';

export const AbandonCmdSchema = v.object({
  questionnaireId: v.pipe(v.string(), v.uuid()),
});

export type AbandonCmd = v.InferOutput<typeof AbandonCmdSchema>;

export interface AbandonCmdMeta {
  ucName: 'abandon';
  arMeta: BaseQuestionnaireArMeta;
  input: AbandonCmd;
  output: undefined;
  errors: AbandonCmdError;
  requiresAuth: true;
  type: 'command';
}

export type AbandonCmdError =
  | BadRequestUcError
  | InternalUcError
  | QuestionnaireNotFoundUcError
  | AccessDeniedUcError;
